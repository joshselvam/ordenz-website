"""Landscape 420x236 rail cards (shown with object-fit:contain in the 118px rail slot)."""
from pathlib import Path
from PIL import Image, ImageDraw

IMG = Path("src/assets/img")
SIZE = (420, 236)
CREAM = (255, 252, 245)
INK = (11, 17, 15)


def flatten(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    bg = Image.new("RGBA", im.size, CREAM + (255,))
    bg.alpha_composite(im)
    return bg.convert("RGB")


def content_box(im: Image.Image, bg, tol=18):
    px = im.load()
    w, h = im.size
    xs, ys = [], []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            p = px[x, y]
            if max(abs(p[i] - bg[i]) for i in range(3)) > tol:
                xs.append(x)
                ys.append(y)
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def contain(im, size, pad, fill):
    tw, th = size
    s = min((tw - 2 * pad) / im.width, (th - 2 * pad) / im.height)
    nw, nh = int(im.width * s), int(im.height * s)
    out = Image.new("RGB", size, fill)
    out.paste(im.resize((nw, nh), Image.Resampling.LANCZOS), ((tw - nw) // 2, (th - nh) // 2))
    return out


def rounded(im, r):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    return m


def save(im, name):
    im.save(IMG / name, "WEBP", quality=86, method=6)
    print(name, im.size)


# UPI: Joshua's counter screen (title, QR, amount), on cream.
src = flatten(Image.open("_src_upi.png"))
bg = src.getpixel((2, 2))
header = src.crop(content_box(src.crop((0, 0, src.width, 95)), bg))
qr = src.crop((0, 100, src.width, 330))
qr = qr.crop(content_box(qr, bg))
amount = src.crop((0, 335, src.width, src.height))
ab = content_box(amount, bg)
amount = amount.crop(ab)
upi = Image.new("RGB", SIZE, bg)
qside = SIZE[1] - 24
upi.paste(qr.resize((qside, qside), Image.Resampling.LANCZOS), (SIZE[0] - qside - 14, 12))
left_w = SIZE[0] - qside - 14 - 28
hs = min(1.0, left_w / header.width)
header = header.resize((int(header.width * hs), int(header.height * hs)), Image.Resampling.LANCZOS)
upi.paste(header, (14, 40))
amount = amount.resize((amount.width * 2, amount.height * 2), Image.Resampling.LANCZOS)
upi.paste(amount, (14, 40 + header.height + 24))
save(upi, "pay-upi-qr-rail.webp")

# DuitNow: crop the screenshot out of the old portrait card.
dn = Image.open(IMG / "pay-duitnow-qr-rail.webp").convert("RGB")
if dn.size == (420, 760):
    dn = dn.crop((0, 120, 420, 680))
    dn = dn.crop(content_box(dn, INK))
    save(contain(dn, SIZE, 0, CREAM), "pay-duitnow-qr-rail.webp")

# Delivery apps: logo tiles side by side, like the Hardware card.
LOGOS = {"in": ["swiggy", "zomato"], "my": ["grab", "foodpanda", "shopeefood"]}
for country, names in LOGOS.items():
    canvas = Image.new("RGB", SIZE, INK)
    gap = 8
    tw = (SIZE[0] - gap * (len(names) + 1)) // len(names)
    th = SIZE[1] - gap * 2
    for i, n in enumerate(names):
        tile = Image.new("RGB", (tw, th), CREAM)
        logo = Image.open(IMG / f"delivery-logo-{n}.webp").convert("RGB")
        side = min(tw, th) - 28
        logo = logo.resize((side, side), Image.Resampling.LANCZOS)
        tile.paste(logo, ((tw - side) // 2, (th - side) // 2), rounded(logo, side // 5))
        x = gap + i * (tw + gap)
        canvas.paste(tile, (x, gap), rounded(tile, 14))
    save(canvas, f"delivery-apps-rail-{country}.webp")
