/**
 * Minimal built-in dictionary for milestone 1.
 *
 * M2 replaces this with a real ECDICT-derived subset loaded into IndexedDB;
 * until then a handful of common research words keep the tap-to-look-up
 * loop demonstrable offline.
 */

export interface MiniEntry {
  phonetic: string;
  meaning: string;
}

const WORDS: Record<string, MiniEntry> = {
  the: { phonetic: '/ðə/', meaning: 'art. 这（那）个' },
  and: { phonetic: '/ænd/', meaning: 'conj. 和，与' },
  of: { phonetic: '/əv/', meaning: 'prep. …的' },
  in: { phonetic: '/ɪn/', meaning: 'prep. 在…之内' },
  to: { phonetic: '/tuː/', meaning: 'prep. 到，向' },
  is: { phonetic: '/ɪz/', meaning: 'v. 是（第三人称单数）' },
  for: { phonetic: '/fɔːr/', meaning: 'prep. 为了；对于' },
  with: { phonetic: '/wɪð/', meaning: 'prep. 和…一起；具有' },
  on: { phonetic: '/ɒn/', meaning: 'prep. 在…之上' },
  by: { phonetic: '/baɪ/', meaning: 'prep. 通过；由…' },
  from: { phonetic: '/frɒm/', meaning: 'prep. 从…起' },
  at: { phonetic: '/æt/', meaning: 'prep. 在（某处/时刻）' },
  as: { phonetic: '/æz/', meaning: 'conj./prep. 作为；如同' },
  we: { phonetic: '/wiː/', meaning: 'pron. 我们' },
  our: { phonetic: '/aʊər/', meaning: 'pron. 我们的' },
  can: { phonetic: '/kæn/', meaning: 'v. 能，可以' },
  may: { phonetic: '/meɪ/', meaning: 'v. 可能；可以' },
  use: { phonetic: '/juːz/', meaning: 'v. 使用；n. 用途' },
  using: { phonetic: '/ˈjuːzɪŋ/', meaning: 'v. 使用（use 的现在分词）' },
  based: { phonetic: '/beɪst/', meaning: 'adj. 基于…的' },
  model: { phonetic: '/ˈmɒdl/', meaning: 'n. 模型' },
  models: { phonetic: '/ˈmɒdlz/', meaning: 'n. 模型（复数）' },
  data: { phonetic: '/ˈdeɪtə/', meaning: 'n. 数据' },
  method: { phonetic: '/ˈmeθəd/', meaning: 'n. 方法' },
  methods: { phonetic: '/ˈmeθədz/', meaning: 'n. 方法（复数）' },
  result: { phonetic: '/rɪˈzʌlt/', meaning: 'n. 结果；v. 导致' },
  results: { phonetic: '/rɪˈzʌlts/', meaning: 'n. 结果（复数）' },
  study: { phonetic: '/ˈstʌdi/', meaning: 'n. 研究；v. 学习' },
  studies: { phonetic: '/ˈstʌdiz/', meaning: 'n. 研究（复数）' },
  research: { phonetic: '/rɪˈsɜːtʃ/', meaning: 'n./v. 研究' },
  paper: { phonetic: '/ˈpeɪpər/', meaning: 'n. 论文；纸张' },
  figure: { phonetic: '/ˈfɪɡər/', meaning: 'n. 图；数字' },
  table: { phonetic: '/ˈteɪbl/', meaning: 'n. 表；桌子' },
  analysis: { phonetic: '/əˈnæləsɪs/', meaning: 'n. 分析' },
  system: { phonetic: '/ˈsɪstəm/', meaning: 'n. 系统' },
  process: { phonetic: '/ˈprəʊses/', meaning: 'n. 过程；v. 处理' },
  framework: { phonetic: '/ˈfreɪmwɜːk/', meaning: 'n. 框架' },
  approach: { phonetic: '/əˈprəʊtʃ/', meaning: 'n. 方法，途径' },
  network: { phonetic: '/ˈnetwɜːk/', meaning: 'n. 网络' },
  learning: { phonetic: '/ˈlɜːnɪŋ/', meaning: 'n. 学习' },
  training: { phonetic: '/ˈtreɪnɪŋ/', meaning: 'n. 训练' },
  dataset: { phonetic: '/ˈdeɪtəset/', meaning: 'n. 数据集' },
  benchmark: { phonetic: '/ˈbentʃmɑːk/', meaning: 'n. 基准；测试基准' },
  accuracy: { phonetic: '/ˈækjərəsi/', meaning: 'n. 准确率，精确度' },
  performance: { phonetic: '/pəˈfɔːməns/', meaning: 'n. 性能，表现' },
  evaluation: { phonetic: '/ɪˌvæljuˈeɪʃn/', meaning: 'n. 评估' },
  feature: { phonetic: '/ˈfiːtʃər/', meaning: 'n. 特征；功能' },
  features: { phonetic: '/ˈfiːtʃəz/', meaning: 'n. 特征（复数）' },
  task: { phonetic: '/tɑːsk/', meaning: 'n. 任务' },
  tasks: { phonetic: '/tɑːsks/', meaning: 'n. 任务（复数）' },
  language: { phonetic: '/ˈlæŋɡwɪdʒ/', meaning: 'n. 语言' },
  generation: { phonetic: '/ˌdʒenəˈreɪʃn/', meaning: 'n. 生成；一代' },
  translation: { phonetic: '/trænsˈleɪʃn/', meaning: 'n. 翻译' },
  architecture: { phonetic: '/ˈɑːkɪtektʃər/', meaning: 'n. 架构' },
  algorithm: { phonetic: '/ˈælɡərɪðəm/', meaning: 'n. 算法' },
  parameter: { phonetic: '/pəˈræmɪtər/', meaning: 'n. 参数' },
  parameters: { phonetic: '/pəˈræmɪtəz/', meaning: 'n. 参数（复数）' },
  gradient: { phonetic: '/ˈɡreɪdiənt/', meaning: 'n. 梯度' },
  loss: { phonetic: '/lɒs/', meaning: 'n. 损失；丢失' },
  token: { phonetic: '/ˈtəʊkən/', meaning: 'n. 词元；标记' },
  tokens: { phonetic: '/ˈtəʊkənz/', meaning: 'n. 词元（复数）' },
  sequence: { phonetic: '/ˈsiːkwəns/', meaning: 'n. 序列' },
  context: { phonetic: '/ˈkɒntekst/', meaning: 'n. 上下文，语境' },
  attention: { phonetic: '/əˈtenʃn/', meaning: 'n. 注意力' },
  neuron: { phonetic: '/ˈnjʊərɒn/', meaning: 'n. 神经元' },
  cell: { phonetic: '/sel/', meaning: 'n. 细胞' },
  protein: { phonetic: '/ˈprəʊtiːn/', meaning: 'n. 蛋白质' },
  gene: { phonetic: '/dʒiːn/', meaning: 'n. 基因' },
  expression: { phonetic: '/ɪkˈspreʃn/', meaning: 'n. 表达；表达式' },
  molecular: { phonetic: '/məˈlekjələr/', meaning: 'adj. 分子的' },
  biology: { phonetic: '/baɪˈɒlədʒi/', meaning: 'n. 生物学' },
  chemistry: { phonetic: '/ˈkemɪstri/', meaning: 'n. 化学' },
  clinical: { phonetic: '/ˈklɪnɪkl/', meaning: 'adj. 临床的' },
  disease: { phonetic: '/dɪˈziːz/', meaning: 'n. 疾病' },
  patient: { phonetic: '/ˈpeɪʃnt/', meaning: 'n. 患者' },
  immune: { phonetic: '/ɪˈmjuːn/', meaning: 'adj. 免疫的' },
  response: { phonetic: '/rɪˈspɒns/', meaning: 'n. 反应，响应' },
  signal: { phonetic: '/ˈsɪɡnəl/', meaning: 'n. 信号' },
  pathway: { phonetic: '/ˈpɑːθweɪ/', meaning: 'n. 通路，途径' },
};

export function lookupMini(word: string): MiniEntry | null {
  return WORDS[word.toLowerCase()] ?? null;
}

export const miniEntryCount = Object.keys(WORDS).length;
