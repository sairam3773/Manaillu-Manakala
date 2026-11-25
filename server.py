"""Tiny local server for MiMk.

It serves the site and keeps products, cart and orders in data.json so the
storefront and the admin panel always see the same information.

Run: python server.py
Then open: http://localhost:8000/index.html
"""

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(ROOT, "data.json")
PORT = 8000


def load_data():
    default = {"products": [], "cart": [], "orders": []}
    if not os.path.exists(DATA_FILE):
        return default
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        return {
            "products": data.get("products", []),
            "cart": data.get("cart", []),
            "orders": data.get("orders", []),
        }
    except (OSError, ValueError):
        return default


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)


class MiMkHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/data":
            self._send_json(load_data())
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/data":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(data, dict):
                raise ValueError("Expected a JSON object")
            save_data({
                "products": data.get("products", []),
                "cart": data.get("cart", []),
                "orders": data.get("orders", []),
            })
            self._send_json({"ok": True})
        except (ValueError, OSError):
            self._send_json({"ok": False, "error": "Invalid data"}, status=400)


if __name__ == "__main__":
    print("MiMk is running at http://localhost:{}/index.html".format(PORT))
    print("Admin panel: http://localhost:{}/admin.html".format(PORT))
    print("Press Ctrl+C to stop.")
    ThreadingHTTPServer(("127.0.0.1", PORT), MiMkHandler).serve_forever()
