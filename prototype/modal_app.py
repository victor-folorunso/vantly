"""The song to tonic solfa service on Modal, for vantly.xyz/song-to-tonic-solfa.

The same API as server.py, which stays the way to run it on one machine. Here
the pieces that server.py keeps in memory live somewhere every container can
see, because Modal runs the web side and the GPU side in different containers:

    the songs and results      a Volume (solfaflow-data), /data/uploads and /data/output
    each song's status         a Dict (solfaflow-jobs), so polling never waits on the Volume
    the latest solfa.json      a Dict (solfaflow-results), for the same reason
    uploads per IP per hour    a Dict (solfaflow-rate), hashed, as in Vantly's convert.py

The web endpoint is cheap and CPU only. Each upload spawns `transcribe` on a
GPU, which runs the same pipeline (solfaflow_proto.run) as the local server.
Audio files (song.wav, synth_NNN.wav) are served from the Volume.

Deploy, from the repository root:

    modal deploy prototype/modal_app.py

The URL it prints goes in Vantly as NEXT_PUBLIC_SOLFA_URL. The model files are
taken from prototype/models, where setting up the prototype put them; they are
not in git.
"""

import hashlib
import json
import shutil
import time
import traceback
import uuid
from pathlib import Path

import modal

LOCAL = Path(__file__).resolve().parent  # prototype/, on the machine that deploys
APP_DIR = "/app/prototype"
DATA = Path("/data")
UPLOADS = DATA / "uploads"
OUTPUT = DATA / "output"

ALLOWED_SUFFIXES = {".mp3", ".wav", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".webm", ".mp4"}
MAX_UPLOAD_BYTES = 60 * 1024 * 1024
# Longest stretch of a song transcribed. Covers nearly every song and caps what one upload can cost.
MAX_SECONDS = 600
SONGS_PER_HOUR = 6  # per IP; well above a person, well below a script
WINDOW = 3600
# A running song whose progress has not moved for this long died with its container, and a
# queued one never got a GPU (a redeploy drops queued calls).
STALE_SECONDS = {"running": 15 * 60, "queued": 2 * 3600}
ORIGINS = [
    "https://vantly.xyz",
    "https://www.vantly.xyz",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app = modal.App("solfaflow")
volume = modal.Volume.from_name("solfaflow-data", create_if_missing=True)
jobs = modal.Dict.from_name("solfaflow-jobs", create_if_missing=True)
results = modal.Dict.from_name("solfaflow-results", create_if_missing=True)
buckets = modal.Dict.from_name("solfaflow-rate", create_if_missing=True)

# Versions as in the prototype's .venv, where the pipeline was tested; torch is the CUDA build here.
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "torch==2.14.1",
        "torchaudio",
        "audio-separator==0.30.2",
        # audio-separator imports it at load. The vocal model is a torch one and runs on the GPU regardless.
        "onnxruntime==1.31.0",
        "numpy==1.26.4",
        "scipy==1.17.1",
        "librosa==0.11.0",
        "soundfile==0.14.0",
        "imageio-ffmpeg==0.6.0",
        "lightning==2.6.6",
        "torchmetrics==1.9.0",
        "einops==0.8.2",
        "omegaconf==2.4.0",
        "pydantic==2.14.1",
        "loguru==0.7.3",
        "mido==1.3.3",
        "resampy==0.4.3",
        "h5py==3.16.0",
        "matplotlib==3.11.2",
        "click==8.5.0",
        # The rest of vendor/GAME/requirements.txt, so nothing it imports on some path is missing.
        "colorednoise==2.2.0",
        "tensorboard==2.21.0",
        "tensorboardx==2.6.5",
        "onnx==1.23.2",
        "onnxscript==0.7.2",
        "onnxslim==0.1.98",
        "sympy==1.14.0",
        "tqdm==4.70.1",
        "fastapi[standard]==0.161.1",
        "python-multipart==0.0.32",
    )
    .env({"PYTHONPATH": APP_DIR})
    .add_local_dir(LOCAL.parent / "backend", "/app/backend", ignore=["**/__pycache__", "tests"])
    .add_local_dir(
        LOCAL,
        APP_DIR,
        ignore=[".venv", "output", "uploads", "samples", "models", "bin", "tests", "web",
                "**/__pycache__", ".pytest_cache", "modal_app.py"],
    )
    .add_local_dir(LOCAL / "models" / "separator", f"{APP_DIR}/models/separator")
    .add_local_dir(LOCAL / "models" / "game-medium" / "GAME-1.0-medium",
                   f"{APP_DIR}/models/game-medium/GAME-1.0-medium")
)


