import './style.css';
import { PdfViewer } from './pdf-viewer';
import { TxtReader } from './txt-reader';
import { fetchChunkLoader, WebDictionary } from './dictionary';
import {
  GatewayTranslator,
  loadGatewayUrl,
  saveGatewayUrl,
} from './online-translate';
import { SpecializedDictionary, DOMAIN_LABELS } from './specialized';
import { PhraseDictionary, PHRASE_TYPE_LABELS } from './phrase-dictionary';
import { extractDocxText } from './docx-reader';
import { CustomDefinitionStore } from './custom-definitions';
import { VocabularyBook } from './vocabulary';
import { PhraseStore } from './phrases';
import { documentId, ReadingStore } from './reading-state';
import type { SpecializedTerm } from './specialized';

const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;
const openBtn = document.querySelector<HTMLButtonElement>('#open-btn')!;
const canvas = document.querySelector<HTMLCanvasElement>('#pdf-canvas')!;
const textLayer = document.querySelector<HTMLElement>('#text-layer')!;
const pdfWrap = document.querySelector<HTMLElement>('#pdf-canvas-wrap')!;
const txtView = document.querySelector<HTMLElement>('#txt-view')!;
const emptyState = document.querySelector<HTMLElement>('#empty-state')!;
const wordCard = document.querySelector<HTMLElement>('#word-card')!;
const wordSurface = document.querySelector<HTMLElement>('#word-surface')!;
const wordPhonetic = document.querySelector<HTMLElement>('#word-phonetic')!;
const wordPos = document.querySelector<HTMLElement>('#word-pos')!;
const wordMeaning = document.querySelector<HTMLElement>('#word-meaning')!;
const wordSpecialized = document.querySelector<HTMLElement>('#word-specialized')!;
const wordSpecDomain = document.querySelector<HTMLElement>('#word-spec-domain')!;
const wordSpecDefinition = document.querySelector<HTMLElement>('#word-spec-definition')!;
const wordCustomDef = document.querySelector<HTMLElement>('#word-custom-def')!;
const wordCustomDefText = document.querySelector<HTMLElement>('#word-custom-def-text')!;
const customDefAdd = document.querySelector<HTMLButtonElement>('#custom-def-add')!;
const wordPhrase = document.querySelector<HTMLElement>('#word-phrase')!;
const wordPhraseType = document.querySelector<HTMLElement>('#word-phrase-type')!;
const wordPhraseSurface = document.querySelector<HTMLElement>('#word-phrase-surface')!;
const wordPhraseMeaning = document.querySelector<HTMLElement>('#word-phrase-meaning')!;
const phraseSave = document.querySelector<HTMLButtonElement>('#phrase-save')!;
const wordSentence = document.querySelector<HTMLElement>('#word-sentence')!;
const wordSentenceText = document.querySelector<HTMLElement>('#word-sentence-text')!;
const sentenceTranslate = document.querySelector<HTMLButtonElement>('#sentence-translate')!;
const sentenceSave = document.querySelector<HTMLButtonElement>('#sentence-save')!;
const sentenceTranslation = document.querySelector<HTMLElement>('#sentence-translation')!;
const wordSource = document.querySelector<HTMLElement>('#word-source')!;
const wordSave = document.querySelector<HTMLButtonElement>('#word-save')!;
const wordClose = document.querySelector<HTMLButtonElement>('#word-close')!;
const prevBtn = document.querySelector<HTMLButtonElement>('#prev-page')!;
const nextBtn = document.querySelector<HTMLButtonElement>('#next-page')!;
const pageInput = document.querySelector<HTMLInputElement>('#page-input')!;
const zoomInBtn = document.querySelector<HTMLButtonElement>('#zoom-in')!;
const zoomOutBtn = document.querySelector<HTMLButtonElement>('#zoom-out')!;
const zoomLabel = document.querySelector<HTMLElement>('#zoom-label')!;
const outlineBtn = document.querySelector<HTMLButtonElement>('#outline-btn')!;
const outlinePanel = document.querySelector<HTMLElement>('#outline-panel')!;
const outlineClose = document.querySelector<HTMLButtonElement>('#outline-close')!;
const outlineList = document.querySelector<HTMLElement>('#outline-list')!;
const outlineEmpty = document.querySelector<HTMLElement>('#outline-empty')!;
const bookBtn = document.querySelector<HTMLButtonElement>('#book-btn')!;
const bookPanel = document.querySelector<HTMLElement>('#book-panel')!;
const bookClose = document.querySelector<HTMLButtonElement>('#book-close')!;
const bookList = document.querySelector<HTMLElement>('#book-list')!;
const bookEmpty = document.querySelector<HTMLElement>('#book-empty')!;
const tabWords = document.querySelector<HTMLButtonElement>('#tab-words')!;
const tabPhrases = document.querySelector<HTMLButtonElement>('#tab-phrases')!;
const settingsBtn = document.querySelector<HTMLButtonElement>('#settings-btn')!;
const settingsOverlay = document.querySelector<HTMLElement>('#settings-overlay')!;
const settingsSave = document.querySelector<HTMLButtonElement>('#settings-save')!;
const settingsCancel = document.querySelector<HTMLButtonElement>('#settings-cancel')!;
const gatewayUrlInput = document.querySelector<HTMLInputElement>('#gateway-url')!;
const onlineEnabledInput = document.querySelector<HTMLInputElement>('#online-enabled')!;
const themeSelect = document.querySelector<HTMLSelectElement>('#theme-select')!;
const customDefOverlay = document.querySelector<HTMLElement>('#custom-def-overlay')!;
const customDefWord = document.querySelector<HTMLElement>('#custom-def-word')!;
const customDefInput = document.querySelector<HTMLTextAreaElement>('#custom-def-input')!;
const customDefSave = document.querySelector<HTMLButtonElement>('#custom-def-save')!;
const customDefCancel = document.querySelector<HTMLButtonElement>('#custom-def-cancel')!;

