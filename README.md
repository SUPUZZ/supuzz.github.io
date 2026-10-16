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
