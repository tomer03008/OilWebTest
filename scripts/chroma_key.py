"""Chroma-key background removal for product cutouts.

Uses the standard broadcast "excess channel" method instead of naive
euclidean color distance, so spill (the colored halo on edge pixels)
gets fully neutralized rather than partially blended.

Usage: python chroma_key.py <input> <output.png> <key=green|magenta> [tolerance]
"""
import sys
from PIL import Image


def chroma_key(input_path, output_path, key="green", tolerance=60):
    img = Image.open(input_path).convert("RGBA")
    px = img.load()
    w, h = img.size

    lo = tolerance * 0.25   # excess below this -> fully opaque, untouched
    hi = tolerance * 1.5    # excess above this -> fully transparent

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]

            if key == "green":
                excess = g - max(r, b)
            else:  # magenta screen: excess = how much r/b exceed g
                excess = min(r, b) - g

            if excess <= lo:
                continue  # genuine foreground pixel, leave untouched

            if excess >= hi:
                px[x, y] = (r, g, b, 0)
                continue

            ratio = (excess - lo) / (hi - lo)
            new_a = int(a * (1 - ratio))

            # fully neutralize spill throughout the whole feather zone,
            # not just proportionally -- this is what kills the colored halo
            if key == "green":
                ng = max(r, b)
                px[x, y] = (r, ng, b, new_a)
            else:
                px[x, y] = (g, g, g, new_a)

    img.save(output_path, "PNG")
    print(f"Saved {output_path} ({w}x{h})")


if __name__ == "__main__":
    inp, outp, key = sys.argv[1], sys.argv[2], sys.argv[3]
    tol = int(sys.argv[4]) if len(sys.argv) > 4 else 60
    chroma_key(inp, outp, key, tol)
