import csv
import json
import os

# --- Configuration ---
# Ensure this matches your CSV file name
CSV_FILE_NAME = 'your_content_data.csv' 
OUTPUT_FILE_NAME = os.path.join('src', 'data', 'staticContent.js') 

# Define the mapping from your CSV headers to the desired JS object keys
# MUST MATCH THE HEADERS YOU PROVIDED: id, iso3, langID, etc.
FIELD_MAPPING = {
    # Core ID & Language Info
    'id': 'id',
    'langID': 'langId',
    'iso3': 'iso3',
    'langEn': 'languageEn',
    'langTh': 'langTh',
    
    # Message Titles and Content
    'titleEn': 'title_en',
    'titleTh': 'title_th',
    'verseEn': 'verse_en',
    'verseTh': 'verse_th',
    
    # URL Resources for Streaming and Offline
    'playUrl': 'streamUrl',
    'downloadTrack001Url': 'trackDownloadUrl',
    'downloadZipUrl': 'zipDownloadUrl',
    
    # Contextual fields
    'program': 'programId', 
}
# --- End Configuration ---

def convert_csv_to_js():
    data = []
    
    try:
        # 'utf-8-sig' handles the Byte Order Mark (\ufeff) correctly
        with open(CSV_FILE_NAME, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                new_item = {}
                is_valid = True
                
                # 1. Clean data and apply mapping
                for csv_key, js_key in FIELD_MAPPING.items():
                    # Use .get() to safely handle the empty column key that might appear
                    value = row.get(csv_key, '').strip()
                    
                    # Convert 'id' to an integer
                    if js_key == 'id':
                        if value.isdigit():
                            new_item[js_key] = int(value)
                        else:
                            is_valid = False
                            break # Skip this row if ID is invalid

                    # Handle the case where the key is missing or blank
                    elif value:
                        # Clean up those strange Unicode spaces (like \u200b) from content fields
                        if js_key in ['verse_en', 'verse_th']:
                             new_item[js_key] = value.replace('\u200b', '').replace(' a      ', '').replace('  bนั้น', 'นั้น')
                        else:
                             new_item[js_key] = value
                    else:
                        # Ensure the key is present, even if empty (for consistency)
                        new_item[js_key] = '' 
                
                # 2. Add item if valid
                if is_valid and new_item.get('id'):
                    data.append(new_item)
                else:
                    print(f"Skipping row due to missing or invalid ID.")

    except FileNotFoundError:
        print(f"Error: CSV file '{CSV_FILE_NAME}' not found. Please ensure it is in the same folder as this script.")
        return
    
    # Generate the JavaScript content
    js_content = f"// This file was automatically generated from your CSV data on {os.path.basename(CSV_FILE_NAME)}.\n"
    js_content += f"export const staticContent = {json.dumps(data, indent=4, ensure_ascii=False)};\n"

    # Save the output file
    try:
        os.makedirs(os.path.dirname(OUTPUT_FILE_NAME), exist_ok=True)
        
        with open(OUTPUT_FILE_NAME, mode='w', encoding='utf-8') as jsfile:
            jsfile.write(js_content)
        
        print(f"\nSuccess! Data converted and saved to: {OUTPUT_FILE_NAME}")
        print(f"Total {len(data)} items processed.")

    except Exception as e:
        print(f"Error saving file: {e}")


if __name__ == "__main__":
    convert_csv_to_js()