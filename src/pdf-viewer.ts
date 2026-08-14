import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { charOffsetPx, tokenizeItem } from './tokenize';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/** Minimal structural view of a pdf.js text run. */
interface TextRunLike {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

export type WordTapHandler = (
  word: string,
  tokenIndex: number,
  sentence: string,
) => void;

/** Structural view of a pdf.js outline item. */
export interface OutlineLike {
  title: string;
  pageNumber?: number | null;
  dest?: unknown;
  url?: string | null;
}

export class PdfViewer {
  private doc: PDFDocumentProxy | null = null;
  private renderTask: pdfjsLib.RenderTask | null = null;
  private outline: OutlineLike[] | null = null;
  pageNum = 1;
  scale = 1.2;

  /** Tokens of the rendered page in visual order (one per clickable span). */
  private pageTokens: string[] = [];
  /** Source text run each token came from (the tap "sentence"). */
  private runSentences: string[] = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly textLayer: HTMLElement,
    private readonly onWordTap: WordTapHandler,
  ) {}

  get pageCount(): number {
    return this.doc?.numPages ?? 0;
  }

  get hasDocument(): boolean {
    return this.doc != null;
  }

  get tokens(): string[] {
    return this.pageTokens;
  }

  sentenceOf(tokenIndex: number): string {
    return this.runSentences[tokenIndex] ?? '';
  }

  async getOutline(): Promise<OutlineLike[] | null> {
    if (!this.doc) return null;
    if (this.outline == null) {
      this.outline = (await this.doc.getOutline()) as OutlineLike[] | null;
    }
    return this.outline;
  }

  async open(file: File): Promise<void> {
    this.doc?.destroy();
    const data = await file.arrayBuffer();
    this.doc = await pdfjsLib.getDocument({ data }).promise;
    this.outline = null;
    this.pageNum = 1;
    await this.render();
  }

  async goto(page: number): Promise<void> {
    if (!this.doc) return;
    this.pageNum = Math.min(Math.max(1, page), this.doc.numPages);
    await this.render();
  }

  async next(): Promise<void> {
    if (this.pageNum < this.pageCount) await this.goto(this.pageNum + 1);
  }

  async prev(): Promise<void> {
    if (this.pageNum > 1) await this.goto(this.pageNum - 1);
  }

  async setScale(scale: number): Promise<void> {
    this.scale = Math.min(Math.max(0.5, scale), 4);
    await this.render();
  }

  private async render(): Promise<void> {
    if (!this.doc) return;
    this.renderTask?.cancel();
    const page = await this.doc.getPage(this.pageNum);
    const viewport = page.getViewport({ scale: this.scale });

    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('2D canvas context unavailable');
    const outputScale = Math.max(window.devicePixelRatio || 1, 1);
    this.canvas.width = Math.floor(viewport.width * outputScale);
    this.canvas.height = Math.floor(viewport.height * outputScale);
    this.canvas.style.width = `${Math.floor(viewport.width)}px`;
    this.canvas.style.height = `${Math.floor(viewport.height)}px`;

    const task = page.render({
      canvasContext: context,
      viewport,
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
    });
    this.renderTask = task;
    await task.promise;

    this.textLayer.style.width = `${Math.floor(viewport.width)}px`;
    this.textLayer.style.height = `${Math.floor(viewport.height)}px`;
    this.textLayer.replaceChildren();
    await this.buildTextLayer(page, viewport);
  }

  private async buildTextLayer(
    page: pdfjsLib.PDFPageProxy,
    viewport: pdfjsLib.PageViewport,
  ): Promise<void> {
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => 'str' in item)
      .map((item) => item as unknown as TextRunLike);

    this.pageTokens = [];
    this.runSentences = [];
    let tokenIndex = 0;
    for (const item of items) {
      const tokens = tokenizeItem(item.str);
      if (tokens.length === 0) continue;

      // Device-space transform of this text run (same math as pdf.js's
      // official text layer builder).
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const baseLeft = tx[4];
      const baseTop = tx[5];
      const fontSizePx = Math.hypot(tx[2], tx[3]);

      for (const token of tokens) {
        const span = document.createElement('span');
        span.textContent = token.text;
        span.style.left = `${baseLeft + charOffsetPx(fontSizePx, token.startChar)}px`;
        span.style.top = `${baseTop}px`;
        span.style.fontSize = `${fontSizePx}px`;
        span.style.transform = `matrix(${tx[0]}, ${tx[1]}, ${tx[2]}, ${tx[3]}, 0, 0)`;
        const index = tokenIndex;
        span.addEventListener('click', () => {
          span.classList.add('hit');
          this.onWordTap(token.text, index, item.str.trim());
        });
        this.textLayer.appendChild(span);
        this.pageTokens.push(token.text);
        this.runSentences.push(item.str.trim());
        tokenIndex++;
      }
    }
  }
}
