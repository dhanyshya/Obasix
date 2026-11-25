"""File storage: the local folder, and Vercel Blob byte-for-byte against the official SDK."""

import json
import shutil
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

from app.core import storage
from app.core.config import get_settings

ROOT = Path(__file__).parent.parent.parent
TOKEN = "vercel_blob_rw_storeid123_secretABC"


class Recorder:
    def __init__(self) -> None:
        self.requests: list[dict] = []
        recorder = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args) -> None:
                pass

            def _record(self) -> bytes:
                length = int(self.headers.get("content-length") or 0)
                body = self.rfile.read(length) if length else b""
                recorder.requests.append(
                    {
                        "method": self.command,
                        "path": self.path,
                        "headers": {k.lower(): v for k, v in self.headers.items()},
                        "body": body,
                    }
                )
                return body

            def do_PUT(self) -> None:  # noqa: N802
                self._record()
                payload = json.dumps(
                    {"url": "u", "downloadUrl": "d", "pathname": "p", "contentType": "c", "contentDisposition": "i"}
                )
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(payload.encode())

            def do_GET(self) -> None:  # noqa: N802
                self._record()
                if self.path.endswith("/missing.pdf"):
                    self.send_response(404)
                    self.end_headers()
                    return
                self.send_response(200)
                self.send_header("content-type", "application/pdf")
                self.end_headers()
                self.wfile.write(b"%PDF-stored")

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def close(self) -> None:
        self.server.shutdown()


@pytest.fixture
def recorder():
    r = Recorder()
    yield r
    r.close()


@pytest.fixture
def blob(monkeypatch, recorder):
    settings = get_settings()
    monkeypatch.setattr(settings, "blob_token", TOKEN)
    monkeypatch.setattr(settings, "blob_api_url", recorder.url)
    monkeypatch.setattr(settings, "blob_read_url", recorder.url)
    return recorder


# Headers that differ by design between two HTTP clients, or per request.
VARIES = {
    "host",
    "user-agent",
    "accept",
    "accept-encoding",
    "accept-language",
    "connection",
    "sec-fetch-mode",
    "x-api-blob-request-id",
}


@pytest.mark.skipif(
    not shutil.which("node") or not (ROOT / "node_modules/@vercel/blob").exists(), reason="needs node + @vercel/blob"
)
async def test_upload_matches_the_official_sdk(blob):
    script = f"""
      process.env.VERCEL_BLOB_API_URL = {json.dumps(blob.url)};
      process.env.BLOB_READ_WRITE_TOKEN = {json.dumps(TOKEN)};
      const {{ put }} = await import({json.dumps(str(ROOT / "node_modules/@vercel/blob/dist/index.js"))});
      await put("quote-files/OBX-QUOTE-DEMO-1.pdf", Buffer.from("%PDF-hello"),
        {{ access: "private", contentType: "application/pdf", addRandomSuffix: false, allowOverwrite: true }});
    """
    subprocess.run(["node", "--input-type=module", "-e", script], check=True, capture_output=True, cwd=ROOT)
    await storage.save_file("quote-files/OBX-QUOTE-DEMO-1.pdf", b"%PDF-hello", "application/pdf")
    sdk, ours = blob.requests
    assert ours["method"] == sdk["method"] == "PUT"
    assert ours["path"] == sdk["path"] == "/?pathname=quote-files%2FOBX-QUOTE-DEMO-1.pdf"
    assert ours["body"] == sdk["body"] == b"%PDF-hello"
    strip = lambda h: {k: v for k, v in h.items() if k not in VARIES}  # noqa: E731
    assert strip(ours["headers"]) == strip(sdk["headers"])
    assert ours["headers"]["x-api-blob-request-id"].startswith("storeid123:")


async def test_download_uses_the_private_store_url_and_token(blob):
    assert await storage.load_file("proof-files/PRF-1.pdf") == b"%PDF-stored"
    [request] = blob.requests
    assert request["method"] == "GET" and request["path"] == "/proof-files/PRF-1.pdf"
    assert request["headers"]["authorization"] == f"Bearer {TOKEN}"
    assert await storage.load_file("proof-files/missing.pdf") is None


def test_the_real_read_url_is_the_sdks(monkeypatch):
    monkeypatch.setattr(get_settings(), "blob_token", TOKEN)
    monkeypatch.setattr(get_settings(), "blob_read_url", "")
    assert (
        storage.blob_read_url("quote-files/a.pdf")
        == "https://storeid123.private.blob.vercel-storage.com/quote-files/a.pdf"
    )


async def test_local_folder_and_keys_that_try_to_escape(tmp_path, monkeypatch):
    monkeypatch.setattr(get_settings(), "files_dir", str(tmp_path))
    monkeypatch.setattr(get_settings(), "blob_token", "")
    await storage.save_file("quote-files/OBX-1.pdf", b"%PDF-1", "application/pdf")
    assert (tmp_path / "quote-files" / "OBX-1.pdf").read_bytes() == b"%PDF-1"
    assert await storage.load_file("quote-files/OBX-1.pdf") == b"%PDF-1"
    await storage.save_file("../../etc/x/../evil.pdf", b"x", "application/pdf")
    assert (tmp_path / "etc" / "x" / "evil.pdf").exists() or (tmp_path / "evil.pdf").exists()
    assert not (tmp_path.parent.parent / "etc").exists()
    assert await storage.load_file("quote-files/none.pdf") is None


def test_sniffing():
    assert storage.sniff_type(b"\x89PNG\r\n") == "image/png"
    assert storage.sniff_type(b"\xff\xd8\xff\xe0") == "image/jpeg"
    assert storage.sniff_type(b"RIFF\x00\x00\x00\x00WEBPVP8") == "image/webp"
    assert storage.sniff_type(b"%PDF-1.7") == "application/pdf"
    assert storage.sniff_type(b"GIF89a") is None
