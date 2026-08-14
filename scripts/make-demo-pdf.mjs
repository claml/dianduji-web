// Generates public/demo.pdf — a two-page English research PDF with a real
// text layer, used to demo tap-to-look-up without shipping a large fixture.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function escapePdf(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function contentStream(lines, size = 16) {
  const ops = [];
  for (let i = 0; i < lines.length; i++) {
    ops.push(`${i === 0 ? '72 720' : '0 -30'} Td (${escapePdf(lines[i])}) Tj`);
  }
  return `BT /F1 ${size} Tf ${ops.join(' ')} ET`;
}

function buildPdf(pages) {
  const offsets = [0];
  let output = '%PDF-1.4\n';
  let id = 0;
  const add = (body) => {
    id += 1;
    offsets.push(output.length);
    output += `${id} 0 obj\n${body}\nendobj\n`;
  };

  // Object ids are assigned in write order; pages reference them by number.
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  add('<< /Type /Catalog /Pages 2 0 R >>'); // 1
  add(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`); // 2
  for (let i = 0; i < pages.length; i++) {
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
        `/Resources << /Font << /F1 ${4 + i * 3} 0 R >> >> ` +
        `/Contents ${5 + i * 3} 0 R >>`,
    ); // 3 + 3i
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'); // 4 + 3i
    const body = contentStream(pages[i]);
    add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`); // 5 + 3i
  }

  const xrefStart = output.length;
  output += `xref\n0 ${id + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= id; i++) {
    output += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${id + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return output;
}

const page1 = [
  'Foundation Models: A Survey of the Field',
  'Recent work on language models has shown that',
  'large-scale pretraining improves performance across',
  'many natural language processing tasks. In this paper',
  'we study the architecture, the training data, and the',
  'evaluation of foundation models on standard benchmarks.',
];
const page2 = [
  'Results and Discussion',
  'Our analysis confirms that model size and dataset',
  'quality are the most important factors for accuracy.',
  'The attention mechanism plays a central role in',
  'representing context, while the gradient of the loss',
  'guides the optimization of parameters during training.',
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public', 'demo.pdf'), buildPdf([page1, page2]));
console.log('wrote public/demo.pdf');
