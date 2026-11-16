from pathlib import Path
from PIL import Image

OUT = Path("src/assets/img")
CREAM = (255, 252, 245)
SOURCES = {"in": Path("_src_razorpay.png"), "my": Path("_src_fiuu.png")}


def flatten(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    bg = Image.new("RGBA", im.size, CREAM + (255,))
    bg.alpha_composite(im)
    bbox = Image.eval(im.getchannel("A"), lambda a: 255 if a > 8 else 0).getbbox() if im.getchannel("A").getextrema()[0] < 255 else None
    out = bg.convert("RGB")
    return out.crop(bbox) if bbox else out


def contain(im: Image.Image, size: tuple[int, int], pad: int) -> Image.Image:
    tw, th = size
    scale = min((tw - pad * 2) / im.width, (th - pad * 2) / im.height)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    canvas = Image.new("RGB", size, CREAM)
    canvas.paste(im.resize((nw, nh), Image.Resampling.LANCZOS), ((tw - nw) // 2, (th - nh) // 2))
    return canvas


for key, src in SOURCES.items():
    im = flatten(src)
    contain(im, (223, 132), 6).save(OUT / f"card-terminal-{key}.webp", "WEBP", quality=84, method=6)
    contain(im, (420, 236), 12).save(OUT / f"card-terminal-rail-{key}.webp", "WEBP", quality=84, method=6)
    print(key, im.size)

for name in ("card-terminal.webp", "card-terminal-rail.webp"):
    p = OUT / name
    if p.exists():
        p.unlink()