# At module level, because FastAPI resolves the endpoints' parameter types from the module's globals.
with image.imports():
    from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse, Response


def update(job_id: str, **fields) -> None:
    jobs[job_id] = jobs[job_id] | fields | {"updated": time.time()}


@app.function(image=image, gpu=["L4", "A10G", "T4"], volumes={"/data": volume}, timeout=30 * 60,
              max_containers=1, scaledown_window=120)
def transcribe(job_id: str) -> None:
    """One song, start to finish. max_containers=1 makes uploads queue rather than multiply GPUs."""
    from solfaflow_proto import run

    volume.reload()  # the upload was committed by the web container
    job = jobs[job_id]
    # The pipeline works on local disk; chunks and stems are never served, so they never touch the Volume.
    local = Path("/tmp/solfaflow") / job_id
    out_dir = OUTPUT / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    def on_progress(progress: dict) -> None:
        # run() calls this right after every publish, so the newest results go out here.
        solfa = local / "solfa.json"
        if solfa.exists():
            served = {"song.wav", "solfa.json"} | {json.loads(solfa.read_text(encoding="utf-8"))["synth_file"]}
            for name in served:
                if not (out_dir / name).exists() or name == "solfa.json":
                    shutil.copy(local / name, out_dir / name)
            for old in out_dir.glob("synth_*.wav"):
                if old.name not in served:
                    old.unlink(missing_ok=True)
            results[job_id] = solfa.read_text(encoding="utf-8")
            volume.commit()  # the new synth track, before the player is told about it
        update(job_id, **progress)

    update(job_id, status="running", started=time.time())
    try:
        result = run(Path(job["upload"]), local, do=job["do"], skip_separation=job["skip_separation"],
                     seconds=job["seconds"], title=job["name"], on_progress=on_progress)
        update(job_id, status="done", stage="done", finished=time.time(), do=result["do"],
               notes=len(result["notes"]), audio_seconds=round(result["duration"], 1))
    except Exception as exc:  # surfaced to the page; there is no retry
        traceback.print_exc()
        update(job_id, status="error", error=f"{type(exc).__name__}: {exc}", finished=time.time())
    finally:
        shutil.rmtree(local, ignore_errors=True)


