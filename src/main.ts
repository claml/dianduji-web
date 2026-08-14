import './style.css';
import { PdfViewer } from './pdf-viewer';
import { fetchChunkLoader, WebDictionary } from './dictionary';
import {
  GatewayTranslator,
  loadGatewayUrl,
  saveGatewayUrl,
} from './online-translate';
import { VocabularyBook } from './vocabulary';

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
const wordSave = document.querySelector<HTMLButtonElement>('#word-save')!;
const wordClose = document.querySelector<HTMLButtonElement>('#word-close')!;
const prevBtn = document.querySelector<HTMLButtonElement>('#prev-page')!;
const nextBtn = document.querySelector<HTMLButtonElement>('#next-page')!;
const zoomInBtn = document.querySelector<HTMLButtonElement>('#zoom-in')!;
const zoomOutBtn = document.querySelector<HTMLButtonElement>('#zoom-out')!;
const pageLabel = document.querySelector<HTMLElement>('#page-label')!;
const zoomLabel = document.querySelector<HTMLElement>('#zoom-label')!;
const bookBtn = document.querySelector<HTMLButtonElement>('#book-btn')!;
const bookPanel = document.querySelector<HTMLElement>('#book-panel')!;
const bookClose = document.querySelector<HTMLButtonElement>('#book-close')!;
const bookList = document.querySelector<HTMLElement>('#book-list')!;
const bookEmpty = document.querySelector<HTMLElement>('#book-empty')!;
const settingsBtn = document.querySelector<HTMLButtonElement>('#settings-btn')!;
const settingsOverlay = document.querySelector<HTMLElement>('#settings-overlay')!;
const settingsSave = document.querySelector<HTMLButtonElement>('#settings-save')!;
const settingsCancel = document.querySelector<HTMLButtonElement>('#settings-cancel')!;
const gatewayUrlInput = document.querySelector<HTMLInputElement>('#gateway-url')!;
const onlineEnabledInput = document.querySelector<HTMLInputElement>('#online-enabled')!;

const ONLINE_KEY = 'dianduji.onlineEnabled';

function onlineEnabled(): boolean {
  try {
    return localStorage.getItem(ONLINE_KEY) !== 'false';
  } catch {
    return true;
  }
}

const dictionary = new WebDictionary(fetchChunkLoader());
const translator = new GatewayTranslator();
const book = new VocabularyBook();
const viewer = new PdfViewer(canvas, textLayer, showWord);

let currentWord = '';
let currentEntry: { phonetic: string; definitionChinese: string } | null = null;

async function showWord(word: string): Promise<void> {
  currentWord = word;
  currentEntry = null;
  wordSurface.textContent = word;
  wordPhonetic.textContent = '';
  wordPos.textContent = '';
  wordMeaning.textContent = '查询中…';
  wordSource.textContent = 'ECDICT 词库';
  wordSave.textContent = (await book.contains(word)) ? '★' : '☆';
  wordCard.hidden = false;
  try {
    const entry = await dictionary.lookup(word);
    if (!entry) {
      await showOnlineFallback(word);
      return;
    }
    currentEntry = entry;
    wordSurface.textContent = entry.word;
    wordPhonetic.textContent = entry.phonetic ? `/${entry.phonetic}/` : '';
    wordPos.textContent = entry.partOfSpeech;
    const lines = [entry.definitionChinese, entry.definitionEnglish]
      .map((text) => text.trim())
      .filter(Boolean);
    wordMeaning.textContent = lines.join('\n') || '（无释义）';
    wordSource.textContent = 'ECDICT 词库（MIT）';
  } catch {
    wordMeaning.textContent = '词典加载失败，请检查网络后重试';
    wordSource.textContent = '';
  }
}

async function showOnlineFallback(word: string): Promise<void> {
  wordMeaning.textContent = '词库未收录，正在尝试在线翻译…';
  wordSource.textContent = '';
  if (!onlineEnabled()) {
    wordMeaning.textContent = '词库未收录';
    wordSource.textContent = '在线翻译已关闭（可在设置中打开）';
    return;
  }
  const outcome = await translator.translate(word);
  if (outcome.ok) {
    wordMeaning.textContent = outcome.result.termTranslation;
    wordSource.textContent = `在线翻译（${outcome.result.sourceId}）`;
  } else if (outcome.reason === 'offline') {
    wordMeaning.textContent = '词库未收录';
    wordSource.textContent =
      '在线翻译不可用（网关未运行？可在设置中修改地址）';
  } else {
    wordMeaning.textContent = '词库未收录';
    wordSource.textContent = '在线翻译失败，请稍后重试';
  }
}

async function renderBook(): Promise<void> {
  const words = await book.list();
  bookEmpty.hidden = words.length > 0;
  bookList.replaceChildren();
  for (const item of words) {
    const row = document.createElement('div');
    row.className = 'book-item';
    const surface = document.createElement('span');
    surface.className = 'bw';
    surface.textContent = item.word;
    const phonetic = document.createElement('span');
    phonetic.className = 'bw-phon';
    phonetic.textContent = item.phonetic ? `/${item.phonetic}/` : '';
    const zh = document.createElement('span');
    zh.className = 'bw-zh';
    zh.textContent = item.definitionChinese.split('\n')[0] || '';
    const del = document.createElement('button');
    del.className = 'bw-del';
    del.textContent = '×';
    del.title = '删除';
    del.addEventListener('click', async (event) => {
      event.stopPropagation();
      await book.remove(item.word);
      await renderBook();
    });
    row.append(surface, phonetic, zh, del);
    row.addEventListener('click', () => void showWord(item.word));
    bookList.appendChild(row);
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
wordSave.addEventListener('click', async () => {
  if (!currentWord) return;
  const saved = await book.contains(currentWord);
  if (saved) {
    await book.remove(currentWord);
    wordSave.textContent = '☆';
  } else {
    await book.add({
      word: currentWord,
      phonetic: currentEntry?.phonetic ?? '',
      definitionChinese: currentEntry?.definitionChinese ?? '',
      addedAt: Date.now(),
    });
    wordSave.textContent = '★';
  }
});

bookBtn.addEventListener('click', () => {
  bookPanel.hidden = !bookPanel.hidden;
  if (!bookPanel.hidden) void renderBook();
});
bookClose.addEventListener('click', () => {
  bookPanel.hidden = true;
});
book.subscribe(() => void renderBook());

settingsBtn.addEventListener('click', () => {
  gatewayUrlInput.value = loadGatewayUrl();
  onlineEnabledInput.checked = onlineEnabled();
  settingsOverlay.hidden = false;
});
settingsSave.addEventListener('click', () => {
  saveGatewayUrl(gatewayUrlInput.value);
  try {
    localStorage.setItem(ONLINE_KEY, String(onlineEnabledInput.checked));
  } catch {
    // storage unavailable; keep defaults
  }
  settingsOverlay.hidden = true;
});
settingsCancel.addEventListener('click', () => {
  settingsOverlay.hidden = true;
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
