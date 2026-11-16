"""Zoomed 420x236 crops of feature screenshots for the features rail (118px tall slot)."""
from pathlib import Path
from PIL import Image

IMG = Path("src/assets/img")
SIZE = (420, 236)
INK = (11, 17, 15)

# source -> (x0, y0, x1, y1) as fractions; each box is ~16:9 so the crop is not distorted.
CROPS = {
    "table-qr-phone": (0.0, 0.08, 1.0, 0.349),
    "table-qr-phone-my": (0.0, 0.08, 1.0, 0.349),
    "table-qr-accept": (0.0, 0.15, 0.42, 0.57),
    "table-qr-accept-my": (0.0, 0.15, 0.42, 0.57),
    "setup": (0.18, 0.05, 0.62, 0.49),
    "stock": (0.0, 0.05, 0.45, 0.50),
    "tableturn": (0.0, 0.10, 0.50, 0.60),
    "showcase": (0.0, 0.0, 0.67, 0.67),
    "showcase-my": (0.15, 0.10, 0.85, 0.80),
}

for name, (x0, y0, x1, y1) in CROPS.items():
    im = Image.open(IMG / f"{name}.webp").convert("RGB")
    w, h = im.size
    box = (round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h))
    out = im.crop(box).resize(SIZE, Image.Resampling.LANCZOS)
    out.save(IMG / f"{name}-rail.webp", "WEBP", quality=86, method=6)
    print(name, box)

hw = Image.open(IMG / "hardware-scanner-printer.webp").convert("RGBA")
canvas = Image.new("RGBA", SIZE, INK + (255,))
s = min(SIZE[0] / hw.width, SIZE[1] / hw.height)
hw = hw.resize((int(hw.width * s), int(hw.height * s)), Image.Resampling.LANCZOS)
canvas.alpha_composite(hw, ((SIZE[0] - hw.width) // 2, (SIZE[1] - hw.height) // 2))
canvas.convert("RGB").save(IMG / "hardware-scanner-printer-rail.webp", "WEBP", quality=86, method=6)
print("hardware", hw.size)