@app.function(image=image, volumes={"/data": volume}, scaledown_window=300)
@modal.concurrent(max_inputs=20)
@modal.asgi_app()
def web():
    from keyboard import NOTE_NAMES
    from solfaflow_proto import pretty_name

    api = FastAPI(title="Song to tonic solfa")
    api.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["GET", "POST", "DELETE"],
                       allow_headers=["*"])

    def allow(ip: str) -> bool:
        """A fixed window per hashed IP, as Vantly's convert.py does; the address itself is never stored."""
        key = hashlib.sha256(f"{ip}:{int(time.time() // WINDOW)}".encode()).hexdigest()[:32]
        used = buckets.get(key, 0)
        if used >= SONGS_PER_HOUR:
            return False
        buckets[key] = used + 1
        return True

    def public(job: dict) -> dict:
        stale = STALE_SECONDS.get(job["status"])
        if stale and time.time() - job.get("updated", job["created"]) > stale:
            job = job | {"status": "error", "error": "Stopped before finishing. Upload it again to retry."
                         if job["status"] == "queued" else
                         "Stopped part way through. What was finished can still be opened."}
        position = None
        if job["status"] == "queued":
            queued = sorted(j["created"] for j in jobs.values() if j["status"] == "queued")
            position = queued.index(job["created"]) + 1 if job["created"] in queued else None
        return {k: v for k, v in job.items() if k not in ("upload", "ip")} | {"queue_position": position}

    @api.get("/health")
    def health():
        return {"ok": True}

    @api.post("/api/jobs")
    def create_job(request: Request, file: UploadFile = File(...), seconds: float = Form(0),
                         do: str = Form(""), skip_separation: bool = Form(False)) -> dict:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in ALLOWED_SUFFIXES:
            raise HTTPException(400, f"Unsupported file type '{suffix}'. Use one of: "
                                     f"{', '.join(sorted(ALLOWED_SUFFIXES))}")
        if do and do not in NOTE_NAMES:
            raise HTTPException(400, "do must be a note name like C, F# or A")
        # Not async: the Dict and spawn calls below block, so FastAPI runs this in a worker thread.
        data = file.file.read(MAX_UPLOAD_BYTES + 1)
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "File is larger than 60 MB")
        if not data:
            raise HTTPException(400, "That file is empty.")
        # Modal sits behind a proxy; the left-most forwarded address is the caller.
        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or "unknown"
        if not allow(ip):
            raise HTTPException(429, f"That is {SONGS_PER_HOUR} songs in an hour, which is the limit. "
                                     "Try again later.")

        job_id = uuid.uuid4().hex[:10]
        UPLOADS.mkdir(parents=True, exist_ok=True)
        upload = UPLOADS / f"{job_id}{suffix}"
        upload.write_bytes(data)
        volume.commit()
        now = time.time()
        jobs[job_id] = {
            "id": job_id, "name": pretty_name(Path(file.filename).stem), "status": "queued", "stage": "queued",
            "created": now, "updated": now, "upload": str(upload),
            "seconds": min(seconds, MAX_SECONDS) if seconds > 0 else MAX_SECONDS,
            "do": do or None, "skip_separation": skip_separation,
        }
        transcribe.spawn(job_id)
        return public(jobs[job_id])

    @api.get("/api/jobs")
    def list_jobs(ids: str = "") -> list[dict]:
        """The songs with these comma-separated ids, newest first. There is no listing everything here."""
        found = [jobs.get(i) for i in dict.fromkeys(i for i in ids.split(",") if i)]
        return [public(j) for j in sorted(filter(None, found), key=lambda j: j["created"], reverse=True)]

    @api.get("/api/jobs/{job_id}")
    def get_job(job_id: str) -> dict:
        job = jobs.get(job_id)
        if job is None:
            raise HTTPException(404, "No such job")
        return public(job)

    @api.delete("/api/jobs/{job_id}")
    def delete_job(job_id: str) -> dict:
        """Remove a song, its upload and its results. A song in the queue or being worked on is refused."""
        job = jobs.get(job_id)
        if job is None:
            raise HTTPException(404, "No such job")
        if public(job)["status"] in ("queued", "running"):
            raise HTTPException(409, "A song can be deleted once it has finished")
        jobs.pop(job_id, None)
        results.pop(job_id, None)
        # job_id is a key this service made, never a path from the request.
        shutil.rmtree(OUTPUT / job_id, ignore_errors=True)
        for upload in UPLOADS.glob(f"{job_id}.*"):
            upload.unlink(missing_ok=True)
        volume.commit()
        return {"deleted": job_id}

    def reload_volume() -> None:
        """See files the GPU container committed. Refused while a file is open here, so retried briefly."""
        for _ in range(5):
            try:
                volume.reload()
                return
            except Exception:
                time.sleep(0.2)

    @api.get("/results/{job_id}/{name}")
    def result_file(job_id: str, name: str):
        if job_id not in jobs or name != Path(name).name or name.startswith("."):
            raise HTTPException(404, "Not found")
        no_store = {"Cache-Control": "no-store"}
        if name == "solfa.json":
            text = results.get(job_id)
            if text is None:
                raise HTTPException(404, "Not ready yet")
            return Response(text, media_type="application/json", headers=no_store)
        path = OUTPUT / job_id / name
        if not path.exists():
            reload_volume()
        if not path.exists() or path.suffix != ".wav":
            raise HTTPException(404, "Not found")
        # A synth track is never rewritten (each version has its own name), and nor is song.wav.
        return FileResponse(path, media_type="audio/wav")

    return api
