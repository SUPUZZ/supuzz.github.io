# 🚀 SUPUZZ 网站快速参考

## 📌 项目概览
- **状态**: ✅ PRODUCTION READY
- **页面数**: 4 + 8 篇博客
- **总代码行数**: ~2,500 行 HTML/CSS/JS
- **部署方式**: GitHub Pages（main 分支）
- **SEO**: JSON-LD schemas + sitemap.xml + robots.txt

---

## 🎯 核心页面

### 首页 (index.html)
```
主要区域：
1. Hero 部分 - 品牌介绍和 CTA
2. 产品展示 - 3 个产品卡片
3. Why Choose Us - 6 个品牌优势
4. Amazon 信任徽章 - 统计数据
5. 博客预览 - 4 个精选文章
6. 用户评价 - 3 条真实反馈
7. CTA Banner - 底部行动号召
```

### 博客列表 (blog.html)
```
- 8 篇文章卡片网格
- 每张卡片链接到 blog-post.html?id=N
- 分类标签和阅读时间
- CTA 号召访问首页
```

### 博客文章 (blog-post.html)
```
- 动态加载文章内容
- 基于 URL 参数 ?id=1..8
- 文章元数据（作者、日期、阅读时间）
- 动态注入 Article JSON-LD schema
- 相关文章推荐
```

### 关于页面 (about.html)
```
- 品牌故事（2 段）
- 6 个核心价值观
- 3 名团队成员介绍
- 4 个统计数据卡片
```

---

## 🛠️ 快速命令

### 启动开发服务器
```bash
cd /Users/owant/supuzz-web-2025/supuzz.github.io
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 提交更改
```bash
git add .
git commit -m "描述改动"
git push origin main
```

### 查看最近 commits
```bash
git log --oneline -10
```

---

## 📝 编辑指南

### 修改导航菜单
📁 `includes/header.html`
```html
<a href="/index.html" class="nav-item">Products</a>
<a href="/blog.html" class="nav-item">Blog</a>
<a href="/about.html" class="nav-item">About</a>
```

### 修改颜色主题
📁 `assets/css/site.css`
```css
:root {
    --primary-color: #E63946;      /* 主色 */
    --accent-color: #2A9D8F;       /* 辅助色 */
    --highlight-color: #F4A261;    /* 强调色 */
}
```

### 添加新博客文章
📁 `blog-post.html`
```javascript
const articles = [
    {
        id: 9,
        title: "新文章标题",
        tag: "分类",
        author: "作者名",
        date: "Nov 25, 2025",
        readTime: 5,
        image: "https://...",
        description: "短描述",
        content: `<h2>文章内容</h2>...`
    }
    // 添加更多...
];
```

### 更新产品列表
📁 `index.html` - 搜索 `product-grid` 类名

---

## 📊 内容结构

### 产品信息（index.html 中）
```
产品 1: Ergonomic Toddler Chair
- ASIN: B0CT9R3PRQ
- 图片: /web-resource/images/toddler-chair.jpg
- Amazon 链接

产品 2: Coral Reef Building Toy
- ASIN: B0FHK5NP9T
- 图片: /web-resource/images/coral-reef.png
- Amazon 链接

