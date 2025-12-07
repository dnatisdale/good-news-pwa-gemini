
from PIL import Image
import sys

def analyze_icon(path):
    try:
        img = Image.open(path).convert("RGBA")
        width, height = img.size
        cx, cy = width // 2, height // 2
        print(f"Image Size: {width}x{height}")
        
        # Scan vertical center line
        print("\nScanning vertical center line (Top to Bottom):")
        start_y = -1
        end_y = -1
        outer_color = None
        
        # Find top edge
        for y in range(height):
            pixel = img.getpixel((cx, y))
            if pixel[3] > 0: # Non-transparent
                print(f"Top Edge detected at y={y}, Color={pixel}")
                start_y = y
                outer_color = pixel
                break
        
        # Find bottom edge
        for y in range(height - 1, -1, -1):
            pixel = img.getpixel((cx, y))
            if pixel[3] > 0:
                print(f"Bottom Edge detected at y={y}, Color={pixel}")
                end_y = y
                break
                
        # Calculate Ring Thickness at top
        if start_y != -1:
            # Scan down from start_y until color changes significantly
            for y in range(start_y, cy):
                pixel = img.getpixel((cx, y))
                # Simple distance check
                dist = sum(abs(p - c) for p, c in zip(pixel, outer_color))
                if dist > 50: # Arbitrary threshold
                    print(f"Color change/Inner edge at y={y}, Color={pixel}")
                    print(f"Estimated Border Thickness: {y - start_y} pixels")
                    break
        
        # Scan horizontal center line
        print("\nScanning horizontal center line (Left to Right):")
        start_x = -1
        # Find left edge
        for x in range(width):
            pixel = img.getpixel((x, cy))
            if pixel[3] > 0:
                print(f"Left Edge detected at x={x}, Color={pixel}")
                start_x = x
                break

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_icon('public/android-chrome-512x512.png')
