"""
Office and document conversion, on Modal.

One container with LibreOffice in it, exposed as an HTTP endpoint. It converts
anything LibreOffice understands into PDF, and the browser does the rest: the
site already renders PDFs with pdf.js, so a PPTX viewer is this endpoint plus
the viewer that exists.

That is the reason this is worth standing up. It is not one tool. The same
container serves the DOCX, XLSX and PPTX viewers, and Word to PDF, Excel to
PDF, PowerPoint to PDF, EPUB to PDF and HTML to PDF, which is about ten
entries off the list from one install.

Deploy:

    pip install modal
    modal setup                  # opens a browser once, stores a token
    modal deploy server/convert.py

That prints a URL. Put it in the site as NEXT_PUBLIC_CONVERT_URL.

Costs nothing while nobody calls it. Modal bills per second of actual
execution, so an idle endpoint is free.
"""

import os
import hashlib
import shutil
import subprocess
import time
import tempfile
import uuid

import modal

app = modal.App("vantly-convert")

# Rate limiting state, shared across containers so the limit is a real limit
# rather than one per container. A plain dict would reset every cold start and
# a busy period would silently run several independent allowances.
buckets = modal.Dict.from_name("vantly-convert-rate", create_if_missing=True)

# Per IP, per hour. Set well above what a person converting their own files
# does and well below what a script pointed at the endpoint would want. CORS
# stops a browser on another origin, but it does nothing about curl, so this
# is the part that actually protects the bill.
PER_HOUR = 40
WINDOW = 3600

# ── The image ────────────────────────────────────────────────────────────────
#
# The fonts are not optional and are the classic reason a conversion "works"
# and looks wrong. LibreOffice does not ship Microsoft's fonts, so without
# metric compatible replacements a deck built in Calibri reflows, text
# overflows its boxes, and anything non-Latin renders as empty rectangles.
#
# liberation covers Arial, Times and Courier at the same metrics. dejavu and
# noto cover most of the rest, including CJK.
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install(
        "libreoffice-writer",
        "libreoffice-calc",
        "libreoffice-impress",
        "fonts-liberation",
        "fonts-dejavu",
        "fonts-noto-core",
        "fonts-noto-cjk",
    )
    .pip_install("fastapi[standard]==0.115.*")
    # LibreOffice writes a profile on first run. Doing it at build time rather
    # than on the first request moves several seconds out of the cold start.
    .run_commands(
        "mkdir -p /profile",
        "soffice --headless --norestore -env:UserInstallation=file:///profile "
        "--terminate_after_init || true",
    )
    .env({"HOME": "/tmp"})
)

# What LibreOffice will accept. Anything else is refused before a container
# starts, because rejecting early costs nothing and a failed conversion still
# bills for the seconds it ran.
ACCEPTED = {
    "doc", "docx", "odt", "rtf", "txt",
    "xls", "xlsx", "ods", "csv",
    "ppt", "pptx", "odp",
    "epub", "html", "htm",
}

# A cap, because a free endpoint with no limit is somebody else's compute
# budget. 40MB covers essentially every real document.
MAX_BYTES = 40 * 1024 * 1024