const ONLINE_KEY = 'dianduji.onlineEnabled';
const THEME_KEY = 'dianduji.theme';

function onlineEnabled(): boolean {
  try {
    return localStorage.getItem(ONLINE_KEY) !== 'false';
  } catch {
    return true;
  }
}

function applyTheme(theme: string): void {
  document.documentElement.dataset.theme = theme === 'system' ? '' : theme;
}

const dictionary = new WebDictionary(fetchChunkLoader());
const specialized = new SpecializedDictionary();
const phraseDict = new PhraseDictionary();
const translator = new GatewayTranslator();
const book = new VocabularyBook();
const phrases = new PhraseStore();
const customDefs = new CustomDefinitionStore();
const reading = new ReadingStore();
const viewer = new PdfViewer(canvas, textLayer, showWord);
const txtReader = new TxtReader(txtView, showWord);

let currentWord = '';
let currentEntry: { phonetic: string; definitionChinese: string } | null = null;
let currentSentence = '';
let currentPhrase: { key: string; surface: string; meaning: string } | null = null;
let currentFileId: string | null = null;
let currentFileName = '';
let bookTab: 'words' | 'phrases' = 'words';

async function showWord(word: string, tokenIndex: number, sentence = ''): Promise<void> {
  currentWord = word;
  currentEntry = null;
  currentSentence = sentence;
  currentPhrase = null;
  wordSurface.textContent = word;
  wordPhonetic.textContent = '';
  wordPos.textContent = '';
  wordMeaning.textContent = '查询中…';
  wordSpecialized.hidden = true;
  wordCustomDef.hidden = true;
  customDefAdd.hidden = true;
  wordPhrase.hidden = true;
  wordSentence.hidden = sentence.length === 0;
  wordSentenceText.textContent = sentence;
  sentenceTranslation.hidden = true;
  sentenceSave.textContent = sentence ? '☆ 收藏句子' : '';
  wordSource.textContent = 'ECDICT 词库';
  try {
    wordSave.textContent = (await book.contains(word)) ? '★' : '☆';
  } catch {
    wordSave.textContent = '☆';
  }
  wordCard.hidden = false;
  try {
    // Related phrase around the tap (independent of dictionary hits).
    const phrase = await phraseDict.lookupAround(activeTokens(), tokenIndex);
    if (phrase != null) {
      currentPhrase = phrase;
      wordPhraseType.textContent = PHRASE_TYPE_LABELS[phrase.type] ?? phrase.type;
      wordPhraseSurface.textContent = phrase.surface;
      wordPhraseMeaning.textContent = phrase.meaning;
      phraseSave.textContent = (await phrases.contains(phrase.surface)) ? '★ 已收藏' : '☆ 收藏短语';
      wordPhrase.hidden = false;
    }
    // Chain: general -> specialized -> custom -> online (mobile parity).
    const term = await specialized.lookupAround(activeTokens(), tokenIndex);
    const entry = term == null ? await dictionary.lookup(word) : null;
    if (term != null && entry == null) {
      showSpecialized(term, word);
      return;
    }
    if (entry != null) {
      currentEntry = entry;
      wordSurface.textContent = entry.word;
      wordPhonetic.textContent = entry.phonetic ? `/${entry.phonetic}/` : '';
      wordPos.textContent = entry.partOfSpeech;
      const lines = [entry.definitionChinese, entry.definitionEnglish]
        .map((text) => text.trim())
        .filter(Boolean);
      wordMeaning.textContent = lines.join('\n') || '（无释义）';
      wordSource.textContent = 'ECDICT 词库（MIT）';
      if (term != null) showSpecialized(term, entry.word);
      await showCustomIfAny(word);
      return;
    }
    // No general/specialized hit: custom definition wins over online.
    const custom = await customDefs.load(word);
    if (custom != null) {
      wordMeaning.textContent = custom.definition;
      wordSource.textContent = '自定义释义';
      return;
    }
    customDefAdd.hidden = false;
    await showOnlineFallback(word);
  } catch {
    wordMeaning.textContent = '词典加载失败，请检查网络后重试';
    wordSource.textContent = '';
  }
}

