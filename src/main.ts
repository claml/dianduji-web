import './style.css';
import { PdfViewer } from './pdf-viewer';
import { fetchChunkLoader, WebDictionary } from './dictionary';

const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;
const openBtn = document.querySelector<HTMLButtonElement>('#open-btn')!;
const canvas = document.querySelector<HTMLCanvasElement>('#pdf-canvas')!;
const textLayer = document.querySelector<HTMLElement>('#text-layer')!;
const emptyState = document.querySelector<HTMLElement>('#empty-state')!;
const wordCard = document.querySelector<HTMLElement>('#word-card')!;
const wordSurface = document.querySelector<HTMLElement>('#word-surface')!;
const wordPhonetic = document.querySelector<HTMLElement>('#word-phonetic')!;
const wordPos = document.querySelector<HTMLElement>('#word-pos')!;
const wordMeaning = document.querySelector<HTMLElement>('#word-meaning')!;
const wordSource = document.querySelector<HTMLElement>('#word-source')!;
const wordClose = document.querySelector<HTMLButtonElement>('#word-close')!;
const prevBtn = document.querySelector<HTMLButtonElement>('#prev-page')!;
const nextBtn = document.querySelector<HTMLButtonElement>('#next-page')!;
const zoomInBtn = document.querySelector<HTMLButtonElement>('#zoom-in')!;
const zoomOutBtn = document.querySelector<HTMLButtonElement>('#zoom-out')!;
const pageLabel = document.querySelector<HTMLElement>('#page-label')!;
const zoomLabel = document.querySelector<HTMLElement>('#zoom-label')!;

const dictionary = new WebDictionary(fetchChunkLoader());
const viewer = new PdfViewer(canvas, textLayer, showWord);

async function showWord(word: string): Promise<void> {
  wordSurface.textContent = word;
  wordPhonetic.textContent = '';
  wordPos.textContent = '';
  wordMeaning.textContent = '查询中…';
  wordSource.textContent = 'ECDICT 词库（首次查询该字母块会稍慢）';
  wordCard.hidden = false;
  try {
    const entry = await dictionary.lookup(word);
    if (entry) {
      wordSurface.textContent = entry.word;
      wordPhonetic.textContent = entry.phonetic ? `/${entry.phonetic}/` : '';
      wordPos.textContent = entry.partOfSpeech;
      const lines = [entry.definitionChinese, entry.definitionEnglish]
        .map((text) => text.trim())
        .filter(Boolean);
      wordMeaning.textContent = lines.join('\n');
      wordSource.textContent = 'ECDICT 词库（MIT）';
    } else {
      wordMeaning.textContent = '词典未收录该词';
      wordSource.textContent = 'ECDICT 词库（MIT）';
    }
  } catch {
    wordMeaning.textContent = '词典加载失败，请检查网络后重试';
    wordSource.textContent = '';
  }
}

function refreshChrome(): void {
  pageLabel.textContent = `${viewer.pageNum} / ${viewer.pageCount}`;
  zoomLabel.textContent = `${Math.round(viewer.scale * 100)}%`;
  prevBtn.disabled = !viewer.hasDocument || viewer.pageNum <= 1;
  nextBtn.disabled = !viewer.hasDocument || viewer.pageNum >= viewer.pageCount;
  emptyState.hidden = viewer.hasDocument;
}

openBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    await viewer.open(file);
  } catch (error) {
    console.error(error);
    wordMeaning.textContent = 'PDF 打开失败';
    wordCard.hidden = false;
  }
  refreshChrome();
});

prevBtn.addEventListener('click', async () => {
  await viewer.prev();
  refreshChrome();
});
nextBtn.addEventListener('click', async () => {
  await viewer.next();
  refreshChrome();
});
zoomInBtn.addEventListener('click', async () => {
  await viewer.setScale(viewer.scale + 0.2);
  refreshChrome();
});
zoomOutBtn.addEventListener('click', async () => {
  await viewer.setScale(viewer.scale - 0.2);
  refreshChrome();
});
wordClose.addEventListener('click', () => {
  wordCard.hidden = true;
});

refreshChrome();

// Auto-open the bundled demo PDF so the page demos tap-to-look-up directly.
void (async () => {
  try {
    const response = await fetch('demo.pdf');
    if (!response.ok) return;
    const file = new File([await response.blob()], 'demo.pdf', {
      type: 'application/pdf',
    });
    await viewer.open(file);
    refreshChrome();
  } catch {
    // Demo asset missing; the open button still works.
  }
})();
