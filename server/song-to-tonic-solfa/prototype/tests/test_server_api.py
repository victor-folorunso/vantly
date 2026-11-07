import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402


def job(job_id, status="done", created=1.0):
    return {"id": job_id, "name": job_id, "status": status, "stage": status, "created": created}


@pytest.fixture
def client(tmp_path, monkeypatch):
    # No `with`: the startup hook (which scans output/ and starts the worker) does not run.
    monkeypatch.setattr(server, "OUTPUT", tmp_path / "output")
    monkeypatch.setattr(server, "UPLOADS", tmp_path / "uploads")
    monkeypatch.setattr(server, "jobs", {
        "aaa": job("aaa", created=1.0),
        "bbb": job("bbb", created=2.0),
        "busy": job("busy", status="running", created=3.0),
    })
    return TestClient(server.app)


def test_lists_only_the_songs_asked_for(client):
    assert [j["id"] for j in client.get("/api/jobs?ids=aaa,bbb,unknown").json()] == ["bbb", "aaa"]


def test_lists_nothing_without_ids(client, monkeypatch):
    assert client.get("/api/jobs").json() == []
    monkeypatch.setattr(server, "LIST_ALL", True)  # a local server, where every song is yours
    assert len(client.get("/api/jobs").json()) == 3


def test_delete_removes_the_song_and_its_files(client, tmp_path):
    (tmp_path / "output" / "aaa").mkdir(parents=True)
    (tmp_path / "output" / "aaa" / "solfa.json").write_text("{}")
    (tmp_path / "uploads").mkdir()
    (tmp_path / "uploads" / "aaa.mp3").write_bytes(b"song")
    assert client.delete("/api/jobs/aaa").status_code == 200
    assert not (tmp_path / "output" / "aaa").exists()
    assert not (tmp_path / "uploads" / "aaa.mp3").exists()
    assert client.get("/api/jobs/aaa").status_code == 404


def test_delete_refuses_a_song_still_being_worked_on(client):
    assert client.delete("/api/jobs/busy").status_code == 409
    assert client.delete("/api/jobs/nope").status_code == 404


def test_vantly_may_call_the_api(client):
    response = client.get("/api/jobs?ids=aaa", headers={"Origin": "https://vantly.xyz"})
    assert response.headers["access-control-allow-origin"] == "https://vantly.xyz"
    other = client.get("/api/jobs?ids=aaa", headers={"Origin": "https://example.com"})
    assert "access-control-allow-origin" not in other.headers