async function showCustomIfAny(word: string): Promise<void> {
  const custom = await customDefs.load(word);
  if (custom == null) return;
  wordCustomDefText.textContent = custom.definition;
  wordCustomDef.hidden = false;
}

function showSpecialized(term: SpecializedTerm, surface: string): void {
  if (term.term.toLowerCase() !== surface.toLowerCase()) {
    wordSurface.textContent = `${surface} · ${term.term}`;
  }
  wordSpecDomain.textContent = DOMAIN_LABELS[term.domain] ?? term.domain;
  wordSpecDefinition.textContent = term.definition;
  wordSpecialized.hidden = false;
  if (wordMeaning.textContent === '查询中…') {
    wordMeaning.textContent = '（专业术语，无通用释义）';
  }
  wordSource.textContent = '专业词典（5 领域 1065 条）';
}

async function showOnlineFallback(word: string): Promise<void> {
  if (!onlineEnabled()) {
    wordMeaning.textContent = '词库未收录';
    wordSource.textContent = '在线翻译已关闭（可在设置中打开）';
    return;
  }
  wordMeaning.textContent = '正在尝试在线翻译…';
  const outcome = await translator.translate(word);
  if (outcome.ok) {
    wordMeaning.textContent = outcome.result.termTranslation;
    wordSource.textContent = `在线翻译（${outcome.result.sourceId}）`;
  } else if (outcome.reason === 'offline') {
    wordMeaning.textContent = '词库未收录';
    wordSource.textContent = '在线翻译不可用（网关未运行？可在设置中修改地址）';
  } else {
    wordMeaning.textContent = '词库未收录';
    wordSource.textContent = '在线翻译失败，请稍后重试';
  }
}

function activeTokens(): string[] {
  return pdfWrap.hidden ? txtReader.tokens : viewer.tokens;
}

async function renderBook(): Promise<void> {
  bookEmpty.hidden = true;
  bookList.replaceChildren();
  if (bookTab === 'words') {
    const words = await book.list();
    bookEmpty.hidden = words.length > 0;
    for (const item of words) {
      const row = document.createElement('div');
      row.className = `book-item${item.mastered ? ' mastered' : ''}`;
      const surface = document.createElement('span');
      surface.className = 'bw';
      surface.textContent = item.word;
      const phonetic = document.createElement('span');
      phonetic.className = 'bw-phon';
      phonetic.textContent = item.phonetic ? `/${item.phonetic}/` : '';
      const zh = document.createElement('span');
      zh.className = 'bw-zh';
      zh.textContent = item.definitionChinese.split('\n')[0] || '';
      const check = document.createElement('button');
      check.className = `bw-check${item.mastered ? ' on' : ''}`;
      check.textContent = item.mastered ? '✓' : '○';
      check.title = item.mastered ? '已掌握（点击取消）' : '标记为已掌握';
      check.addEventListener('click', async (event) => {
        event.stopPropagation();
        await book.setMastered(item.word, !item.mastered);
        await renderBook();
      });
      const del = document.createElement('button');
      del.className = 'bw-del';
      del.textContent = '×';
      del.title = '删除';
      del.addEventListener('click', async (event) => {
        event.stopPropagation();
        await book.remove(item.word);
        await renderBook();
      });
      row.append(surface, phonetic, zh, check, del);
      row.addEventListener('click', () => void showWord(item.word, 0));
      bookList.appendChild(row);
    }
  } else {
    const saved = await phrases.list();
    bookEmpty.hidden = saved.length > 0;
    for (const item of saved) {
      const row = document.createElement('div');
      row.className = 'phrase-item';
      const text = document.createElement('div');
      text.className = 'pi-text';
      text.textContent = item.text;
      const trans = document.createElement('div');
      trans.className = 'pi-trans';
      trans.textContent = item.translation;
      const del = document.createElement('button');
      del.className = 'pi-del';
      del.textContent = '删除';
      del.addEventListener('click', async () => {
        await phrases.remove(item.id);
        await renderBook();
      });
      row.append(text, trans, del);
      bookList.appendChild(row);
    }
  }
}

