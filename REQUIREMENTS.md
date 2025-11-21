# SUPUZZ 网站重构需求文档

## 项目概述
SUPUZZ 是一个静态网站（GitHub Pages），主要销售：
- **产品1**: 人体工学幼儿椅（1-8岁）—— Amazon ASIN: B0CT9R3PRQ
- **产品2**: 珊瑚礁/森林 STEM 建筑玩具（3岁+）—— Amazon ASIN: B0FHK5NP9T

品牌颜色：
- 主色（Primary）：`#E63946`（红色）
- 辅助色（Accent）：`#2A9D8F`（绿色）
- 强调色（Highlight）：`#F4A261`（橙色）

## 当前痛点
1. 页面结构混乱，header/footer 重复定义
2. 样式分散在各页面内联 `<style>`，难以维护
3. 缺少结构化数据（JSON-LD）导致 SEO 不佳
4. 缺少 sitemap.xml 与 robots.txt
5. 外部图片依赖 Amazon CDN，页面加载可能不稳定
6. 无构建流程，页面片段无法被自动化管理

---

## 需求清单

### 1. 页面结构重构 ✓ (已完成基础)
**目标**: 建立统一的 header/footer 片段，所有页面共用

**需求**:
- [ ] 创建 `includes/header.html` —— 包含固定导航栏，菜单项：**Products** (→ index.html)、**Blog** (→ blog.html)、**About** (→ about.html)
- [ ] 创建 `includes/footer.html` —— 包含页脚和社交链接
- [ ] **所有页面** (index.html、blog.html、blog-post.html、about.html) 使用片段引入
- [ ] 考虑两种实现方式：
  - **方案A（当前）**: 客户端 `fetch()` + `DOMContentLoaded` 动态加载片段
  - **方案B（推荐）**: 构建时注入片段，生成完整 HTML（无运行时依赖）

**页面说明**:
- `index.html` —— **首页 / 产品页**：展示两个产品、why choose us、blog preview
- `blog.html` —— **博客列表页**：展示所有文章卡片，每张卡片链接到 `blog-post.html?id=N`
- `blog-post.html` —— **单篇博客**：基于查询参数 `id` 动态加载文章内容
- `about.html` —— **关于页**：公司故事、团队、价值观等

---

### 2. CSS 统一管理 ✓ (部分完成，需继续)
**目标**: 提取所有共享样式到中央 CSS 文件，减少冗余

**需求**:
- [x] 创建 `assets/css/site.css` —— 包含：
  - 主题变量 (`:root`)
  - 全局样式 (*, body, a, img)
  - header/footer 样式
  - 组件样式 (.btn, .product-card, .blog-card, etc.)
  - 响应式 media queries
- [ ] **所有页面** 在 `<head>` 中添加：`<link rel="stylesheet" href="/assets/css/site.css">`
- [ ] **移除** 各页面中的内联 `<style>` 块（特别是 blog-post.html、about.html 中的重复定义）
- [ ] 考虑将页面级特殊样式放在各自页面的 `<style>` 中（保持最小化）

---

### 3. 结构化数据（Schema.org / JSON-LD）✓ (已添加基础，需验证)
**目标**: 为搜索引擎提供结构化数据，改善 SEO

**需求**:
- [x] `index.html` 中添加 **Product JSON-LD**：
  - 产品1：Ergonomic Toddler Chair (B0CT9R3PRQ)
  - 产品2：Coral Reef Building Toy (B0FHK5NP9T)
  - 包含字段：name, image, description, url, brand, price (optional)
- [x] `blog-post.html` 中动态生成 **Article JSON-LD**：
  - 基于 `articles` 对象中的数据
  - 包含字段：headline, image, datePublished, author, publisher, description
  - 通过 JavaScript 在加载文章时注入 `<head>`
- [ ] `blog.html` 中添加 **Collection JSON-LD** (可选)

