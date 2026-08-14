# 典读鸡 · Web 版 (dianduji-web)

典读鸡的独立 Web 项目：浏览器内点读翻译（PDF.js + IndexedDB + 自控网关）。
与移动端仓库（`claml/dianduji`）**代码互相独立**，共享设计文档与网关契约。

## 状态

**里程碑 2（当前）**：完整 ECDICT 词库（6 万词条）接入。
- 打开页面自动加载 `public/demo.pdf`（2 页英文论文示例）演示点读；
- 工具栏：打开 PDF、缩放、翻页；右侧词卡显示音标、词性、中英释义；
- **词典**：ECDICT（MIT）按首字母分块 gzip（共 ~3.5MB），首次点词按需
  加载对应字母块后内存缓存；词形变化经 lemmas 表还原（models → model）；
- **隐私**：全部在浏览器本地解析，文档与词库均不上传。

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
- [ ] M3 在线翻译（复用自控网关契约，客户端零密钥）+ 生词/短语收藏（IndexedDB）
- [ ] M4 GitHub Pages 部署 + CI 全绿 + 移动浏览器响应式
- [ ] （同步）移动端 v1.1 登录/云同步契约稳定后复用

详细规划见移动端仓库 `.planning/2026-08-17-web-edition-plan.md`（本地私有）。

## 部署（GitHub Pages）

CI 已含 `deploy` job（main 分支构建后发布）。首次需在仓库
**Settings → Pages → Source** 选择 **GitHub Actions** 启用一次，
之后每次 push 自动部署。

## 许可

MIT（见 `LICENSE`）。ECDICT 词库（M2 引入）为 MIT 许可。
