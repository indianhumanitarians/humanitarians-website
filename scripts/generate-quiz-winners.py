"""Generate five public winner PDFs locally. Does not upload or deploy anything.

Requirements: reportlab. Preview rendering uses pdftoppm separately.
Names/ranks/scores/times transcribed from the user-supplied IMG_1941.jpg.
"""
import json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/certificates/quiz-2026'
FONT = '/System/Library/Fonts/Supplemental/Georgia Bold.ttf'
pdfmetrics.registerFont(TTFont('WinnerName', FONT))
width, height = landscape(A4)
OUT.mkdir(parents=True, exist_ok=True)
for winner in json.loads((ROOT / 'src/data/quizWinners.json').read_text()):
    destination = OUT / (winner['slug'] + '.pdf')
    pdf = canvas.Canvas(str(destination), pagesize=(width, height))
    pdf.setTitle(f"{winner['prize']} - {winner['name']} - Islamic Quiz 2026")
    pdf.setAuthor('Team Humanitarians')
    pdf.drawImage(str(ROOT / 'assets/quiz-2026/templates' / (winner['slug'] + '.png')), 0, 0, width, height)
    size = 25
    while pdfmetrics.stringWidth(winner['name'], 'WinnerName', size) > width * .53:
        size -= .5
    if size < 14:
        raise ValueError('Winner name needs a layout adjustment')
    pdf.setFont('WinnerName', size)
    pdf.setFillColorRGB(.015, .17, .14)
    # All five templates retain the same blank name band above the lower laurels.
    pdf.drawCentredString(width / 2, height * .445 - size * .3, winner['name'])
    pdf.showPage()
    pdf.save()
print('Created five personalized A4 landscape winner PDFs.')
