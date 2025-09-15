import gspread

def read_google_sheet_to_json(sheet_url, worksheet_name='निरुक्त', creds_json_path='credentials.json'):
    client = gspread.service_account(filename=creds_json_path)
    print("Authenticated successfully.")

    # Open the sheet
    sheet = client.open_by_url(sheet_url)
    print(f"Opened sheet: {sheet.title}")
    worksheet = sheet.worksheet(worksheet_name)
    print(f"Accessing worksheet: {worksheet.title}")
    # Get all records as list of dicts
    records = worksheet.get_all_records()
    return records


sheet_url = 'https://docs.google.com/spreadsheets/d/1GSlkxfaZNf7iYALmWIM26SP5l5PZ69l4mg6OaU2iIVE'
data = read_google_sheet_to_json(sheet_url)
print(data)
