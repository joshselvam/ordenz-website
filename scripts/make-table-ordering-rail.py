"""Table ordering rail card (420x236) from the QR table-stand photo; same for every country."""
from pathlib import Path
from PIL import Image

SRC = Path("_src_table_ordering.png")
OUT = Path("src/assets/img/table-ordering-rail.webp")

im = Image.open(SRC).convert("RGB")
w = im.width
h = round(w * 236 / 420)
top = max(0, min(im.height - h, round(im.height * 0.22)))
im.crop((0, top, w, top + h)).resize((420, 236), Image.Resampling.LANCZOS).save(OUT, "WEBP", quality=86, method=6)
print("crop", (0, top, w, top + h))
