# 典读鸡 · Web 版 (dianduji-web)

典读鸡的独立 Web 项目：浏览器内点读翻译（PDF.js + IndexedDB + 自控网关）。
与移动端仓库（`claml/dianduji`）**代码互相独立**，共享设计文档与网关契约。

## 状态

**里程碑 4（当前）**：专业词典、阅读进度记忆、目录导航。
- 打开页面自动加载 `public/demo.pdf`（2 页英文论文示例）演示点读；
- 工具栏：打开 PDF、缩放、翻页、**页码跳转**、**目录**、**生词本**、**设置**；
- **词典**：ECDICT 6 万词条（MIT）分块懒加载 + **专业词典**（5 领域
  1065 条，MIT）：多词术语自动识别（点 `attention` 出
  `attention mechanism · 注意力机制`），词卡带领域标签；
- **在线翻译**：词库与专业词典均未收录时自动调用自控网关 `/translate`
  （客户端零密钥），地址与开关在「设置」（默认
  `http://127.0.0.1:8080/translate`），失败降级提示。
  ⚠️ **HTTPS 限制**：线上 Pages（https://…）只能访问 **HTTPS** 网关地址
  （浏览器混合内容策略）；本地自用请 `npm run dev` 后访问
  `http://127.0.0.1:5173`，即可连接本地 HTTP 网关。将网关发布为
  HTTPS（如 Cloudflare Tunnel 免费方案）后在设置中填公网地址即可线上使用；
- **生词本**：词卡 ★ 收藏，IndexedDB 持久化（刷新不丢），列表可删、可点查；
- **阅读记忆**：每个 PDF 记住最后阅读页码，重新打开自动续读；
- **隐私**：文档与词库均在浏览器本地处理；在线翻译仅发送所点单词。

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
- [ ] M5 对齐移动端：TXT 导入阅读、整句翻译、自定义释义、短语收藏
- [ ] （同步）移动端 v1.1 登录/云同步契约稳定后复用

详细规划见移动端仓库 `.planning/2026-08-17-web-edition-plan.md`（本地私有）。

## 部署（GitHub Pages）

CI 已含 `deploy` job（main 分支构建后发布）。首次需在仓库
**Settings → Pages → Source** 选择 **GitHub Actions** 启用一次，
之后每次 push 自动部署。

## 许可

MIT（见 `LICENSE`）。ECDICT 词库（M2 引入）为 MIT 许可。
