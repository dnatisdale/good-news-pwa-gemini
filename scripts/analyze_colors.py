from PIL import Image
import os
import math

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]), int(rgb[1]), int(rgb[2]))

def get_average_color(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert('RGB')
        # Crop to the header area (top 10-60 pixels to avoid status bar and bottom shadow)
        # Assuming header is roughly top 60px
        width, height = img.size
        header_crop = img.crop((0, 0, width, min(80, height)))
        
        # Resize to 1x1 to get average
        avg_color_img = header_crop.resize((1, 1), Image.Resampling.LANCZOS)
        color = avg_color_img.getpixel((0, 0))
        return color
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

# 1. Define the 5 sources
image_paths = [
    r"C:/Users/dnati/.gemini/antigravity/brain/ceb1fc25-53b5-46e9-811d-252edb403c72/uploaded_image_0_1764376742760.png",
    r"C:/Users/dnati/.gemini/antigravity/brain/ceb1fc25-53b5-46e9-811d-252edb403c72/uploaded_image_1_1764376742760.png",
    r"C:/Users/dnati/.gemini/antigravity/brain/ceb1fc25-53b5-46e9-811d-252edb403c72/uploaded_image_2_1764376742760.png",
    r"C:/Users/dnati/.gemini/antigravity/brain/ceb1fc25-53b5-46e9-811d-252edb403c72/uploaded_image_3_1764376742760.png"
]

existing_brand_dark = "#8a160a"

# 2. Collect RGB values
rgb_values = []

# Add existing brand color
rgb_values.append(hex_to_rgb(existing_brand_dark))
print(f"Source 1 (Code): {existing_brand_dark} -> {rgb_values[0]}")

# Add colors from images
for i, path in enumerate(image_paths):
    if os.path.exists(path):
        color = get_average_color(path)
        if color:
            rgb_values.append(color)
            print(f"Source {i+2} (Image): {rgb_to_hex(color)} -> {color}")
    else:
        print(f"File not found: {path}")

# 3. Calculate Average
if rgb_values:
    avg_r = sum(c[0] for c in rgb_values) / len(rgb_values)
    avg_g = sum(c[1] for c in rgb_values) / len(rgb_values)
    avg_b = sum(c[2] for c in rgb_values) / len(rgb_values)
    
    final_avg_rgb = (avg_r, avg_g, avg_b)
    final_hex = rgb_to_hex(final_avg_rgb)
    
    print(f"\n--- Result ---")
    print(f"Average RGB: {final_avg_rgb}")
    print(f"Calculated HEX: {final_hex}")
else:
    print("No colors found to analyze.")
