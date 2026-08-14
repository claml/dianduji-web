/**
 * Plain-text document reader: scrollable paragraph rendering with
 * tap-to-look-up, UTF-8 with GB18030 fallback (mirrors the mobile app's
 * TXT import support).
 */

export type TxtWordTapHandler = (
  word: string,
  tokenIndex: number,
  sentence: string,
) => void;

export function decodeText(buffer: ArrayBuffer): string {
  for (const encoding of ['utf-8', 'gb18030'] as const) {
    try {
      return new TextDecoder(encoding, { fatal: true }).decode(buffer);
    } catch {
      // try the next encoding
    }
  }
  return new TextDecoder('utf-8').decode(buffer);
}

export class TxtReader {
  private paragraphs: string[] = [];
  private tokenList: string[] = [];

  constructor(
    private readonly container: HTMLElement,
    private readonly onWordTap: TxtWordTapHandler,
  ) {}

  get tokens(): string[] {
    return this.tokenList;
  }

  async open(file: File): Promise<void> {
    const text = decodeText(await file.arrayBuffer());
    this.render(text);
  }

  private render(text: string): void {
    this.container.replaceChildren();
    this.paragraphs = [];
    this.tokenList = [];
    const blocks = text
      .split(/\n\s*\n/)
      .map((block) => block.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    for (const block of blocks) {
      this.paragraphs.push(block);
      const paragraph = document.createElement('p');
      paragraph.className = 'txt-paragraph';
      const words = block.split(/([A-Za-z][A-Za-z'’-]*)/g);
      for (const piece of words) {
        if (/^[A-Za-z]/.test(piece)) {
          const index = this.tokenList.length;
          this.tokenList.push(piece);
          const span = document.createElement('span');
          span.className = 'txt-word';
          span.textContent = piece;
          span.addEventListener('click', () => {
            span.classList.add('hit');
            this.onWordTap(piece, index, block);
          });
          paragraph.appendChild(span);
        } else if (piece) {
          paragraph.appendChild(document.createTextNode(piece));
        }
      }
      this.container.appendChild(paragraph);
    }
  }

  scrollRatio(): number {
    const { scrollTop, scrollHeight, clientHeight } = this.container;
    if (scrollHeight <= clientHeight) return 0;
    return Math.min(1, Math.max(0, scrollTop / (scrollHeight - clientHeight)));
  }

  restoreScroll(ratio: number): void {
    if (ratio <= 0) return;
    const { scrollHeight, clientHeight } = this.container;
    if (scrollHeight > clientHeight) {
      this.container.scrollTop = ratio * (scrollHeight - clientHeight);
    }
  }
}
