import csv
import json
import re

def check_akeu():
    print("--- Checking CSV ---")
    csv_count = 0
    with open('your_content_data.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if 'Akeu' in row.get('langEn', '') or 'AEU' in row.get('iso3', ''):
                print(f"CSV Row: ID={row.get('id')}, Title={row.get('titleEn')}, Program={row.get('program')}")
                csv_count += 1
    print(f"Total Akeu in CSV: {csv_count}")

    print("\n--- Checking JS ---")
    with open('src/data/staticContent.js', 'r', encoding='utf-8') as f:
        content = f.read()
        # Extract the array content
        match = re.search(r'export const staticContent = (\[.*\]);', content, re.DOTALL)
        if match:
            json_str = match.group(1)
            # Fix potential trailing commas or JS specific syntax if any (simple JSON load might fail if strict)
            # But let's try loading it as JSON
            try:
                data = json.loads(json_str)
                js_count = 0
                programs = set()
                for item in data:
                    if item.get('languageEn') == 'Akeu':
                        print(f"JS Item: ID={item.get('id')}, Title={item.get('title_en')}, ProgramID={item.get('programId')}")
                        js_count += 1
                        programs.add(item.get('programId'))
                print(f"Total Akeu in JS: {js_count}")
                print(f"Unique Programs in JS: {programs}")
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error: {e}")
        else:
            print("Could not find staticContent array")

if __name__ == "__main__":
    check_akeu()
