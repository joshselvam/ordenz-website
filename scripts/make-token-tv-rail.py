"""Token TV rail cards (420x236) showing the whole token screen: promo, In preparation, Ready."""
from pathlib import Path
from PIL import Image

IMG = Path("src/assets/img")
SIZE = (420, 236)


def save(im, name):
    im.convert("RGB").resize(SIZE, Image.Resampling.LANCZOS).save(IMG / name, "WEBP", quality=86, method=6)
    print(name)


src_my = Path("_src_token_my.png")
if src_my.exists():
    im = Image.open(src_my)
    # Joshua's capture has dark bars above and below the screen; keep the screen at 16:9.
    top, bottom = 47, 535
    w = round((bottom - top) * SIZE[0] / SIZE[1])
    save(im.crop((3, top, 3 + w, bottom)), "token-screen-my-rail.webp")

im = Image.open(IMG / "token-screen.webp").convert("RGB")
crop = im.crop((0, round(im.height * 0.125), round(im.width * 0.88), round(im.height * 0.875)))
s = SIZE[0] / crop.width
crop = crop.resize((SIZE[0], round(crop.height * s)), Image.Resampling.LANCZOS)
card = Image.new("RGB", SIZE, (11, 17, 15))
card.paste(crop, (0, (SIZE[1] - crop.height) // 2))
card.save(IMG / "token-screen-rail.webp", "WEBP", quality=86, method=6)
print("token-screen-rail.webp", crop.size)
