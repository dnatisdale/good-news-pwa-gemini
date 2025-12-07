import pandas as pd
import os

CSV_PATH = 'scripts/your_content_data.csv'
EXCEL_PATH = 'Message tracks and length.XLSX'

def merge_data():
    print(f"Reading Excel: {EXCEL_PATH}")
    try:
        df_excel = pd.read_excel(EXCEL_PATH)
    except Exception as e:
        print(f"Failed to read Excel: {e}")
        return

    # Clean up column names (strip whitespace)
    df_excel.columns = df_excel.columns.str.strip()
    
    # Check if required columns exist
    required_cols = ['Program Set Number', 'Message Length', 'Track Count']
    for col in required_cols:
        if col not in df_excel.columns:
            print(f"Error: Column '{col}' not found in Excel. Found: {df_excel.columns}")
            return

    # Create mapping dictionary: Program Set Number -> {duration, trackCount}
    # Convert ID to string to ensure matching with CSV if needed, but usually matching int to int is better if clean.
    # Let's clean IDs to be safe.
    df_excel = df_excel.dropna(subset=['Program Set Number'])
    df_excel['Program Set Number'] = df_excel['Program Set Number'].astype(int)
    
    excel_map = df_excel.set_index('Program Set Number')[['Message Length', 'Track Count']].to_dict('index')
    
    print(f"Loaded {len(excel_map)} records from Excel.")

    print(f"Reading CSV: {CSV_PATH}")
    try:
        df_csv = pd.read_csv(CSV_PATH)
    except Exception as e:
        print(f"Failed to read CSV: {e}")
        return

    # Ensure ID column is handled
    if 'id' not in df_csv.columns:
         print("Error: 'id' column not found in CSV.")
         return

    # Merge data
    print("Merging data...")
    updates_count = 0
    
    # We use lists to collect new values to avoid fragmentation warnings with DataFrame
    new_durations = []
    new_track_counts = []

    for index, row in df_csv.iterrows():
        try:
            pid = int(row['id'])
        except:
            pid = None
        
        if pid in excel_map:
            new_durations.append(excel_map[pid]['Message Length'])
            new_track_counts.append(excel_map[pid]['Track Count'])
            updates_count += 1
        else:
            # Preserve existing if matched failed (or None if not exist)
            new_durations.append(row.get('duration', None))
            new_track_counts.append(row.get('trackCount', None))
            
    df_csv['duration'] = new_durations
    df_csv['trackCount'] = new_track_counts

    print(f"Updated {updates_count} rows with new data.")

    # Save
    print(f"Saving to {CSV_PATH}...")
    df_csv.to_csv(CSV_PATH, index=False)
    print("Success.")

if __name__ == "__main__":
    merge_data()
