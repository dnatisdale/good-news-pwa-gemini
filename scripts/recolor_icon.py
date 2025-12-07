
from PIL import Image
import math
import os

def recolor_icon(input_path, output_path):
    print(f"Opening {input_path}")
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    cx, cy = width // 2, height // 2
    
    # Target Red: #A51931 -> (165, 25, 49)
    target_r, target_g, target_b = 165, 25, 49
    threshold = 80 # Allow some variance
    radius_thresh = 180 # Pixels from center (approx 70% of 256)

    count = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0: continue
            
            # Check color distance
            # Unmultiply alpha for color check if needed, but simple RGB dist usually enough for solid colors
            # A51931 is quite distinct
            
            dist = math.sqrt((r - target_r)**2 + (g - target_g)**2 + (b - target_b)**2)
            
            # Check geometry (Outer part)
            radius = math.sqrt((x - cx)**2 + (y - cy)**2)
            
            if dist < threshold and radius > radius_thresh:
                # Replace with White, preserve alpha (or boost to full if it was border anti-aliasing against transparent? 
                # Better to keep alpha for smoothness)
                pixels[x, y] = (255, 255, 255, a)
                count += 1
                
    print(f"Replaced {count} pixels.")
    img.save(output_path)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    # Ensure artifacts dir exists
    dest_dir = r"C:\Users\dnati\.gemini\antigravity\brain\d7df2ea0-e9fe-433f-b642-f40ca94fa350"
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
    
    recolor_icon('public/android-chrome-512x512.png', os.path.join(dest_dir, 'white_border_icon.png'))
