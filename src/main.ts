import './style.css';
import { PdfViewer } from './pdf-viewer';
import { lookupMini, miniEntryCount } from './mini-dictionary';

const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;
const openBtn = document.querySelector<HTMLButtonElement>('#open-btn')!;
const canvas = document.querySelector<HTMLCanvasElement>('#pdf-canvas')!;
const textLayer = document.querySelector<HTMLElement>('#text-layer')!;
const emptyState = document.querySelector<HTMLElement>('#empty-state')!;
const wordCard = document.querySelector<HTMLElement>('#word-card')!;
const wordSurface = document.querySelector<HTMLElement>('#word-surface')!;
const wordPhonetic = document.querySelector<HTMLElement>('#word-phonetic')!;
const wordMeaning = document.querySelector<HTMLElement>('#word-meaning')!;
const wordSource = document.querySelector<HTMLElement>('#word-source')!;
const wordClose = document.querySelector<HTMLButtonElement>('#word-close')!;
const prevBtn = document.querySelector<HTMLButtonElement>('#prev-page')!;
const nextBtn = document.querySelector<HTMLButtonElement>('#next-page')!;
const zoomInBtn = document.querySelector<HTMLButtonElement>('#zoom-in')!;
const zoomOutBtn = document.querySelector<HTMLButtonElement>('#zoom-out')!;
const pageLabel = document.querySelector<HTMLElement>('#page-label')!;
const zoomLabel = document.querySelector<HTMLElement>('#zoom-label')!;

const viewer = new PdfViewer(canvas, textLayer, showWord);

function showWord(word: string): void {
  const entry = lookupMini(word);
  wordSurface.textContent = word;
  wordPhonetic.textContent = entry?.phonetic ?? '';
  wordMeaning.textContent = entry?.meaning ?? '本地词典未收录';
  wordSource.textContent = entry
    ? `内置演示词表（共 ${miniEntryCount} 词；M2 将接入 ECDICT 词库）`
    : '词表未收录（M2 将接入 ECDICT 词库）';
  wordCard.hidden = false;
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
