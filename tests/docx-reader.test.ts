import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { extractDocxText } from '../src/docx-reader';

function makeDocxXml(paragraphs: string[]): string {
  const runs = paragraphs
    .map(
      (text) =>
        `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`,
    )
    .join('');
  return `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${runs}</w:body></w:document>`;
}

async function makeDocx(paragraphs: string[]): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file('word/document.xml', makeDocxXml(paragraphs));
  return zip.generateAsync({ type: 'arraybuffer' });
}

describe('extractDocxText', () => {
  it('extracts paragraphs from document.xml', async () => {
    const docx = await makeDocx(['Hello world.', 'Deep learning is exciting.']);
    const text = await extractDocxText(docx);
    expect(text).toBe('Hello world.\n\nDeep learning is exciting.');
  });

  it('handles XML entities', async () => {
    const docx = await makeDocx(['A &amp; B &lt;tag&gt;']);
    const text = await extractDocxText(docx);
    expect(text).toBe('A & B <tag>');
  });

  it('rejects non-docx payloads', async () => {
    await expect(
      extractDocxText(new TextEncoder().encode('not a zip').buffer),
    ).rejects.toThrow();
  });
});
