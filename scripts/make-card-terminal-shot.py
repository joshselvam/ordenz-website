"""Build card-terminal strip/rail shots from showcase-my.webp to match Joshua's crop."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src/assets/img/showcase-my.webp"
OUT = ROOT / "src/assets/img/card-terminal.webp"
OUT_RAIL = ROOT / "src/assets/img/card-terminal-rail.webp"

# Target crop aspect ~223×132, render at 2× for sharpness then also a rail portrait.
W, H = 446, 264
CREAM = (255, 252, 245, 255)
GREEN = (27, 67, 50, 255)
GREEN_SOFT = (20, 50, 38, 255)
INK = (27, 67, 50, 255)


def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def rounded_paste(base, img, xy, radius):
    x, y = xy
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)
    base.paste(img, (x, y), mask)


def build_card():
    card = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    # outer phone-ish rounded card
    draw.rounded_rectangle((0, 0, W - 1, H - 1), radius=28, fill=CREAM)

    src = Image.open(SRC).convert("RGBA")
    # crop coffee cups area from top-center of showcase-my
    sw, sh = src.size
    crop = src.crop((int(sw * 0.18), int(sh * 0.02), int(sw * 0.82), int(sh * 0.62)))
    photo_w = W - 48
    photo_h = 110
    photo = crop.resize((photo_w, photo_h), Image.Resampling.LANCZOS)
    rounded_paste(card, photo, (24, 14), 14)

    title = font(18, bold=True)
    body = font(11)
    wait = font(13, bold=True)
    btn = font(14, bold=True)

    def center_text(text, y, fnt, fill=INK):
        bbox = draw.textbbox((0, 0), text, font=fnt)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) / 2, y), text, font=fnt, fill=fill)

    center_text("Cold coffee week", 132, title)
    center_text("Every frappé is RM2 off this week.", 154, body, fill=(70, 86, 79, 255))
    center_text("About 3 min", 172, wait)

    # Showcase button bar
    draw.rounded_rectangle((18, 198, W - 19, 232), radius=12, fill=GREEN)
    bbox = draw.textbbox((0, 0), "Showcase", font=btn)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((W - tw) / 2, 198 + (34 - th) / 2 - 2), "Showcase", font=btn, fill=(255, 252, 245, 255))

    # lower dock edge (matches crop hint of next green row)
    draw.rounded_rectangle((0, 244, W - 1, H - 1), radius=18, fill=GREEN_SOFT)
    draw.rectangle((0, 244, W - 1, 252), fill=GREEN_SOFT)

    return card


def main():
    card = build_card()
    # strip thumbnail: keep ~223×132 native target as webp
    strip = card.resize((223, 132), Image.Resampling.LANCZOS).convert("RGB")
    strip.save(OUT, "WEBP", quality=90, method=6)
    print("wrote", OUT, OUT.stat().st_size)

    # rail: portrait frame with card centered
    rail = Image.new("RGB", (420, 760), (15, 33, 28))
    # scale card to width 360
    cw = 360
    ch = int(264 * (360 / 446))
    scaled = card.resize((cw, ch), Image.Resampling.LANCZOS).convert("RGBA")
    x = (420 - cw) // 2
    y = 120
    rail.paste(scaled, (x, y), scaled)
    # label footer like other rail cards
    d = ImageDraw.Draw(rail)
    d.rectangle((0, 680, 419, 759), fill=(27, 67, 50))
    f = font(28, bold=True)
    text = "Card terminal"
    bbox = d.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((420 - tw) / 2, 702), text, font=f, fill=(255, 252, 245))
    rail.save(OUT_RAIL, "WEBP", quality=88, method=6)
    print("wrote", OUT_RAIL, OUT_RAIL.stat().st_size)


if __name__ == "__main__":
    main()