**验证方法**: 
- 使用 [Google Rich Results Test](https://search.google.com/test/rich-results) 验证 schema 有效性

---

### 4. SEO 基础设施
**目标**: 为 Google 和爬虫提供清晰的网站导航与索引

**需求**:
- [x] 创建 `sitemap.xml` —— 列出所有主要页面 + 博客文章
  - Main pages: /, /index.html, /blog.html, /about.html
  - Blog posts: /blog-post.html?id=1..8
- [x] 创建 `robots.txt` —— 
  - `User-agent: *`
  - `Allow: /`
  - `Sitemap: https://supuzz.github.io/sitemap.xml`
- [ ] 在 `index.html` 的 `<head>` 中添加：
  ```html
  <link rel="canonical" href="https://supuzz.github.io/">
  <meta name="robots" content="index, follow">
  ```
- [ ] **每个页面** 添加唯一的 `<title>` 和 `<meta name="description">`（已有，无需修改）

---

### 5. 本地资源管理
**目标**: 减少对外部 CDN 的依赖，提高加载速度与可靠性

**需求**:
- [x] 创建 `/web-resource/images/` 目录
- [x] 下载三个产品图片到本地：
  - `toddler-chair.jpg` (Amazon toddler chair image)
  - `coral-reef.png` (Coral reef building toy)
  - `forest-set.png` (Forest building set)
- [x] 更新 `index.html` 中的 `<img>` 标签 src 指向本地文件：
  - `src="/web-resource/images/toddler-chair.jpg"`
  - `src="/web-resource/images/coral-reef.png"`
  - `src="/web-resource/images/forest-set.png"`
- [ ] 创建 `web-resource/IMAGE_SOURCES.txt`，记录每张图片的来源和许可
  ```
  toddler-chair.jpg
  - Source: Amazon Product Page (ASIN: B0CT9R3PRQ)
  - Usage: Product showcase on official website
  - License: [Describe if applicable]
  
  coral-reef.png
  - Source: Amazon Product Page (ASIN: B0FHK5NP9T)
  - ...
  ```

---

### 6. 构建流程
**目标**: 能够在开发时使用动态片段加载，在部署时生成完整的独立 HTML（无运行时依赖）

**需求**:
- [x] 创建 `scripts/build.py` —— 简单的 Python 构建脚本：
  - 读取 `includes/header.html` 和 `includes/footer.html`
  - 将片段内容替换到各页面的 `<div id="site-header">` 和 `<div id="site-footer">` 位置
  - 生成输出到 `build/` 目录
  - 复制 `assets/`, `web-resource/`, `sitemap.xml`, `robots.txt` 到 `build/`
- [ ] 创建 `README.md` —— 包含：
  - 项目说明
  - 开发流程（本地预览时使用原始文件 + 动态片段加载）
  - 构建说明：`python3 scripts/build.py`
  - 部署说明：将 `build/` 内容推送到 GitHub Pages 或 `gh-pages` 分支
- [ ] （可选）添加 npm 脚本（如果考虑后续加入 CSS 压缩、图片优化等）

---

### 7. GitHub Pages 部署
**目标**: 将构建的静态文件部署到 GitHub Pages

**需求**:
- [ ] **方案选择**（二选一）：
  - **方案A**: 提交源文件 (`index.html`, `assets/`, `web-resource/` etc.) 到 `main` 分支
    - GitHub Pages 从 `main` 根目录读取
    - 优点：简单，版本管理清晰
    - 缺点：页面依赖客户端片段加载
  - **方案B**: 提交源文件到 `main`，构建产物 (`build/`) 到 `gh-pages` 分支
    - 需要在 CI/CD 中运行 `python3 scripts/build.py`，然后推送 `build/*` 到 `gh-pages`
    - GitHub Pages 配置为从 `gh-pages` 根目录读取
    - 优点：最终用户得到完整、独立的 HTML（无运行时依赖）
    - 缺点：需要 CI/CD 或手动构建+推送

---

## 附录：当前文件结构（预期）

```
supuzz.github.io/
├── index.html              # 产品首页
├── blog.html               # 博客列表页
├── blog-post.html          # 单篇博客（动态内容）
├── about.html              # 关于页面
├── sitemap.xml             # ✓ 已创建
├── robots.txt              # ✓ 已创建
├── includes/
│   ├── header.html         # ✓ 已创建
│   └── footer.html         # ✓ 已创建
├── assets/
│   └── css/
│       └── site.css        # ✓ 已创建（部分）
├── web-resource/
│   └── images/
│       ├── toddler-chair.jpg      # ✓ 已下载
│       ├── coral-reef.png         # ✓ 已下载
│       ├── forest-set.png         # ✓ 已下载
│       └── IMAGE_SOURCES.txt      # [ ] 待创建
├── scripts/
│   └── build.py            # ✓ 已创建
├── build/                  # [ ] 构建输出（自动生成）
│   ├── index.html
│   ├── blog.html
│   ├── blog-post.html
│   ├── about.html
│   ├── assets/
│   ├── web-resource/
│   └── ...
├── README.md               # [ ] 待完善
└── REQUIREMENTS.md         # 本文档
```

---

## 实施步骤（建议顺序）

1. **验证当前状态** —— 检查所有片段、样式、JSON-LD 是否正确创建
2. **完整 CSS 合并** —— 将所有页面级样式移至 `assets/css/site.css`
3. **图片源记录** —— 创建 `web-resource/IMAGE_SOURCES.txt`
4. **构建脚本验证** —— 运行 `python3 scripts/build.py`，检查 `build/` 输出是否正确
5. **本地测试** —— 在 `build/` 上启动本地服务器，检查所有页面（header/footer 已内联、样式正确、链接可用）
6. **部署配置** —— 确定使用 GitHub Pages 的哪种方案
7. **最终推送** —— 提交所有更改到仓库

---

## 成功标准

- [ ] 所有页面共用统一的 header/footer（片段加载或内联）
- [ ] CSS 集中管理，无大量重复
- [ ] JSON-LD schema 有效（通过 Google Rich Results Test）
- [ ] sitemap.xml 和 robots.txt 存在且正确
- [ ] 产品图片从本地加载，加载速度快
- [ ] 构建脚本可生成独立的、无运行时依赖的 HTML
- [ ] GitHub Pages 部署后，网站在浏览器中正常显示
- [ ] 导航链接（Products、Blog、About）均可正常跳转

