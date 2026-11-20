"""
Python helper to build Deep Zoom (.dzi + tiles) using Pillow only.
No external dependencies beyond Pillow - works on all platforms.

Requirements:
    pip install Pillow

Usage:
    python tools/generate_dzi_pillow.py input.png output_basename --tile-size 254 --overlap 1

This will produce output_basename.dzi and output_basename_files/ in the same folder.
"""

import argparse
import os
import sys
import math
from PIL import Image
import xml.etree.ElementTree as ET

def create_dzi_descriptor(width, height, tile_size, overlap, output_path, tile_format='jpg'):
    """Generate .dzi XML descriptor file"""
    root = ET.Element('Image', {
        'xmlns': 'http://schemas.microsoft.com/deepzoom/2008',
        'Format': tile_format,
        'Overlap': str(overlap),
        'TileSize': str(tile_size)
    })
    size = ET.SubElement(root, 'Size', {
        'Width': str(width),
        'Height': str(height)
    })
    
    tree = ET.ElementTree(root)
    ET.indent(tree, space='  ')
    tree.write(output_path, encoding='utf-8', xml_declaration=True)

def generate_dzi(input_path, output_base, tile_size=254, overlap=1, quality=90):
    """
    Generate DZI tiles from source image using Pillow
    
    Args:
        input_path: Path to source PNG/JPG
        output_base: Output base path without extension
        tile_size: Size of each tile (default 254)
        overlap: Pixel overlap between tiles (default 1)
        quality: JPEG quality 1-95 (default 90)
    """
    
    # Validate input
    if not os.path.exists(input_path):
        print(f"ERROR: Input image not found: {input_path}")
        sys.exit(1)
    
    # Load image
    print(f"Loading image: {input_path}")
    try:
        img = Image.open(input_path)
        # Convert to RGB (JPEG doesn't support transparency)
        if img.mode == 'RGBA':
            # Create white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
            img = background
        elif img.mode not in ('RGB',):
            img = img.convert('RGB')
        width, height = img.size
        print(f"Image size: {width}x{height} pixels")
    except Exception as e:
        print(f"ERROR: Cannot open image: {e}")
        sys.exit(1)
    
    # Calculate max level (zoom levels)
    max_dimension = max(width, height)
    max_level = int(math.ceil(math.log(max_dimension, 2)))
    
    print(f"Generating {max_level + 1} zoom levels")
    print(f"Saving Deep Zoom to: {output_base}.dzi (tiles in {output_base}_files)")
    
    # Create tiles directory
    tiles_dir = f"{output_base}_files"
    os.makedirs(tiles_dir, exist_ok=True)
    
    # Generate tiles for each zoom level
    for level in range(max_level + 1):
        # Calculate dimensions for this level
        scale = 2 ** (max_level - level)
        level_width = math.ceil(width / scale)
        level_height = math.ceil(height / scale)
        
        # Resize image for this level
        print(f"  Level {level}: Resizing to {level_width}x{level_height}px...", end=" ", flush=True)
        level_img = img.resize((level_width, level_height), Image.Resampling.LANCZOS)
        
        # Create level directory
        level_dir = os.path.join(tiles_dir, str(level))
        os.makedirs(level_dir, exist_ok=True)
        
        # Calculate number of tiles
        cols = math.ceil(level_width / tile_size)
        rows = math.ceil(level_height / tile_size)
        
        tile_count = 0
        
        # Generate tiles
        for col in range(cols):
            for row in range(rows):
                # Calculate tile boundaries
                x = col * tile_size - (overlap if col > 0 else 0)
                y = row * tile_size - (overlap if row > 0 else 0)
                
                # Calculate tile dimensions with overlap
                w = tile_size + (overlap if col > 0 else 0) + (overlap if col < cols - 1 else 0)
                h = tile_size + (overlap if row > 0 else 0) + (overlap if row < rows - 1 else 0)
                
                # Ensure we don't go beyond image boundaries
                w = min(w, level_width - x)
                h = min(h, level_height - y)
                
                # Extract tile
                tile = level_img.crop((x, y, x + w, y + h))
                
                # Save tile
                tile_filename = f"{col}_{row}.jpg"
                tile_path = os.path.join(level_dir, tile_filename)
                tile.save(tile_path, 'JPEG', quality=quality, optimize=True)
                tile_count += 1
        
        print(f"Generated {tile_count} tiles ({cols}x{rows})")
    
    # Create .dzi descriptor
    dzi_path = f"{output_base}.dzi"
    create_dzi_descriptor(width, height, tile_size, overlap, dzi_path, 'jpg')
    
    print(f"\nSUCCESS: Generated {os.path.basename(output_base)}.dzi")
    print(f"Tiles folder: {os.path.basename(output_base)}_files/")
    print(f"Total zoom levels: {max_level + 1}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate Deep Zoom .dzi from a large image using Pillow')
    parser.add_argument('input', help='Input image path (png/jpg/tiff)')
    parser.add_argument('output', help='Output base path (no extension). Example: public/assets/workflows/workflow-email')
    parser.add_argument('--tile-size', type=int, default=254, help='Tile size (default: 254)')
    parser.add_argument('--overlap', type=int, default=1, help='Tile overlap (default: 1)')
    parser.add_argument('--quality', type=int, default=90, help='JPEG quality 1-95 (default: 90)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        raise SystemExit(f'ERROR: Input not found: {args.input}')
    
    generate_dzi(args.input, args.output, tile_size=args.tile_size, overlap=args.overlap, quality=args.quality)