产品 3: Forest Building Set
- 图片: /web-resource/images/forest-set.png
- Amazon 链接
```

### 博客文章列表（blog-post.html 中）
```
1. Why Building Toys are Ultimate STEM Learning Tools
2. Indoor STEM Activities for Toddlers (Ages 1-8)
3. Best Educational Toys for 3-5 Year Olds & Preschoolers
4. Importance of Ergonomic Seating for Toddler Development
5. Fine Motor Skills: The Foundation of Early Learning
6. How to Choose Safe, Educational Toys for Your Child
7. Montessori-Inspired Play: Open-Ended STEM Learning
8. Using STEM Toys in Preschool Classrooms
```

---

## 🎨 样式系统

### CSS 类名约定
```css
.container          /* 内容容器（max-width: 1200px） */
.btn-primary        /* 主要按钮（红色） */
.btn-buy            /* Amazon 购买按钮（橙色） */
.product-card       /* 产品卡片 */
.blog-card          /* 博客卡片 */
.section-title      /* 章节标题 */
.section-desc       /* 章节描述 */
```

### 响应式断点
```css
默认（桌面）: 1024px+
平板: 768px - 1023px
手机: 480px - 767px
```

---

## 📱 SEO 检查清单

- [ ] 每个页面有唯一的 `<title>` 和 `<meta name="description">`
- [ ] `<link rel="canonical">` 指向正确的 URL
- [ ] `index.html` 中有 Product JSON-LD schema
- [ ] `blog-post.html` 中动态注入 Article JSON-LD
- [ ] `sitemap.xml` 包含所有页面
- [ ] `robots.txt` 存在且正确
- [ ] 所有外部链接都有 `target="_blank"`

---

## 🐛 常见问题

**Q: 怎样让 header/footer 出现？**
```
A: 服务器必须运行，页面会通过 fetch() 加载片段。
   查看浏览器控制台是否有网络错误。
```

**Q: 新产品怎样添加到首页？**
```
A: 编辑 index.html，在 .product-grid 中复制一个 .product-card，
   更新图片、标题、描述和 Amazon 链接。
```

**Q: 博客文章怎样加入搜索引擎？**
```
A: 1. 更新 sitemap.xml，添加新文章 URL
   2. 提交给 Google Search Console
   3. 等待爬虫抓取
```

**Q: 怎样测试 JSON-LD schema？**
```
A: 访问 https://search.google.com/test/rich-results
   粘贴网站 URL，验证 schema 有效性
```

---

## 📂 文件位置速查

| 功能 | 文件 |
|------|------|
| 产品信息 | index.html |
| 博客内容 | blog-post.html (articles 数组) |
| 样式主题 | assets/css/site.css |
| 导航菜单 | includes/header.html |
| 页脚链接 | includes/footer.html |
| SEO 指令 | robots.txt |
| 站点地图 | sitemap.xml |
| 开发文档 | README.md |
| 需求文档 | REQUIREMENTS.md |
| 完成报告 | COMPLETION_REPORT.md |

---

## ✅ 验证清单

启动服务器后，依次检查：

```
□ http://localhost:8000/          - 首页加载
□ http://localhost:8000/blog.html - 博客列表
□ http://localhost:8000/blog-post.html?id=1 - 文章页
□ http://localhost:8000/about.html - 关于页

□ 所有页面：header/footer 已加载
□ 所有页面：CSS 样式已应用
□ 首页：3 个产品卡片可见
□ 博客页：8 张文章卡片可见
□ 博客文章：内容和相关推荐显示
□ 关于页：团队成员和统计数据显示

□ 浏览器控制台：无红色错误
□ 响应式：手机/平板/桌面显示正常
□ 导航：所有链接可点击
□ 图片：所有图片成功加载
```

---

## 🚀 部署步骤

```bash
# 1. 测试本地
python3 -m http.server 8000
# 访问并验证所有页面

# 2. 提交更改
git add .
git commit -m "Update SUPUZZ website"
git push origin main

# 3. 验证部署
# 等待 1-2 分钟，访问 https://supuzz.github.io

# 4. 提交 SEO
# 访问 Google Search Console
# 提交 sitemap.xml
# 请求索引
```

---

## 📞 快速帮助

**需要改动什么？**

1. **修改文本内容** → 编辑 .html 文件
2. **修改样式/颜色** → 编辑 assets/css/site.css
3. **修改导航** → 编辑 includes/header.html
4. **添加新文章** → 编辑 blog-post.html 的 articles 数组
5. **更新 SEO** → 编辑 sitemap.xml 和各页面 meta 标签

**需要部署到线上？**
```bash
git add .
git commit -m "message"
git push origin main
# 等待 2-5 分钟，网站自动更新
```

---

**最后更新**: 2025-11-21  
**版本**: 1.0 Production  
**状态**: ✅ READY TO DEPLOY
