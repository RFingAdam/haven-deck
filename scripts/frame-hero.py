#!/usr/bin/env python3
"""Frame the 800x480 Live screenshot in a touchscreen bezel and build the hero."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "docs" / "media"
LIVE = ROOT / "live.png"
BG = (16, 13, 11)
BEZEL = (22, 19, 16)
BEZEL_HI = (58, 50, 42)
CREAM = (216, 201, 163)
RUST = (181, 86, 47)
TEXT = (243, 237, 224)
MUTED = (154, 143, 124)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def round_corners(im: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width, im.height), radius=radius, fill=255)
    out = Image.new("RGBA", im.size)
    out.paste(im.convert("RGBA"), (0, 0))
    out.putalpha(mask)
    return out


def frame_screen(screen: Image.Image, bezel: int = 42, radius: int = 36, inner: int = 6) -> Image.Image:
    screen = screen.convert("RGBA")
    w, h = screen.size
    fw, fh = w + bezel * 2, h + bezel * 2
    device = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(device)
    draw.rounded_rectangle((0, 0, fw - 1, fh - 1), radius=radius, fill=BEZEL + (255,))
    # outer lip
    draw.rounded_rectangle((1, 1, fw - 2, fh - 2), radius=radius - 1, outline=BEZEL_HI + (255,), width=2)
    # cream / rust hairline around the glass
    inset = bezel - inner
    draw.rounded_rectangle(
        (inset, inset, fw - inset - 1, fh - inset - 1),
        radius=max(8, radius - bezel + inner + 4),
        outline=CREAM + (255,),
        width=2,
    )
    draw.rounded_rectangle(
        (inset + 2, inset + 2, fw - inset - 3, fh - inset - 3),
        radius=max(6, radius - bezel + inner + 2),
        outline=RUST + (180,),
        width=1,
    )
    glass = round_corners(screen, max(4, radius - bezel + 4))
    device.alpha_composite(glass, (bezel, bezel))
    return device


def drop_shadow(im: Image.Image, pad: int = 48, offset: tuple[int, int] = (0, 18), blur: int = 24) -> Image.Image:
    canvas = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    mask = im.split()[-1]
    shadow.paste((0, 0, 0, 180), (0, 0), mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(shadow, (pad + offset[0], pad + offset[1]))
    canvas.alpha_composite(im, (pad, pad))
    return canvas


def hero(framed: Image.Image) -> Image.Image:
    canvas_w, canvas_h = 1600, 980
    top, bottom = 200, 70
    max_w, max_h = 1240, canvas_h - top - bottom
    scale = min(max_w / framed.width, max_h / framed.height)
    device = framed.resize(
        (int(framed.width * scale), int(framed.height * scale)),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGB", (canvas_w, canvas_h), BG)
    wash = Image.new("RGB", canvas.size, BG)
    d = ImageDraw.Draw(wash)
    cx, cy = canvas_w // 2, 560
    for r, color in ((720, (40, 30, 24)), (520, (28, 22, 18)), (280, BG)):
        d.ellipse((cx - r, cy - int(r * 0.62), cx + r, cy + int(r * 0.62)), fill=color)
    canvas = Image.blend(canvas, wash, 0.55)
    x = (canvas_w - device.width) // 2
    y = top + (max_h - device.height) // 2
    canvas.paste(device.convert("RGB"), (x, y), device)
    draw = ImageDraw.Draw(canvas)
    title = "Haven Deck"
    sub = "A DIY touchscreen stream deck  ·  Raspberry Pi, tablet, or browser"
    tf = font(54, bold=True)
    sf = font(22, bold=False)
    tw = draw.textlength(title, font=tf)
    sw = draw.textlength(sub, font=sf)
    draw.text(((canvas_w - tw) / 2, 48), title, font=tf, fill=CREAM)
    draw.text(((canvas_w - sw) / 2, 120), sub, font=sf, fill=MUTED)
    cap = "Official 800×480 kiosk layout  ·  demo mode"
    cf = font(18)
    cw = draw.textlength(cap, font=cf)
    draw.text(((canvas_w - cw) / 2, canvas_h - 48), cap, font=cf, fill=MUTED)
    return canvas


def main() -> None:
    screen = Image.open(LIVE)
    framed = drop_shadow(frame_screen(screen))
    (ROOT / "live-framed.png").parent.mkdir(parents=True, exist_ok=True)
    # also frame the other two for the README row
    for name in ("live", "sounds", "setup"):
        shot = Image.open(ROOT / f"{name}.png")
        framed_tab = drop_shadow(frame_screen(shot, bezel=36, radius=28), pad=36, offset=(0, 12), blur=18)
        # trim excess transparent? keep pad for even edges
        framed_tab.save(ROOT / f"{name}-framed.png", "PNG")
        print("wrote", ROOT / f"{name}-framed.png")
    hero(framed).save(ROOT / "hero.png", "PNG", optimize=True)
    print("wrote", ROOT / "hero.png")


if __name__ == "__main__":
    main()
