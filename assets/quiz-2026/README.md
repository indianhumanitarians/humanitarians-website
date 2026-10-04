# Winner certificate artwork

Reviewed locally and approved by the user for website deployment on 4 October 2026.

The first, second, and third templates are the supplied prize images, copied without modification. Fourth and fifth were created with the built-in image generation tool, using the third-prize image as the edit target. Both were visually checked for consistent wording, rank, date, logo, and blank name placement.

Generation prompt (fourth):

> Use case: text-localization. Edit target: attached certificate. Create matching FOURTH PRIZE certificate template. Preserve exact layout, dimensions, Humanitarians logo, Arabic calligraphy, all existing wording and date, blank name line. Change THIRD PRIZE to FOURTH PRIZE; Third Place to Fourth Place; medal 3rd to 4th. Recolor bronze ribbon/border/laurels/medal into rich emerald green with subtle gold highlights so it is distinctive but clearly the same certificate family. Keep cream background and deep green typography, sharp print-quality lines. Do not insert a winner name. All other text must remain exactly unchanged, including Islamic Quiz Competition for Kids 2026, Sunday, 4th October 2026, Team Humanitarians (An IIT Kanpur Alumni Initiative).

Generation prompt (fifth): the same prompt with FOURTH/Fourth/4th replaced by FIFTH/Fifth/5th and the palette replaced by “royal sapphire blue with subtle silver highlights”.

Winner names, ranks, scores, and times come from the supplied `IMG_1941.jpg`. Capitalization is standardized for readability; the third-place entry retains the full parent-name wording in the source. No phone numbers or other registration details are included in the public winner assets.

`src/data/quizWinners.json` is shared by the page and `scripts/generate-quiz-winners.py`. The script produces the five named A4 PDFs under `public/certificates/quiz-2026/`; their PNG previews are rendered from those PDFs with `pdftoppm -scale-to 900 -png -singlefile`. The template images stay outside the public directory.
