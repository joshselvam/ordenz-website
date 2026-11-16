"""Build country delivery-logo composites and DuitNow/UPI strip shots."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "src/assets/img"
CREAM = (255, 252, 245)
GREEN = (27, 67, 50)
DARK = (11, 17, 15)


def font(size, bold=False):
    for path in (
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def fit_square(im: Image.Image, size: int) -> Image.Image:
    im = im.convert("RGBA")
    # trim near-empty margins for logos on dark/colored grounds
    w, h = im.size
    scale = size / max(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(scaled, ((size - nw) // 2, (size - nh) // 2), scaled)
    return canvas


def save_logo(src_name: str, out_name: str, size: int = 96):
    src = ROOT / src_name
    im = Image.open(src)
    out = fit_square(im, size)
    path = IMG / out_name
    out.save(path, "WEBP", quality=90, method=6)
    print("logo", path.name, path.stat().st_size)
    return path


def composite_strip(logos: list[Path], out_name: str, size=(226, 156)):
    w, h = size
    card = Image.new("RGB", (w, h), GREEN)
    draw = ImageDraw.Draw(card)
    n = len(logos)
    pad = 10
    gap = 8
    avail = w - pad * 2 - gap * (n - 1)
    box = min(64, avail // n, h - 36)
    total = n * box + (n - 1) * gap
    x0 = (w - total) // 2
    y0 = 18
    for i, path in enumerate(logos):
        logo = Image.open(path).convert("RGBA")
        logo = fit_square(logo, box)
        # cream plate behind each logo
        plate = Image.new("RGBA", (box + 6, box + 6), (0, 0, 0, 0))
        pd = ImageDraw.Draw(plate)
        pd.rounded_rectangle((0, 0, box + 5, box + 5), radius=12, fill=(*CREAM, 255))
        card.paste(plate, (x0 + i * (box + gap) - 3, y0 - 3), plate)
        card.paste(logo, (x0 + i * (box + gap), y0), logo)
    label = font(14, bold=True)
    text = "Delivery apps"
    bbox = draw.textbbox((0, 0), text, font=label)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) / 2, h - 28), text, font=label, fill=CREAM)
    out = IMG / out_name
    card.save(out, "WEBP", quality=90, method=6)
    print("strip", out.name, out.stat().st_size)
    return out


def composite_rail(logos: list[Path], out_name: str):
    rail = Image.new("RGB", (420, 760), DARK)
    # header
    d = ImageDraw.Draw(rail)
    d.rounded_rectangle((24, 40, 395, 110), radius=18, fill=GREEN)
    f = font(28, bold=True)
    text = "Delivery apps"
    bbox = d.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((420 - tw) / 2, 62), text, font=f, fill=CREAM)

    # logo card
    card_w, card_h = 340, 240
    card = Image.new("RGB", (card_w, card_h), CREAM)
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=22, fill=CREAM)
    n = len(logos)
    box = 88 if n <= 2 else 72
    gap = 16
    total = n * box + (n - 1) * gap
    x0 = (card_w - total) // 2
    y0 = (card_h - box) // 2
    for i, path in enumerate(logos):
        logo = fit_square(Image.open(path), box)
        # subtle plate
        cd.rounded_rectangle(
            (x0 + i * (box + gap) - 6, y0 - 6, x0 + i * (box + gap) + box + 5, y0 + box + 5),
            radius=16,
            fill=(238, 245, 239),
        )
        card.paste(logo, (x0 + i * (box + gap), y0), logo)
    rail.paste(card, ((420 - card_w) // 2, 200))
    d.rectangle((0, 680, 419, 759), fill=GREEN)
    bbox = d.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((420 - tw) / 2, 702), text, font=f, fill=CREAM)
    out = IMG / out_name
    rail.save(out, "WEBP", quality=88, method=6)
    print("rail", out.name, out.stat().st_size)


def pay_strip(src: Path, out_name: str, size=(233, 119)):
    im = Image.open(src).convert("RGB")
    # cover into target
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (nw - tw) // 2
    y = max(0, (nh - th) // 2)
    crop = scaled.crop((x, y, x + tw, y + th))
    out = IMG / out_name
    crop.save(out, "WEBP", quality=90, method=6)
    print("pay", out.name, out.stat().st_size, crop.size)


def pay_rail(src: Path, out_name: str, label: str):
    im = Image.open(src).convert("RGB")
    rail = Image.new("RGB", (420, 760), DARK)
    # fit width 360
    scale = 360 / im.width
    nw, nh = 360, max(1, int(im.height * scale))
    scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
    y = max(80, (640 - nh) // 2)
    rail.paste(scaled, ((420 - nw) // 2, y))
    d = ImageDraw.Draw(rail)
    d.rectangle((0, 680, 419, 759), fill=GREEN)
    f = font(28, bold=True)
    bbox = d.textbbox((0, 0), label, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((420 - tw) / 2, 702), label, font=f, fill=CREAM)
    out = IMG / out_name
    rail.save(out, "WEBP", quality=88, method=6)
    print("pay-rail", out.name, out.stat().st_size)


def main():
    grab = save_logo("logo-grab-src.png", "delivery-logo-grab.webp")
    foodpanda = save_logo("logo-foodpanda-src.png", "delivery-logo-foodpanda.webp")
    shopee = save_logo("logo-shopeefood-src.png", "delivery-logo-shopeefood.webp")
    swiggy = save_logo("logo-swiggy-src.png", "delivery-logo-swiggy.webp")
    zomato = save_logo("logo-zomato-src.png", "delivery-logo-zomato.webp")

    composite_strip([grab, foodpanda, shopee], "delivery-apps-my.webp")
    composite_strip([swiggy, zomato], "delivery-apps-in.webp")
    composite_rail([grab, foodpanda, shopee], "delivery-apps-rail-my.webp")
    composite_rail([swiggy, zomato], "delivery-apps-rail-in.webp")

    pay_strip(ROOT / "duitnow-qr-src.png", "pay-duitnow-qr.webp")
    pay_strip(IMG / "upi.webp", "pay-upi-qr.webp")
    pay_rail(ROOT / "duitnow-qr-src.png", "pay-duitnow-qr-rail.webp", "DuitNow")
    pay_rail(IMG / "upi.webp", "pay-upi-qr-rail.webp", "UPI")


if __name__ == "__main__":
    main()
