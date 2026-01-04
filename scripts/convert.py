import re
from pathlib import Path

# ANSI regex
FG_RE = re.compile(r'\x1b\[38;2;(\d+);(\d+);(\d+)m')
BG_RE = re.compile(r'\x1b\[48;2;(\d+);(\d+);(\d+)m')
RESET_RE = re.compile(r'\x1b\[m')

PIXEL_CHAR = '▄'

def parse_ansi_line(line: str):
    fg = None
    bg = None
    row = []

    i = 0
    while i < len(line):
        # foreground
        fg_match = FG_RE.match(line, i)
        if fg_match:
            fg = tuple(map(int, fg_match.groups()))
            i = fg_match.end()
            continue

        # background
        bg_match = BG_RE.match(line, i)
        if bg_match:
            bg = tuple(map(int, bg_match.groups()))
            i = bg_match.end()
            continue

        # reset
        reset_match = RESET_RE.match(line, i)
        if reset_match:
            fg = None
            bg = None
            i = reset_match.end()
            continue

        # pixel
        if line[i] == PIXEL_CHAR:
            if fg is None:
                raise ValueError("Pixel without foreground color")
            row.append({
                "fg": fg,
                "bg": bg
            })
            i += 1
            continue

        # ignore everything else
        i += 1

    return row

def parse_ansi_file(path: Path):
    image = []
    for raw_line in path.read_text().splitlines():
        if raw_line.strip():
            image.append(parse_ansi_line(raw_line))
    return image

def write_ts(image, out_path: Path, const_name="LOGO_IMAGE"):
    def fmt_px(px):
        fg = f"[{', '.join(map(str, px['fg']))}]"
        bg = f"[{', '.join(map(str, px['bg']))}]" if px["bg"] else "undefined"
        return f"{{ fg: {fg}, bg: {bg} }}"

    lines = []
    lines.append("import type { AnsiImage } from '../../../types/index.js';")
    lines.append("")
    lines.append(f"export const {const_name}: AnsiImage = [")
    for row in image:
        row_str = ", ".join(fmt_px(px) for px in row)
        lines.append(f"  [{row_str}],")
    lines.append("] as const;")

    out_path.write_text("\n".join(lines))

if __name__ == "__main__":
    src = Path("assets/images/rashin.txt")
    dst = Path("src/ui/assets/images/logo.image.ts")

    image = parse_ansi_file(src)
    write_ts(image, dst)

    print(f"Converted {len(image)} rows → {dst}")
