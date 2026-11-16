from pathlib import Path
from PIL import Image

OUT = Path("src/assets/img")
FIUU = Path("_src_fiuu.png")  # MY
RZ = Path("_src_razorpay.png")  # IN


def cover(src: Path, size: tuple[int, int]) -> Image.Image:
    im = Image.open(src).convert("RGB")
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = int(im.width * scale + 0.5), int(im.height * scale + 0.5)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = max(0, (nh - th) // 5)  # bias slightly toward top product detail
    return im.crop((left, top, left + tw, top + th))


def contain_on(src: Path, size: tuple[int, int], bg: tuple[int, int, int]) -> Image.Image:
    im = Image.open(src).convert("RGB")
    tw, th = size
    pad = 28
    box_w, box_h = tw - pad * 2, th - pad * 2 - 40
    scale = min(box_w / im.width, box_h / im.height)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, bg)
    canvas.paste(im, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


pairs = [
    (RZ, "card-terminal-in.webp", "card-terminal-rail-in.webp"),
    (FIUU, "card-terminal-my.webp", "card-terminal-rail-my.webp"),
]
for src, strip_name, rail_name in pairs:
    strip = cover(src, (223, 132))
    strip.save(OUT / strip_name, "WEBP", quality=82, method=6)
    rail = contain_on(src, (420, 760), (27, 67, 50))
    rail.save(OUT / rail_name, "WEBP", quality=82, method=6)
    print(strip_name, strip.size, (OUT / strip_name).stat().st_size)
    print(rail_name, rail.size, (OUT / rail_name).stat().st_size)

# legacy aliases
(OUT / "card-terminal-my.webp").replace(OUT / "card-terminal.webp")
(OUT / "card-terminal-rail-my.webp").replace(OUT / "card-terminal-rail.webp")
print("aliases updated")
