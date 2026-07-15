"""Remove a near-solid flat background (sampled from the corner) from a logo/photo,
keying by distance from that sampled color rather than a fixed chroma color.

Usage: python key_out_bg.py <input> <output.png> [tolerance]
"""
import sys
from PIL import Image


def key_out(input_path, output_path, tolerance=22):
    img = Image.open(input_path).convert("RGBA")
    px = img.load()
    w, h = img.size

    # sample the background color from the four corners and average
    corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    kr = sum(c[0] for c in corners) / 4
    kg = sum(c[1] for c in corners) / 4
    kb = sum(c[2] for c in corners) / 4

    lo = tolerance
    hi = tolerance * 2.6

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            dist = ((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) ** 0.5

            if dist < lo:
                px[x, y] = (r, g, b, 0)
            elif dist < hi:
                ratio = (dist - lo) / (hi - lo)
                px[x, y] = (r, g, b, int(a * ratio))

    img.save(output_path, "PNG")
    print(f"Saved {output_path} ({w}x{h}) keyed from ({kr:.0f},{kg:.0f},{kb:.0f})")


if __name__ == "__main__":
    inp, outp = sys.argv[1], sys.argv[2]
    tol = float(sys.argv[3]) if len(sys.argv) > 3 else 22
    key_out(inp, outp, tol)