@app.function(
    image=image,
    # LibreOffice is single threaded per document and memory hungry on large
    # decks. Two cores is plenty; the memory is what actually matters.
    cpu=2,
    memory=2048,
    # Generous, because a 200 slide deck with embedded video is slow. Modal
    # bills the seconds used rather than the ceiling, so a high limit costs
    # nothing on a fast conversion.
    timeout=300,
    # Keeps one container warm for a minute after a request, so a person
    # converting three files in a row waits for the cold start once.
    scaledown_window=60,
)
@modal.concurrent(max_inputs=4)
@modal.asgi_app()
def web():
    from fastapi import FastAPI, File, HTTPException, Request, UploadFile
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import Response

    api = FastAPI()

    # The browser calls this directly from the site, so it needs CORS. Locked
    # to the site's own origins rather than open, since an open endpoint is an
    # invitation to run somebody else's conversions on your credits.
    api.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://vantly.xyz",
            "https://www.vantly.xyz",
            "http://localhost:5320",
            "http://localhost:3000",
        ],
        allow_methods=["POST", "OPTIONS"],
        allow_headers=["*"],
    )

    def allow(ip: str, now: float) -> bool:
        """A fixed window counter, keyed by IP and window number.

        Fixed window rather than a sliding one because it needs a single read
        and a single write. The known flaw is that somebody can spend a full
        allowance either side of a boundary, which is twice the limit for a
        moment. That is fine here: the point is stopping a script running
        thousands of conversions, not policing the eightieth.
        """
        # The IP is hashed rather than stored. Counting requests needs to tell
        # two callers apart, which a hash does, and nothing here ever needs to
        # know who they were. Storing the address itself would make this a
        # store of personal data for no gain. The window number is in the hash
        # so yesterday's keys cannot be matched against today's.
        slot = int(now // WINDOW)
        key = hashlib.sha256(f"{ip}:{slot}".encode()).hexdigest()[:32]
        used = buckets.get(key, 0)
        if used >= PER_HOUR:
            return False
        # Keys accumulate, one per IP per hour. They are a short string and a
        # small integer, so this is cheap for a long time, but it does grow
        # and will want clearing if the endpoint ever gets busy.
        buckets[key] = used + 1
        return True

    @api.get("/health")
    def health():
        return {"ok": True}

    @api.post("/convert")
    async def convert(request: Request, file: UploadFile = File(...), to: str = "pdf"):
        # Modal sits behind a proxy, so the socket address is the proxy. The
        # left-most entry in the forwarded chain is the caller.
        forwarded = request.headers.get("x-forwarded-for", "")
        ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")

        if not allow(ip, time.time()):
            raise HTTPException(
                429,
                f"That is {PER_HOUR} conversions in an hour, which is the limit. Try again later.",
            )

        name = file.filename or "input"
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""

        if ext not in ACCEPTED:
            raise HTTPException(
                415,
                f"Cannot convert .{ext}. Accepted: {', '.join(sorted(ACCEPTED))}.",
            )
        if to not in {"pdf", "docx", "xlsx", "pptx", "html", "txt"}:
            raise HTTPException(400, f"Cannot convert to {to}.")

        data = await file.read()
        if len(data) > MAX_BYTES:
            raise HTTPException(413, f"That file is over {MAX_BYTES // 1024 // 1024}MB.")
        if not data:
            raise HTTPException(400, "That file is empty.")

        work = tempfile.mkdtemp()
        try:
            src = os.path.join(work, f"input.{ext}")
            with open(src, "wb") as f:
                f.write(data)

            # Each conversion gets its own LibreOffice profile. Without this,
            # two requests in the same container fight over one profile
            # directory and the second one silently produces nothing.
            profile = f"file:///tmp/lo-{uuid.uuid4().hex}"

            result = subprocess.run(
                [
                    "soffice",
                    "--headless",
                    "--norestore",
                    f"-env:UserInstallation={profile}",
                    "--convert-to", to,
                    "--outdir", work,
                    src,
                ],
                capture_output=True,
                timeout=280,
            )

            out = os.path.join(work, f"input.{to}")
            if not os.path.exists(out):
                # LibreOffice exits 0 even when it converts nothing, so the
                # output file is the only reliable signal. Its stderr is the
                # only clue about why.
                detail = result.stderr.decode("utf8", "replace")[:400] or "no output produced"
                raise HTTPException(422, f"Conversion failed: {detail}")

            with open(out, "rb") as f:
                converted = f.read()

            media = {
                "pdf": "application/pdf",
                "html": "text/html",
                "txt": "text/plain",
                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            }[to]

            stem = name.rsplit(".", 1)[0] if "." in name else name
            return Response(
                content=converted,
                media_type=media,
                headers={"Content-Disposition": f'inline; filename="{stem}.{to}"'},
            )

        except subprocess.TimeoutExpired:
            raise HTTPException(504, "That file took too long to convert.")
        finally:
            shutil.rmtree(work, ignore_errors=True)

    return api