async function renderOutline(): Promise<void> {
  const outline = await viewer.getOutline();
  outlineEmpty.hidden = outline != null && outline.length > 0;
  outlineList.replaceChildren();
  if (!outline) return;
  for (const item of outline) {
    if (item.dest == null && item.url != null) continue;
    const row = document.createElement('div');
    row.className = 'outline-item';
    row.textContent = item.title;
    const page = document.createElement('span');
    page.className = 'oi-page';
    page.textContent = `→ ${item.pageNumber ?? '?'}`;
    row.appendChild(page);
    const pageNumber = item.pageNumber;
    row.addEventListener('click', () => {
      if (pageNumber != null) void gotoPage(pageNumber);
      outlinePanel.hidden = true;
    });
    outlineList.appendChild(row);
  }
}

async function gotoPage(page: number): Promise<void> {
  await viewer.goto(page);
  refreshChrome();
  if (currentFileId) void reading.save(currentFileId, currentFileName, viewer.pageNum);
}

function refreshChrome(): void {
  pageInput.value = viewer.pageNum > 0 ? `${viewer.pageNum} / ${viewer.pageCount}` : '– / –';
  zoomLabel.textContent = `${Math.round(viewer.scale * 100)}%`;
  prevBtn.disabled = !viewer.hasDocument || viewer.pageNum <= 1;
  nextBtn.disabled = !viewer.hasDocument || viewer.pageNum >= viewer.pageCount;
  emptyState.hidden = viewer.hasDocument || txtReader.tokens.length > 0;
}

function showTxtMode(on: boolean): void {
  pdfWrap.hidden = on;
  txtView.hidden = !on;
  prevBtn.disabled = on;
  nextBtn.disabled = on;
  pageInput.disabled = on;
  outlineBtn.hidden = on;
}

async function openFile(file: File): Promise<void> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt') || name.endsWith('.docx')) {
    showTxtMode(true);
    if (name.endsWith('.docx')) {
      const text = await extractDocxText(await file.arrayBuffer());
      await txtReader.open(new File([text], file.name, { type: 'text/plain' }));
    } else {
      await txtReader.open(file);
    }
    currentFileName = file.name;
    currentFileId = documentId(file.name, file.size);
    const state = await reading.load(currentFileId);
    txtReader.restoreScroll(state?.page ?? 0);
    refreshChrome();
    return;
  }
  showTxtMode(false);
  await viewer.open(file);
  currentFileName = file.name;
  currentFileId = documentId(file.name, file.size);
  const state = await reading.load(currentFileId);
  if (state && state.page > 1) await viewer.goto(state.page);
  refreshChrome();
  outlineBtn.hidden = false;
}

openBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    await openFile(file);
  } catch (error) {
    console.error(error);
    wordMeaning.textContent = '文件打开失败';
    wordCard.hidden = false;
  }
});

