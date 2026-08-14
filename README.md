# 典读鸡 · Web 版 (dianduji-web)

典读鸡的独立 Web 项目：浏览器内点读翻译（PDF.js + IndexedDB + 自控网关）。
与移动端仓库（`claml/dianduji`）**代码互相独立**，共享设计文档与网关契约。

## 状态

**里程碑 1（当前）**：脚手架 + PDF.js 渲染 + 分页 + 文本层点词 + 词卡。
- 打开页面自动加载 `public/demo.pdf`（2 页英文论文示例）演示点读；
- 工具栏：打开 PDF、缩放、翻页；右侧词卡显示音标与释义；
- 词典：内置迷你词表（演示用，离线可用）；**M2 将接入 ECDICT 词库
  （IndexedDB）**；
- 隐私：全部在浏览器本地解析，文档不上传。

## 开发

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest 单元测试
npm run typecheck
npm run build      # 产物 dist/
node scripts/make-demo-pdf.mjs   # 重新生成演示 PDF
```

## 路线

- [x] M1 脚手架 + PDF.js 渲染 + 分页 + 文本选择 + 点词词卡（迷你词表）
- [ ] M2 ECDICT 子集查询（IndexedDB 按需加载）+ 词卡完善（例句区）
- [ ] M3 在线翻译（复用自控网关契约，客户端零密钥）+ 生词/短语收藏（IndexedDB）
- [ ] M4 GitHub Pages 部署 + CI 全绿 + 移动浏览器响应式
- [ ] （同步）移动端 v1.1 登录/云同步契约稳定后复用

详细规划见移动端仓库 `.planning/2026-08-17-web-edition-plan.md`（本地私有）。

## 许可

MIT（见 `LICENSE`）。ECDICT 词库（M2 引入）为 MIT 许可。
