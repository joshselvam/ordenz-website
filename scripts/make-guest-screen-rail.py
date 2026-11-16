"""Guest screen rail cards (420x236): IN from Joshua's counter guest display, MY from guest-my.webp."""
from pathlib import Path
from PIL import Image

IMG = Path("src/assets/img")
SIZE = (420, 236)
INK = (11, 17, 15)


def flat(path):
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, INK + (255,))
    bg.alpha_composite(im)
    return bg.convert("RGB")


src_in = Path("_src_guest.png")
if src_in.exists():
    im = flat(src_in)
    w = im.width
    h = round(w * SIZE[1] / SIZE[0])
    top = max(0, min(im.height - h, 8))
    im.crop((0, top, w, top + h)).resize(SIZE, Image.Resampling.LANCZOS).save(IMG / "guest-screen-rail-in.webp", "WEBP", quality=86, method=6)
    print("in", (w, h))

flat(IMG / "guest-my.webp").resize(SIZE, Image.Resampling.LANCZOS).save(IMG / "guest-screen-rail-my.webp", "WEBP", quality=86, method=6)
print("my ok")
