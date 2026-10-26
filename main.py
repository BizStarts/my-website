"""Запуск локального сайта: python main.py, затем http://127.0.0.1:4173."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


if __name__ == "__main__":
    site_directory = Path(__file__).resolve().parent / "baranov-credit" / "dist"
    handler = partial(SimpleHTTPRequestHandler, directory=str(site_directory))
    server = ThreadingHTTPServer(("127.0.0.1", 4173), handler)
    print("Сайт запущен: http://127.0.0.1:4173 (Ctrl+C для остановки)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
