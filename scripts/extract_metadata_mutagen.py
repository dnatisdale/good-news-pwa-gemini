import json
import os
from mutagen.mp3 import MP3, EasyMP3
from mutagen.id3 import ID3NoHeaderError

AUDIO_DIR = r"C:\GitHub\good-news-pwa-gemini\public\audio"
JSON_PATH = r"C:\GitHub\good-news-pwa-gemini\scripts\short_samples_list.json"

if not os.path.exists(JSON_PATH):
    print("JSON list not found")
    exit(1)

with open(JSON_PATH, 'r') as f:
    files_list = json.load(f)

results = []

for item in files_list:
    filename = item['file']
    file_path = os.path.join(AUDIO_DIR, filename)
    
    data = {
        "Filename": filename,
        "Album": "",
        "Composers": "",
        "Duration": item.get('duration')
    }
    
    try:
        audio = EasyMP3(file_path)
        
        # EasyMP3 maps keys nicely
        if 'album' in audio:
            data['Album'] = audio['album'][0]
        if 'composer' in audio:
            data['Composers'] = audio['composer'][0]
        if 'artist' in audio: # fallback/similar
            data['Artist'] = audio['artist'][0]
            
    except ID3NoHeaderError:
        data['Error'] = "No ID3 Header"
    except Exception as e:
        data['Error'] = str(e)
        
    results.append(data)

# Print as JSON for the agent to read
print(json.dumps(results, indent=2))
