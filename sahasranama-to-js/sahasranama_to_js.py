import os
import json
import gspread
from google.oauth2.service_account import Credentials


def authenticate_google_sheets(creds_json_path):
    if "DRIVE_JSON" in os.environ:
        creds_dict = json.loads(os.environ["DRIVE_JSON"])
        creds = Credentials.from_service_account_info(creds_dict, scope=[
            "https://www.googleapis.com/auth/spreadsheets", 
            "https://www.googleapis.com/auth/drive"])
        client = gspread.authorize(creds)
        print("Authenticated from environment")
    else:
        client = gspread.service_account(filename=creds_json_path)
        print("Authenticated from file")
    return client


def read_google_sheet_to_json(sheet_url, worksheet_name='निरुक्त', creds_json_path='credentials.json'):
    client = authenticate_google_sheets(creds_json_path)
    sheet = client.open_by_url(sheet_url)
    print(f"Opened sheet: {sheet.title}")
    worksheet = sheet.worksheet(worksheet_name)
    print(f"Accessing worksheet: {worksheet.title}")
    records = worksheet.get_all_records()
    return records


def arrange_by_shlokas(rows):
    unique_shlokas = set(row['श्लोक'] for row in rows if 'श्लोक' in row and row['श्लोक'])
    print(f"Number of unique 'श्लोक': {len(unique_shlokas)}")
    shlokas = [[[], []] for _ in range(len(unique_shlokas))]
    commentary = [[[], []] for _ in range(len(unique_shlokas))]
    meanings = [[[], []] for _ in range(len(unique_shlokas))]
    for idx, r in enumerate(rows):
        try:
            print(f'\rProcessing row {idx + 1}/{len(rows)}', end='')
            shloka_index = int(r['श्लोक']) - 1
            line_index = int(r['line']) - 1
            shlokas[shloka_index][line_index].append(r['नाम'])
            commentary[shloka_index][line_index].append(r['निरुक्त'])
            meanings[shloka_index][line_index].append(
                (r['meaning'][0].upper() + r['meaning'][1:] if 'meaning' in r and r['meaning'] else '')
            )
        except KeyError as e:
            print(f"\nMissing key: {e} in row {idx + 1}")
        except ValueError as e:
            print(f"\nStrange: {e} in row {idx + 1}")
    print("\nArrangement complete.")
    return {
        'shlokas': shlokas,
        'commentary': commentary,
        'meanings': meanings
    }


def generate_js(file_path, by_shlokas):
    with open(file_path, 'w', encoding='utf-8') as f:
        for sahasranama_aspect in by_shlokas:
            f.write(f'export const {sahasranama_aspect} = ')
            f.write(repr(by_shlokas[sahasranama_aspect]).replace('], [', '],\n  [').replace('[[', '[\n  [').replace(']]', ']\n]'))
            f.write(';\n\n')
    print(f"JavaScript file generated at: {file_path}")


sheet_url = 'https://docs.google.com/spreadsheets/d/1GSlkxfaZNf7iYALmWIM26SP5l5PZ69l4mg6OaU2iIVE'
rows = read_google_sheet_to_json(sheet_url)
by_shlokas = arrange_by_shlokas(rows)
generate_js('../frontend/src/sahasranama.js', by_shlokas)
