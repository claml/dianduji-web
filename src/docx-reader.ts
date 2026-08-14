/**
 * DOCX text extraction for the reader.
 *
 * A .docx file is a zip archive; paragraphs live in word/document.xml as
 * <w:p> runs of <w:t> text. jszip handles the zip (deflate) side.
 */

import JSZip from 'jszip';

export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const entry = zip.file('word/document.xml');
  if (!entry) throw new Error('not a valid .docx (missing word/document.xml)');
  const xml = await entry.async('string');

  const paragraphs: string[] = [];
  const paragraphPattern = /<w:p[ >]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = paragraphPattern.exec(xml)) != null) {
    const end = xml.indexOf('</w:p>', match.index);
    if (end < 0) break;
    const body = xml.slice(match.index, end);
    const texts: string[] = [];
    const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = textPattern.exec(body)) != null) {
      texts.push(decodeXml(textMatch[1]));
    }
    const line = texts.join('').replace(/\s+/g, ' ').trim();
    if (line) paragraphs.push(line);
    cursor = end + 6;
    paragraphPattern.lastIndex = cursor;
  }
  if (paragraphs.length === 0) {
    throw new Error('document.xml contains no readable text');
  }
  return paragraphs.join('\n\n');
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
