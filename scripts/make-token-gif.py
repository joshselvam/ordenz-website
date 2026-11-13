"""Build an OrdenZ Token TV fill-up GIF for the marketing site."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1272, 810
BG = (7, 17, 14)
PANEL = (16, 36, 28)
TEAL = (46, 230, 199)
TEAL_INK = (4, 34, 28)
GOLD = (240, 177, 61)
DASH = (70, 95, 82)
OUT = Path(__file__).resolve().parents[1] / "src" / "assets" / "img" / "token-board-fill.gif"


def font(size: int) -> ImageFont.ImageFont:
    for name in (
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\calibrib.ttf",
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


F_H = font(18)
F_NUM_PREP = font(52)
F_NUM_READY = font(40)


def rounded_rect(draw, xy, r, fill=None, outline=None, width=2):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def draw_dashed_rect(draw, xy, r=10, color=DASH, dash=8, gap=6, width=2):
    x0, y0, x1, y1 = xy

    def hline(y, xa, xb):
        x = xa
        while x < xb:
            x2 = min(x + dash, xb)
            draw.line([(x, y), (x2, y)], fill=color, width=width)
            x += dash + gap

    def vline(x, ya, yb):
        y = ya
        while y < yb:
            y2 = min(y + dash, yb)
            draw.line([(x, y), (x, y2)], fill=color, width=width)
            y += dash + gap

    hline(y0, x0 + r, x1 - r)
    hline(y1, x0 + r, x1 - r)
    vline(x0, y0 + r, y1 - r)
    vline(x1, y0 + r, y1 - r)
    draw.arc([x0, y0, x0 + 2 * r, y0 + 2 * r], 180, 270, fill=color, width=width)
    draw.arc([x1 - 2 * r, y0, x1, y0 + 2 * r], 270, 360, fill=color, width=width)
    draw.arc([x0, y1 - 2 * r, x0 + 2 * r, y1], 90, 180, fill=color, width=width)
    draw.arc([x1 - 2 * r, y1 - 2 * r, x1, y1], 0, 90, fill=color, width=width)


def draw_board(prep_tokens, ready_tokens, flash=None):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    # Board only — caption + Counter/Guest/Showcase/Token live in the page, not in the GIF.
    pad = 24
    gap = 16
    col_w = (W - pad * 2 - gap) // 2
    board_top = 20
    board_h = H - pad - board_top
    panels = [
        ("IN PREPARATION", prep_tokens, True, pad),
        ("READY FOR COLLECTION", ready_tokens, False, pad + col_w + gap),
    ]
    cols, rows = 4, 2
    for title, tokens, is_prep, left in panels:
        right = left + col_w
        rounded_rect(d, (left, board_top, right, board_top + board_h), 16, fill=PANEL)
        d.text((left + 18, board_top + 16), title, fill=TEAL, font=F_H)
        grid_top = board_top + 52
        grid_pad = 16
        cell_gap = 12
        usable_w = col_w - grid_pad * 2
        usable_h = board_h - 72
        cell_w = (usable_w - cell_gap * (cols - 1)) // cols
        cell_h = (usable_h - cell_gap * (rows - 1)) // rows
        for i in range(cols * rows):
            r, c = i // cols, i % cols
            x0 = left + grid_pad + c * (cell_w + cell_gap)
            y0 = grid_top + r * (cell_h + cell_gap)
            x1, y1 = x0 + cell_w, y0 + cell_h
            if i < len(tokens):
                num = tokens[i]
                if is_prep:
                    fill, outline, ink, fnt = (14, 91, 73), TEAL, GOLD, F_NUM_PREP
                else:
                    fill, outline, ink, fnt = TEAL, TEAL, TEAL_INK, F_NUM_READY
                if flash == (is_prep, i):
                    fill = (30, 120, 100) if is_prep else (120, 255, 230)
                rounded_rect(d, (x0, y0, x1, y1), 10, fill=fill, outline=outline, width=2)
                text = str(num)
                bbox = d.textbbox((0, 0), text, font=fnt)
                tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
                d.text(
                    (x0 + (cell_w - tw) / 2, y0 + (cell_h - th) / 2 - 4),
                    text,
                    fill=ink,
                    font=fnt,
                )
            else:
                draw_dashed_rect(d, (x0, y0, x1, y1), r=10, color=DASH)
    return im


def build_timeline():
    timeline = []
    prep, ready = [], []
    timeline += [(list(prep), list(ready))] * 2
    for n in [14, 21, 3, 18, 7, 11]:
        prep.append(n)
        timeline += [(list(prep), list(ready))] * 2
    for m in [14, 21, 3]:
        if m in prep:
            prep.remove(m)
        ready.append(m)
        timeline += [(list(prep), list(ready))] * 2
    for n in [18, 7]:
        if n in prep:
            prep.remove(n)
        ready.append(n)
        timeline.append((list(prep), list(ready)))
    timeline += [(list(prep), list(ready))] * 4
    timeline += [([], [9])] * 2
    return timeline


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    timeline = build_timeline()
    frames = []
    durations = []
    prev = None
    for prep, ready in timeline:
        flash = None
        if prev is not None:
            if len(prep) > len(prev[0]):
                flash = (True, len(prep) - 1)
            elif len(ready) > len(prev[1]):
                flash = (False, len(ready) - 1)
        frames.append(draw_board(prep, ready, flash))
        durations.append(360 if flash else 500)
        prev = (prep, ready)

    frames[0].save(
        OUT,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=True,
        disposal=2,
    )
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB, {len(frames)} frames)")


if __name__ == "__main__":
    main()
