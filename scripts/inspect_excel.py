import pandas as pd

try:
    df = pd.read_excel('Message tracks and length.XLSX')
    print("--- COLUMNS ---")
    for col in df.columns:
        print(f"'{col}'")
    
    print("\n--- SAMPLE DATA ---")
    if 'Program Set Number' in df.columns and 'Message Length' in df.columns:
         print(df[['Program Set Number', 'Message Length']].dropna().head())
    else:
        print("Expected columns not found. Head:")
        print(df.head())

except Exception as e:
    print(f"Error reading Excel file: {e}")
