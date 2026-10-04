"""Read the registration export; keep personal data in a git-ignored directory."""
import argparse
import hashlib
import json
import re
from pathlib import Path
import openpyxl

def phone(value):
    raw = str(int(value)) if isinstance(value, (float, int)) else str(value or '').strip()
    digits = re.sub(r'[^0-9]', '', raw)
    if digits.startswith('00'):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]
    if len(digits) == 10 and not raw.startswith('+'):
        digits = '91' + digits
    if not re.fullmatch(r'[1-9][0-9]{7,14}', digits):
        raise ValueError('Invalid mobile number')
    return '+' + digits

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('workbook')
    parser.add_argument('--output', default='.certificates-private')
    args = parser.parse_args()
    rows = list(openpyxl.load_workbook(args.workbook, read_only=True, data_only=True).active.values)
    headers = list(rows[0])
    ni, pi = headers.index("Child's full name"), headers.index('WhatsApp number')
    participants, duplicates = {}, 0
    for row_number, row in enumerate(rows[1:], 2):
        if not any(v is not None for v in row):
            continue
        name = ' '.join(str(row[ni] or '').split())
        if not name:
            raise ValueError(f'Missing name at row {row_number}')
        try:
            mobile = phone(row[pi])
        except ValueError as e:
            raise ValueError(f'Invalid phone at row {row_number}') from e
        key = mobile + '\n' + name.casefold()
        if key in participants:
            participants[key]['sourceRows'].append(row_number)
            duplicates += 1
            continue
        identifier = hashlib.sha256(('islamic-quiz-2026\n' + key).encode()).hexdigest()[:32]
        participants[key] = dict(id=identifier, name=name, phone=mobile, sourceRows=[row_number])
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    records = list(participants.values())
    (out / 'registrations.json').write_text(json.dumps(records, ensure_ascii=False, indent=2))
    summary = dict(registrationRows=sum(len(r['sourceRows']) for r in records), certificates=len(records), duplicateRegistrations=duplicates, mobileNumbers=len(set(r['phone'] for r in records)))
    (out / 'summary.json').write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary))

if __name__ == '__main__':
    main()
