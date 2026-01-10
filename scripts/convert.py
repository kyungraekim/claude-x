import re
import argparse
from pathlib import Path
from typing import List, Dict, Tuple

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

def write_ts(images: List, out_path: Path, const_name: str = "LOGO_IMAGE"):
    """
    Write one or more images to TypeScript format.
    If images is a single image, outputs as AnsiImage.
    If images is a list of images, outputs as AnsiImage[] for animation.
    """
    def fmt_px(px: Dict) -> str:
        fg = f"[{', '.join(map(str, px['fg']))}]"
        bg = f"[{', '.join(map(str, px['bg']))}]" if px["bg"] else "undefined"
        return f"{{ fg: {fg}, bg: {bg} }}"

    def fmt_image(image: List) -> List[str]:
        """Format a single image as TypeScript lines."""
        img_lines = []
        for row in image:
            row_str = ", ".join(fmt_px(px) for px in row)
            img_lines.append(f"    [{row_str}],")
        return img_lines

    lines = []
    lines.append("import type { AnsiImage } from '@claude-x/core';")
    lines.append("")

    # Detect if we have multiple images (animation frames)
    is_animation = isinstance(images, list) and len(images) > 0 and isinstance(images[0], list) and len(images[0]) > 0 and isinstance(images[0][0], list)

    if is_animation:
        # Multiple frames - output as AnsiImage[]
        lines.append(f"export const {const_name}: AnsiImage[] = [")
        for frame_idx, image in enumerate(images):
            lines.append(f"  // Frame {frame_idx + 1}")
            lines.append("  [")
            lines.extend(fmt_image(image))
            lines.append("  ],")
        lines.append("];")
    else:
        # Single image - output as AnsiImage
        lines.append(f"export const {const_name}: AnsiImage = [")
        lines.extend(fmt_image(images))
        lines.append("];")

    out_path.write_text("\n".join(lines))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert ANSI art file(s) to TypeScript AnsiImage format",
        epilog="""
Examples:
  # Single image (static logo)
  python scripts/convert.py assets/images/logo.txt -o packages/cli/src/ui/assets/images/logo.image.ts

  # Multiple images (animated logo)
  python scripts/convert.py assets/images/frame1.txt assets/images/frame2.txt assets/images/frame3.txt -o packages/cli/src/ui/assets/images/logo.image.ts

  # Custom constant name
  python scripts/convert.py assets/images/banner.txt -o src/banner.ts -n BANNER_IMAGE
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "inputs",
        nargs="+",
        type=Path,
        help="One or more ANSI art files to convert. Multiple files create animation frames."
    )

    parser.add_argument(
        "-o", "--output",
        type=Path,
        required=True,
        help="Output TypeScript file path"
    )

    parser.add_argument(
        "-n", "--name",
        type=str,
        default="LOGO_IMAGE",
        help="Constant name for the exported image (default: LOGO_IMAGE)"
    )

    args = parser.parse_args()

    # Validate input files
    for input_file in args.inputs:
        if not input_file.exists():
            print(f"Error: Input file does not exist: {input_file}")
            exit(1)

    # Parse all input images
    images = [parse_ansi_file(input_file) for input_file in args.inputs]

    # If single image, pass as single image (not wrapped in array)
    # If multiple images, pass as array of images
    output_data = images if len(images) > 1 else images[0]

    # Write TypeScript output
    args.output.parent.mkdir(parents=True, exist_ok=True)
    write_ts(output_data, args.output, args.name)

    # Print summary
    if len(images) > 1:
        print(f"✓ Converted {len(images)} animation frames → {args.output}")
        for idx, img in enumerate(images):
            print(f"  Frame {idx + 1}: {len(img)} rows")
    else:
        print(f"✓ Converted {len(images[0])} rows → {args.output}")
