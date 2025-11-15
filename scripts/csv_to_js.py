import csv
import json
import os

# --- Configuration ---
CSV_FILE_NAME = 'your_content_data.csv' 
OUTPUT_FILE_NAME = os.path.join('src', 'data', 'staticContent.js') 

# Define the mapping from your CSV headers to the desired JS object keys
# These are the columns you want to include in the PWA data object.
FIELD_MAPPING = {
       'id': 'id',
    'langID': 'langId',          # <-- NEW COLUMN MAPPING HERE
    'iso3': 'iso3',
    'langEn': 'languageEn',
    'langTh': 'languageTh',
    'titleEn': 'title_en',
    'titleTh': 'title_th',
    'VerseEn': 'verse_en',
    'VerseTh': 'verse_th',
    'playUrl': 'streamUrl',
    'downloadTrack001Url': 'trackDownloadUrl',
    'downloadZipUrl': 'zipDownloadUrl',
    
    # You can add other fields from your CSV here if you want them in the object:
    # 'Bible Reference': 'bibleRef',
    # 'Book': 'bookName' 
}
# --- End Configuration ---

def convert_csv_to_js():
    data = []
    
    try:
        with open(CSV_FILE_NAME, mode='r', encoding='utf-8') as csvfile:
            # Use csv.DictReader to read rows as dictionaries
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                new_item = {}
                
                for csv_key, js_key in FIELD_MAPPING.items():
                    value = row.get(csv_key, '').strip()
                    
                    # Convert 'id' to an integer for correct routing
                    if js_key == 'id' and value.isdigit():
                        new_item[js_key] = int(value)
                    else:
                        new_item[js_key] = value

                # Skip rows that don't have a valid ID
                if 'id' in new_item and new_item['id']:
                    data.append(new_item)
                else:
                    print(f"Skipping row due to missing or invalid ID: {row}")

    except FileNotFoundError:
        print(f"Error: CSV file '{CSV_FILE_NAME}' not found. Please ensure it is in the same folder as this script.")
        return
    
    # Generate the JavaScript content
    js_content = f"// This file was automatically generated from your CSV data.\n"
    js_content += f"export const staticContent = {json.dumps(data, indent=4, ensure_ascii=False)};\n"

    # Save the output file
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(OUTPUT_FILE_NAME), exist_ok=True)
        
        with open(OUTPUT_FILE_NAME, mode='w', encoding='utf-8') as jsfile:
            jsfile.write(js_content)
        
        print(f"\nSuccess! Data converted and saved to: {OUTPUT_FILE_NAME}")
        print(f"Total {len(data)} items processed.")

    except Exception as e:
        print(f"Error saving file: {e}")


if __name__ == "__main__":
    convert_csv_to_js()