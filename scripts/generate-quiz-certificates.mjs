// Requires playwright and pdf-lib. Set CERTIFICATE_NODE_MODULES to a tools runtime if needed.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(process.env.CERTIFICATE_NODE_MODULES ? path.join(process.env.CERTIFICATE_NODE_MODULES, '_entry.cjs') : import.meta.url);
const { chromium } = require('playwright');
const { PDFDocument } = require('pdf-lib');
const directory = path.resolve('.certificates-private');
const records = JSON.parse(await readFile(path.join(directory, 'registrations.json'), 'utf8'));
const template = await readFile('public/images/quiz-2026-certificate.png');
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await mkdir(path.join(directory, 'pdfs'), { recursive: true });
const browser = await chromium.launch({headless:true, ...(process.env.CERTIFICATE_CHROME ? {executablePath:process.env.CERTIFICATE_CHROME} : {})});
try {
  const page = await browser.newPage();
  await page.setContent(`<html><head><meta charset="utf-8"><style>
    @page { size: 297mm 210mm; margin: 0; }
    * { box-sizing: border-box; } body { margin:0; }
    .certificate { width:297mm; height:210mm; position:relative; break-after:page; overflow:hidden; }
    .certificate:last-child { break-after:auto; }
    img { position:absolute; inset:0; width:100%; height:100%; }
    .name { position:absolute; left:26%; width:48%; top:43.2%; height:6.6%; display:flex; align-items:center; justify-content:center; color:#092342; text-align:center; font:600 27pt Georgia,'Times New Roman',serif; line-height:1.1; }
    .name.long { font-size:17pt; } .name.very-long { font-size:13pt; }
  </style></head><body>${records.map(r=>`<section class="certificate"><img alt=""><div dir="auto" class="name ${r.name.length>42?'very-long':r.name.length>28?'long':''}">${escape(r.name)}</div></section>`).join('')}</body></html>`);
  await page.evaluate(async source => { const images=[...document.images]; await Promise.all(images.map(img=>{img.src=source;return img.decode();})); }, `data:image/png;base64,${template.toString('base64')}`);
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('img').first().evaluate(img=>img.decode());
  await page.locator('.name').evaluateAll(nodes => {
    for (const node of nodes) {
      let size = parseFloat(getComputedStyle(node).fontSize);
      while ((node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) && size > 14) {
        size -= 1; node.style.fontSize = `${size}px`;
      }
    }
  });
  const overflow = await page.locator('.name').evaluateAll(nodes=>nodes.some(n=>n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1));
  if (overflow) throw new Error('A participant name overflows the certificate');
  const bytes = await page.pdf({printBackground:true, preferCSSPageSize:true});
  const all = await PDFDocument.load(bytes);
  if(all.getPageCount()!==records.length) throw new Error('Certificate page count mismatch');
  await writeFile(path.join(directory,'all-certificates.pdf'),bytes);
  for(let i=0;i<records.length;i++) {
    const doc=await PDFDocument.create();
    const [p]=await doc.copyPages(all,[i]); doc.addPage(p);
    doc.setTitle(`Participation Certificate - ${records[i].name}`);
    doc.setAuthor('Humanitarians');
    await writeFile(path.join(directory,'pdfs',`${records[i].id}.pdf`),await doc.save());
  }
  console.log(`Generated ${records.length} individual PDFs and a combined print file.`);
} finally { await browser.close(); }