prevBtn.addEventListener('click', async () => {
  await viewer.prev();
  refreshChrome();
  if (currentFileId) void reading.save(currentFileId, currentFileName, viewer.pageNum);
});
nextBtn.addEventListener('click', async () => {
  await viewer.next();
  refreshChrome();
  if (currentFileId) void reading.save(currentFileId, currentFileName, viewer.pageNum);
});
pageInput.addEventListener('keydown', async (event) => {
  if (event.key !== 'Enter') return;
  const target = Number(pageInput.value.replace(/[^0-9]/g, ''));
  if (Number.isFinite(target) && target > 0) await gotoPage(target);
});
zoomInBtn.addEventListener('click', async () => {
  await viewer.setScale(viewer.scale + 0.2);
  refreshChrome();
});
zoomOutBtn.addEventListener('click', async () => {
  await viewer.setScale(viewer.scale - 0.2);
  refreshChrome();
});
txtView.addEventListener('scroll', () => {
  if (currentFileId && txtReader.tokens.length > 0) {
    void reading.save(currentFileId, currentFileName, txtReader.scrollRatio());
  }
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
sentenceTranslate.addEventListener('click', async () => {
  if (!currentSentence) return;
  sentenceTranslation.hidden = false;
  sentenceTranslation.textContent = '正在翻译整句…';
  const outcome = await translator.translateSentence(currentSentence);
  if (outcome.ok) {
    sentenceTranslation.textContent = outcome.result.sentenceTranslation;
  } else if (outcome.reason === 'offline') {
    sentenceTranslation.textContent = '在线翻译不可用（网关未运行？可在设置中修改地址）';
  } else {
    sentenceTranslation.textContent = '整句翻译失败，请稍后重试';
  }
});
sentenceSave.addEventListener('click', async () => {
  if (!currentSentence) return;
  const saved = await phrases.contains(currentSentence);
  if (saved) {
    sentenceSave.textContent = '☆ 收藏句子';
  } else {
    await phrases.add(currentSentence, '');
    sentenceSave.textContent = '★ 已收藏';
  }
});
phraseSave.addEventListener('click', async () => {
  if (!currentPhrase) return;
  const saved = await phrases.contains(currentPhrase.surface);
  if (saved) {
    phraseSave.textContent = '☆ 收藏短语';
  } else {
    await phrases.add(currentPhrase.surface, currentPhrase.meaning);
    phraseSave.textContent = '★ 已收藏';
  }
});
customDefAdd.addEventListener('click', () => {
  customDefWord.textContent = currentWord;
  customDefInput.value = '';
  customDefOverlay.hidden = false;
});
customDefSave.addEventListener('click', async () => {
  const definition = customDefInput.value.trim();
  if (!currentWord || !definition) return;
  await customDefs.save(currentWord, definition);
  customDefOverlay.hidden = true;
  await showWord(currentWord, 0, currentSentence);
});
customDefCancel.addEventListener('click', () => {
  customDefOverlay.hidden = true;
});

outlineBtn.addEventListener('click', () => {
  outlinePanel.hidden = !outlinePanel.hidden;
  if (!outlinePanel.hidden) void renderOutline();
});
outlineClose.addEventListener('click', () => {
  outlinePanel.hidden = true;
});

bookBtn.addEventListener('click', () => {
  bookPanel.hidden = !bookPanel.hidden;
  if (!bookPanel.hidden) void renderBook();
});
bookClose.addEventListener('click', () => {
  bookPanel.hidden = true;
});
book.subscribe(() => void renderBook());
tabWords.addEventListener('click', () => {
  bookTab = 'words';
  tabWords.classList.add('active');
  tabPhrases.classList.remove('active');
  void renderBook();
});
tabPhrases.addEventListener('click', () => {
  bookTab = 'phrases';
  tabPhrases.classList.add('active');
  tabWords.classList.remove('active');
  void renderBook();
});

settingsBtn.addEventListener('click', () => {
  gatewayUrlInput.value = loadGatewayUrl();
  onlineEnabledInput.checked = onlineEnabled();
  themeSelect.value = localStorage.getItem(THEME_KEY) ?? 'system';
  settingsOverlay.hidden = false;
});
settingsSave.addEventListener('click', () => {
  saveGatewayUrl(gatewayUrlInput.value);
  try {
    localStorage.setItem(ONLINE_KEY, String(onlineEnabledInput.checked));
    localStorage.setItem(THEME_KEY, themeSelect.value);
  } catch {
    // storage unavailable; keep defaults
  }
  applyTheme(themeSelect.value);
  settingsOverlay.hidden = true;
});
settingsCancel.addEventListener('click', () => {
  settingsOverlay.hidden = true;
});

applyTheme(localStorage.getItem(THEME_KEY) ?? 'system');
refreshChrome();
showTxtMode(false);

// Auto-open the bundled demo PDF so the page demos tap-to-look-up directly.
void (async () => {
  try {
    const response = await fetch('demo.pdf');
    if (!response.ok) return;
    const file = new File([await response.blob()], 'demo.pdf', {
      type: 'application/pdf',
    });
    await openFile(file);
  } catch {
    // Demo asset missing; the open button still works.
  }
})();
