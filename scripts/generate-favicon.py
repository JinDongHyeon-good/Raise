#!/usr/bin/env python3
"""Generate dollar-mark favicons for 찐동코인."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "public"
BG = (18, 20, 26, 255)
RED = (225, 29, 72, 255)


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = max(1, round(size * 0.04))
    radius = max(4, round(size * 0.22))
    draw.rounded_rectangle((pad, pad, size - pad - 1, size - pad - 1), radius=radius, fill=BG)

    # subtle inner border
    inset = pad + max(1, round(size * 0.03))
    draw.rounded_rectangle(
        (inset, inset, size - inset - 1, size - inset - 1),
        radius=max(3, round(size * 0.18)),
        outline=(*RED[:3], 55),
        width=max(1, round(size * 0.015)),
    )

    font_size = int(size * 0.62)
    font = None
    for name in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ):
        try:
            font = ImageFont.truetype(name, font_size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()

    text = "$"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.015
    draw.text((x, y), text, font=font, fill=RED)
    return img


def save_ico(path: Path, sizes=(16, 32, 48)):
    images = [make_icon(s).convert("RGBA") for s in sizes]
    images[0].save(path, format="ICO", sizes=[(s, s) for s in sizes], append_images=images[1:])


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    make_icon(1024).save(ROOT / "favicon.png", "PNG")
    make_icon(32).save(ROOT / "favicon-32.png", "PNG")
    make_icon(180).save(ROOT / "apple-touch-icon.png", "PNG")
    make_icon(192).save(ROOT / "icon-192.png", "PNG")
    make_icon(512).save(ROOT / "icon-512.png", "PNG")
    save_ico(ROOT / "favicon.ico")
    print("favicon assets written to", ROOT)


if __name__ == "__main__":
    main()
