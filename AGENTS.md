# SUPUZZ 国际站维护约定

本项目是 `supuzz.com` 国际站，使用 Parcel 发布静态页面。

## 新页面的多语言实现

- 新页面、新文章采用“一份 Builder 代码 + 共享资料 + 各语言文案”，构建生成对应语言 HTML。
- 页面类放在 `builders/<Page>Builder.js`，提供 `render(context)` 维护一份布局，`build()` 调用 `scripts/build-pages.js` 并指定当前页面 ID；定义和译文放在 `resource/pages/<id>/`。格式见 README 的“新页面的多语言构建”。
- Contact 示例为 `builders/ContactBuilder.js`，运行 `npm run contact:build` 可生成七种语言的 `contact.html`；`npm run pages:build` 会统一调用已配置的 Builder。公共文档外壳放在 `templates/pages/document.cjs`。
- 布局、交互、图片地址、产品标识等共用；需要本地化的文本使用命名字段，不能为每种语言复制整份模板或通过替换英文整句维护布局。
- 默认支持 en、es、ja、zh-Hant、de、pt、fr；以需求指定的语言为准，在页面定义中明确列出。构建仅生成有完整译文的指定语言，不静默回退为英文。
- 生成的语言 HTML 带来源注释，只修改其模板、共享资料和译文，再重新生成。不得直接修改生成结果。
- 英文内容变更时检查对应译文；翻译可由 AI 辅助，确认后保存在项目中，构建不调用在线翻译服务。
- 旧页面按需求逐步迁移；新增工作不得继续扩展逐语言复制页面的维护方式。

## 共享结构与验证

- 沿用现有全站样式、组件和页面模式。普通页面通过共享文档模板引入 `components/header.html` 和 `components/footer.html`，不复制或自行修改公共头尾。
- 文章标题区使用 `<div class="article-header">`，不得使用嵌套的 `<header>`。
- 保留各语言独立网址、正确的 canonical、hreflang、页面语言和结构化数据。最终 sitemap 由现有 `seo:prepare` 生成。
- 新文章仍须加入对应语言博客列表，沿用 `scripts/blog-card.js`；不要另做一套卡片样式。
- 修改生成逻辑后运行 `npm run pages:test`；新增页面运行 `npm run pages:build`，针对页面执行 Parcel 构建，确认公共组件展开且没有残留 include，再运行 `git diff --check`。
