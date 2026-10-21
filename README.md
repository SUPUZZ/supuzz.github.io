# supuzz-web

SUPUZZ 品牌官网静态站点：积木与 STEM 玩具推广页、博客文章、关于我们等，采用多入口 HTML（Parcel 打包）、公用头部/底部组件与静态资源。

## 技术栈

- [Parcel](https://parceljs.org/) 2.x 开发与生产构建
- HTML + CSS，配合 `posthtml-include` 引入 `components/` 下的片段
- `static/` 目录通过 `parcel-reporter-static-files-copy` 复制到产物目录

## 环境要求

- 建议使用当前 **Node.js LTS**（与 Parcel 2 兼容）

## 安装依赖

在项目根目录执行：

```bash
npm install
```

## 本地开发（启动）

启动 Parcel 开发服务器（会监听根目录下各 `*.html` 入口）：

```bash
npm start
```

终端会输出本地访问地址（一般为 `http://localhost:1234`）。修改源码后会热更新。

## 生产打包

构建静态文件到 `dist/`（资源使用相对路径 `./`，便于任意目录部署）：

```bash
npm run build
```

完成后可将 **`dist/`** 整目录上传到静态托管（如 Nginx、OSS、CDN 等）。构建产物包含 HTML、打包后的 JS/CSS 以及从 `static/` 复制的静态文件。

## 项目结构（简要）

| 路径 | 说明 |
|------|------|
| `*.html` | 页面入口（首页 `index.html`、文章页、博客等） |
| `components/` | 可复用 HTML 片段（header、footer） |
| `static/` | 无需打包处理的静态资源，构建时复制到 `dist/` |
| `style.css`、图片等 | 与入口 HTML 引用关系由 Parcel 解析 |

## 新页面的多语言构建

新页面采用“一份 Builder 代码 + 共享资料 + 各语言文案”，由 `npm run pages:build` 生成语言目录中的 HTML。此步骤已接入 `npm start` 和 `npm run build`；生产构建之后仍由 `seo:prepare` 汇总 sitemap。旧页面按需求逐步迁移。

每个新页面在 `resource/pages/<id>/` 下保存：

- `page.json`：网址文件名、Builder 文件名、发布语言、共享图片/日期/产品资料。
- `en.json`、`de.json` 等：指定语言的文案，字段名称保持一致。

例如 `resource/pages/ocean-play/page.json`（示例不是待发布页面）：

```json
{
  "file": "article-ocean-play.html",
  "builder": "OceanPlayBuilder.js",
  "type": "article",
  "locales": ["en", "es", "ja", "zh-Hant", "de", "pt", "fr"],
  "shared": {
    "image": "/product-images/supuzz-coral-reef-l3-main.webp",
    "imageWidth": 1200,
    "imageHeight": 1016,
    "datePublished": "2026-10-20T09:00:00+08:00"
  }
}
```

`type` 可以是 `page` 或 `article`；普通页面不要求文章日期、封面和博客面包屑。`styles` 和 `scripts` 可选，分别指定共用样式地址和模块脚本地址；沿用当前静态资源发布规则，例如 `static/js/contact.js` 对应公开地址 `/js/contact.js`，不要在页面里写 `/static/` 源目录路径。图片、日期、产品标识等事实资料放在 `shared`，不要复制到每份译文。

每份译文必须包含 `title`、`description`；设置封面时还须有 `imageAlt`，文章还须有 `homeLabel`、`blogLabel`。其他文案由共享模板决定，例如：

```json
{
  "title": "Ocean play ideas",
  "description": "Ideas for building an ocean world together.",
  "imageAlt": "SUPUZZ coral reef building set",
  "homeLabel": "Home",
  "blogLabel": "Blog",
  "intro": "Choose one small scene to build together."
}
```

对应 `builders/OceanPlayBuilder.js` 只写一次页面内容，使用项目已有布局和样式：

```js
const path = require('node:path');

class OceanPlayBuilder {
  constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
    this.rootDir = rootDir;
  }

  build() {
    return require('../scripts/build-pages').run(this.rootDir, ['ocean-play']);
  }

  render({ text }) {
    return `
<main class="container">
  <article class="article-container">
    <div class="article-header"><h1>${text('title')}</h1></div>
    <div class="content"><p>${text('intro')}</p></div>
  </article>
</main>`;
  }
}

module.exports = OceanPlayBuilder;
if (require.main === module) new OceanPlayBuilder().build();
```

`render(context)` 接收 `definition`、`locale`、`shared`、`content`、`text`、`escape`、`url`、`alternates`、`jsonLd`。使用 `text('字段名')` 或 `text('嵌套.字段名')` 读取并转义必需文案，缺失会报错；模板内数组等复杂内容须自行验证完整性，并用 `escape` 输出文本。不要依靠英文原文替换，也不要静默回退英文。

实际示例已迁移 `contact.html`：`builders/ContactBuilder.js` 中的 `render()` 是七种语言共用的布局，`build()` 负责生成 Contact 页面。`resource/pages/contact/page.json` 保存共用邮箱和配置，同目录七份语言 JSON 保存标题、正文、表单标签和提交提示，`static/js/contact.js` 共用表单提交逻辑。生成结果仍是原有的 `en/contact.html` 等七个地址。

修改 Contact 源文件后运行 `npm run contact:build`（或 `node builders/ContactBuilder.js`），即可仅生成七种语言的 Contact 页面；也可通过 `new ContactBuilder().build()` 调用。`npm run pages:build` 则生成所有已配置页面。

“关于我们”采用同样方式：`builders/AboutBuilder.js` 维护共用布局，`resource/pages/about/page.json` 保存品牌标语、图片和联系入口等共享资料，同目录七份语言 JSON 保存品牌介绍、理念、产品类别和联系文案。品牌理念以用户提供的“PLAY WITH ALL KIDS.”及其正文为准，英文标语统一保留，各语言分别维护译文。运行 `npm run about:build`（或 `node builders/AboutBuilder.js`）生成七种语言的 `about.html`；`npm start` 和生产构建也会自动生成。`static/css/about.css` 共用页面样式，`static/js/about.js` 共用浏览统计逻辑。

普通页面可设置 `schemaType: "ContactPage"` 或 `"AboutPage"`（默认 `WebPage`），译文可通过 `documentTitle` 保留完整的搜索标题。Builder 可提供 `structuredData(context)` 方法，返回附加结构化数据对象数组；例如联系页面的 Organization 和联系邮箱。页面运行时需要的提示也须从译文生成，嵌入 JSON 时将 `<` 转为 `\\u003c`，由共用 JS 读取，避免七份重复交互代码。

`templates/pages/document.cjs` 自动提供公共头尾组件、页面语言、canonical、双向 hreflang、社交分享标记和页面/文章结构化数据。内容模板不要重复输出文档头、公共头尾或 include；可通过 JS 模块复用内部渲染函数。复用已有页面模式和样式，文章标题区必须是 `div.article-header`。

生成的 HTML 带来源注释，只修改源文件；Builder 和译文修改后重新运行构建命令，本地预览不会自动监听这些源文件并重新生成。生成器也兼容已有 `template` 配置指向 `templates/pages/*.cjs` 的函数模板；新页面优先使用 Builder 类。新增文章须沿用 `scripts/blog-card.js` 加入对应语言博客列表。删去一个页面或语言时，需要明确移除对应的旧生成 HTML，生成器不会自动删除文件。

只生成 `locales` 指定的语言；新多语言页面通常列出全部七种语言，单语言需求只列对应语言。指定译文缺失时会在写入前失败，不发布伪装成其他语言的英文页。英文文案更新时同步检查译文；AI 翻译应先确认并保存，构建不调用在线翻译。

验证：运行 `npm run pages:test`、`npm run pages:build`，针对实际新增页面执行 Parcel 构建，检查公共组件展开，再运行 `git diff --check`。生成器会拒绝覆盖不带当前来源注释的旧页面；迁移旧页面应先核对并保存旧内容，再明确替换为生成输出。

## 产品报价与 Google 富媒体结果

7 种语言、12 个型号的全部产品详情页共用 `resource/product-offers.json`，同步生成可见价格、库存说明和 JSON-LD `Product.offers`。报价来自对应 ASIN 的 Amazon.com 商品页；更新时须核对当前实际售价（不使用划线价、单位价、其他型号价格或信用卡优惠价）、币种和库存，并更新 `checkedAt`。页面不声明未经核实的评分、评论或价格有效期。

购买链接均指向 Amazon.com，因此所有语言均明确显示美国站的 USD 报价，不换算为未经核实的本地货币，也不承诺目的地配送。报价说明翻译保存在 `resource/product-offer-locales.json`。每个可索引型号都必须有已核实的报价，缺少报价时生成器会报错。普通介绍文章保留文章标记，不额外声明缺少报价或评论的 `Product`。

更新报价后运行 `npm run products:build` 和 `npm run products:check`，再构建发布。检查会扫描全站 HTML 中的产品标记，防止缺少 `offers`、`review` 和 `aggregateRating` 的问题再次出现。发布后可在 Google 富媒体搜索结果测试中检查 URL，再在 Search Console 中点击“验证修复”；报告需等待 Google 重新抓取后更新。

## 旧网址兼容

历史根目录网址（例如 `/index-es.html`、`/article-kids-chair-en.html`）的跳转页保存在 `static/`，由 `parcel-reporter-static-files-copy` 原样复制到发布目录根部。它们固定跳转到对应语言和文章的新地址，不根据语言 cookie 切换目标。

GitHub Pages 部署使用零秒 `meta refresh` 和指向新地址的 canonical；[Google 将零秒跳转识别为永久迁移](https://developers.google.com/search/docs/crawling-indexing/301-redirects#metarefresh)。保留可点击的新地址作为浏览器备用入口，不添加 `noindex`。Sitemap 只收录语言目录中的正式页面，不收录旧跳转网址。

新增兼容网址时，先确认目标页面在线返回 200、canonical 正确且在 sitemap 中，再在 `static/` 添加对应 HTML 文件。发布后重新访问旧网址检查跳转，并在 Google Search Console 的 404 问题中点击“验证修复”；旧网址此后被列为“网页会自动重定向”属于正常结果。

## 许可证

见仓库内 `package.json` 的 `license` 字段（当前为 `ISC`）。
