"""
Python helper to build Deep Zoom (.dzi + tiles) using pyvips (libvips binding).
Recommended for very large images (7000x7000 and larger).


Requirements:
- Install libvips on your machine (Ubuntu/Debian example):
sudo apt-get install -y libvips-tools libvips-dev
- Then install the python binding:
pip install pyvips


Usage:
python tools/generate_dzi.py input.png output_basename --tile-size 256 --overlap 1 --format dzi


This will produce output_basename.dzi and output_basename_files/ in the same folder.
"""


import argparse
import os
import pyvips




def generate_dzi(input_path, output_base, tile_size=256, overlap=1):
# pyvips' dzsave writes the folder and .dzi file for you.
# output_base should exclude the extension — pyvips will create output_base.dzi
print(f"Loading image: {input_path}")
image = pyvips.Image.new_from_file(input_path, access='sequential')


print(f"Saving Deep Zoom to: {output_base}.dzi (tiles in {output_base}_files)")
# vips dzsave options are intuitive and fast
image.dzsave(output_base, tile_size=tile_size, overlap=overlap, suffix='.jpg[Q=90]')




if __name__ == '__main__':
parser = argparse.ArgumentParser(description='Generate Deep Zoom .dzi from a large image using pyvips')
parser.add_argument('input', help='Input image path (png/jpg/tiff)')
parser.add_argument('output', help='Output base path (no extension). Example: public/assets/workflows/workflow-email')
parser.add_argument('--tile-size', type=int, default=256)
parser.add_argument('--overlap', type=int, default=1)


args = parser.parse_args()
if not os.path.exists(args.input):
raise SystemExit('Input not found: ' + args.input)


generate_dzi(args.input, args.output, tile_size=args.tile_size, overlap=args.overlap)