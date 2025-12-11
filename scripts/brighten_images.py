from PIL import Image, ImageEnhance
import os

def brighten_image(path, factor=1.25):
    try:
        img = Image.open(path)
        # Handle transparency (RGBA)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            
        enhancer = ImageEnhance.Brightness(img)
        bright_img = enhancer.enhance(factor)
        
        bright_img.save(path)
        print(f"Brightened: {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")

# List of files to brighten
files_to_brighten = [
    r"c:\GitHub\good-news-pwa-gemini\src\assets\logo.png",
    r"c:\GitHub\good-news-pwa-gemini\public\favicon.ico",
    r"c:\GitHub\good-news-pwa-gemini\public\logo192.png",
    r"c:\GitHub\good-news-pwa-gemini\public\logo512.png",
    # Add other icons found in public/icons if needed, generally the main logos are enough
    r"c:\GitHub\good-news-pwa-gemini\public\icons\icon-192x192.png",
    r"c:\GitHub\good-news-pwa-gemini\public\icons\icon-512x512.png"
]

for file_path in files_to_brighten:
    if os.path.exists(file_path):
        brighten_image(file_path)
    else:
        print(f"Skipped (not found): {file_path}")
