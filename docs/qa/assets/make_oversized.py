"""Create oversized-12mb.png (>10 MB) for upload size-limit tests.

Not committed to git because of its size. Run from this folder:
    python3 make_oversized.py
Needs only the Python standard library.
"""
import os
import struct
import zlib

WIDTH = HEIGHT = 2200  # random RGB pixels barely compress -> ~14 MB


def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


rows = b"".join(b"\x00" + os.urandom(WIDTH * 3) for _ in range(HEIGHT))
png = (
    b"\x89PNG\r\n\x1a\n"
    + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
    + chunk(b"IDAT", zlib.compress(rows, 1))
    + chunk(b"IEND", b"")
)
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "oversized-12mb.png")
with open(path, "wb") as f:
    f.write(png)
print(f"Wrote {path} ({len(png) / 1024 / 1024:.1f} MB)")
