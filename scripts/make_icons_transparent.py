from PIL import Image
import os

def remove_white_background(input_path, output_path, threshold=250):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if pixel is white-ish
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully saved transparent image to {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# Paths
base_dir = r"c:\GitHub\good-news-pwa-gemini\public"
icon_512 = os.path.join(base_dir, "icon-512.png")
icon_192 = os.path.join(base_dir, "icon-192.png")
android_icon = os.path.join(base_dir, "android-chrome-512x512.png")

# Process icons
remove_white_background(icon_512, icon_512)
remove_white_background(icon_192, icon_192)
remove_white_background(android_icon, android_icon)

# For favicon.ico, we usually want a 16x16, 32x32, 48x48 multisize ico. 
# But for now, let's just save the 512 version as a resized ico if possible, or just rely on the PNGs in index.html.
# We will create a new favicon.ico from the transparent 512 image.
try:
    img = Image.open(icon_512)
    img.save(os.path.join(base_dir, "favicon.ico"), format='ICO', sizes=[(32, 32)])
    print("Successfully updated favicon.ico")
except Exception as e:
    print(f"Error saving favicon.ico: {e}")
