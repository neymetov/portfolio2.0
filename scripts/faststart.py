#!/usr/bin/env python3
"""Moves the moov atom of an mp4 to the front (what ffmpeg's -movflags +faststart does) without re-encoding,
so the video can start playing before it is fully downloaded. Usage: scripts/faststart.py file.mp4 [...]"""
import struct, sys


def atoms(b, s=0, e=None):
    e = len(b) if e is None else e
    p = s
    while p + 8 <= e:
        n, t = struct.unpack('>I4s', b[p:p + 8])
        h = 8
        if n == 1:
            n = struct.unpack('>Q', b[p + 8:p + 16])[0]
            h = 16
        elif n == 0:
            n = e - p
        yield t.decode('latin1'), p, n, h
        p += n


def fix(path):
    b = bytearray(open(path, 'rb').read())
    top = list(atoms(b))
    names = [t for t, *_ in top]
    if names.index('moov') < names.index('mdat'):
        print(path, 'already has moov first')
        return
    _, mp, mn, _ = [a for a in top if a[0] == 'moov'][0]
    moov = bytearray(b[mp:mp + mn])
    rest = b[:mp] + b[mp + mn:]

    def patch(buf, s, e):
        for t, p, n, h in atoms(buf, s, e):
            if t in ('trak', 'mdia', 'minf', 'stbl', 'edts'):
                patch(buf, p + h, p + n)
            elif t in ('stco', 'co64'):
                size = 4 if t == 'stco' else 8
                fmt = '>I' if t == 'stco' else '>Q'
                count = struct.unpack('>I', buf[p + 12:p + 16])[0]
                for i in range(count):
                    o = p + 16 + i * size
                    buf[o:o + size] = struct.pack(fmt, struct.unpack(fmt, buf[o:o + size])[0] + mn)

    patch(moov, 8, len(moov))
    f = [a for a in atoms(rest) if a[0] == 'ftyp'][0]
    at = f[1] + f[2]
    open(path, 'wb').write(bytes(rest[:at]) + bytes(moov) + bytes(rest[at:]))
    print(path, 'fixed')


for p in sys.argv[1:]:
    fix(p)
