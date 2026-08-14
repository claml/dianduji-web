# 典读鸡 · Web 版 (dianduji-web)

典读鸡的独立 Web 项目：浏览器内点读翻译（PDF.js + IndexedDB + 自控网关）。
与移动端仓库（`claml/dianduji`）**代码互相独立**，共享设计文档与网关契约。

## 状态

**里程碑 6（当前）**：短语识别、DOCX 导入、熟练度标记。
- 打开 **PDF / TXT / DOCX**（DOCX 经 jszip 解析段落；TXT 支持 GB18030）；
  PDF 自动加载 `public/demo.pdf` 演示点读；
- 工具栏：打开、缩放、翻页、页码跳转、**目录**、**收藏**、**设置**；
- **词典**：ECDICT 6 万词条 + 专业词典（5 领域 1065 条，多词术语识别）；
- **短语识别**：动词短语/介词短语/搭配/习语（20 条内置词库），点词自动
  匹配最长短语，词卡显示类型标签并可收藏；
- **词卡**：音标/词性/双语释义 + 领域标签 + 自定义释义 + 原文与整句翻译 +
  收藏句子/短语；
- **收藏**：生词（含**已掌握**标记 ✓）与句子/短语两个页签（IndexedDB）；
- **在线翻译**：词库未收录时兜底（设置中可配网关地址/开关，默认
  `http://127.0.0.1:8080/translate`）。
  ⚠️ **HTTPS 限制**：线上 Pages（https://…）只能访问 **HTTPS** 网关地址
  （浏览器混合内容策略）；本地自用请 `npm run dev` 后访问
  `http://127.0.0.1:5173`。将网关发布为 HTTPS（如 Cloudflare Tunnel
  免费方案）后填公网地址即可线上使用；
- **阅读记忆**：每个文件记住进度（PDF 页码 / TXT·DOCX 滚动位置），续读；
- **主题**：跟随系统 / 日间 / 夜间；
- **隐私**：文档与词库均在浏览器本地处理；在线翻译仅发送所点单词与所在句子。

## 开发

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest 单元测试
npm run typecheck
npm run build      # 产物 dist/
node scripts/make-demo-pdf.mjs   # 重新生成演示 PDF
python scripts/build-dictionary.py <path/to/ecdict.sqlite>  # 重新生成词库分块
```

## 路线

- [x] M1 脚手架 + PDF.js 渲染 + 分页 + 文本选择 + 点词词卡
- [x] M2 ECDICT 词库（6 万词条分块懒加载）+ 词形还原 + 词卡完善
- [x] M3 在线翻译（网关兜底）+ 生词收藏（IndexedDB 持久化）
- [x] M4 专业词典（多词识别）+ 阅读进度记忆 + 目录导航 + 页码跳转 + 响应式
- [x] M5 TXT 阅读 + 整句翻译 + 自定义释义 + 句子收藏 + 主题切换
- [x] M6 短语识别收藏 + DOCX 导入 + 生词熟练度标记
- [ ] M7 对齐移动端：生词回顾（收藏复习）、设置项完善（字号/行距）
- [ ] （同步）移动端 v1.1 登录/云同步契约稳定后复用

详细规划见移动端仓库 `.planning/2026-08-17-web-edition-plan.md`（本地私有）。

## 部署（GitHub Pages）

CI 已含 `deploy` job（main 分支构建后发布）。首次需在仓库
**Settings → Pages → Source** 选择 **GitHub Actions** 启用一次，
之后每次 push 自动部署。

## 许可

MIT（见 `LICENSE`）。ECDICT 词库（M2 引入）为 MIT 许可。
