---
name: "blog-article-validator"
description: "Comprehensive validation checklist for newly added multi-language blog articles. Checks all 7 language pages, image format (webp), SEO metadata, sitemap, and blog listing entries. Invoke after creating or translating a new blog article."
---

# Blog Article Validator

Validate that a newly added multi-language blog article is complete and correct across all 7 languages (en, es, ja, zh-Hant, de, pt, fr). Run this after creating a new article or translating it to all languages.

## Usage

When invoked, ask the user for the article slug (e.g., `article-waffle-blocks-early-education`), then run all checks below. Report results with ✅ / ❌ per item.

---

## 1. File Existence (All 7 Languages)

Verify that the article exists in each language directory:

```
zh-Hant/article-{slug}.html
en/article-{slug}.html
es/article-{slug}.html
ja/article-{slug}.html
de/article-{slug}.html
pt/article-{slug}.html
fr/article-{slug}.html
```

Use `Glob` with pattern `*/article-{slug}.html`.

---

## 2. Image Format — Must Be .webp

Scan the source zh-Hant article (or any language version) for all `<img>` tags and `og:image` references. Verify:

- [ ] All referenced images use `.webp` extension (not `.jpg`, `.jpeg`, `.png`)
- [ ] All referenced images exist on disk (check both `static/product-images/` and `static/about-images/`)
- [ ] og:image and twitter:image use `.webp`
- [ ] Schema.org `ImageObject` url uses `.webp`

Use `Grep` to find image paths: `<img src="` and `og:image` and `"url": "https://supuzz.com/product-images/` in each file.

---

## 3. SEO Metadata Per Language

For each of the 7 language files, verify:

### 3a. Core Meta Tags
- [ ] `<html lang="XX">` matches the language directory (en→en, es→es, ja→ja, zh-Hant→zh-Hant, de→de, pt→pt, fr→fr)
- [ ] `<title>` is translated and ends with ` | SUPUZZ`
- [ ] `<meta name="description">` is in the correct language
- [ ] `<meta name="keywords">` is in the correct language
- [ ] `<meta name="robots">` is `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`
- [ ] `<meta name="author">` is translated per language

### 3b. Open Graph
- [ ] `og:type` = `article`
- [ ] `og:url` = `https://supuzz.com/{lang}/article-{slug}.html`
- [ ] `og:title` translated
- [ ] `og:description` translated
- [ ] `og:image` uses `.webp`
- [ ] `og:image:width` = `1200`, `og:image:height` = `800`
- [ ] `og:image:alt` translated
- [ ] `og:site_name` = `SUPUZZ`
- [ ] `og:locale` correct per language:
  - en→en_US, es→es_ES, ja→ja_JP, zh-Hant→zh_Hant, de→de_DE, pt→pt_BR, fr→fr_FR

### 3c. Twitter Card
- [ ] `twitter:card` = `summary_large_image`
- [ ] `twitter:url` matches canonical URL
- [ ] `twitter:title` translated
- [ ] `twitter:description` translated
- [ ] `twitter:image` uses `.webp`
- [ ] `twitter:image:alt` translated

### 3d. Article Meta
- [ ] `article:published_time` = `2026-06-17T00:00:00+00:00` (or correct publish date)
- [ ] `article:modified_time` = same as published_time
- [ ] `article:author` translated
- [ ] `article:section` translated
- [ ] `article:tag` present and translated

---

## 4. Schema.org Structured Data

For each language file, verify:

### 4a. BlogPosting
- [ ] `headline` translated
- [ ] `description` translated
- [ ] `image.url` uses `.webp`, with width=1200, height=800
- [ ] `datePublished` and `dateModified` set to the correct date
- [ ] `author.name` translated, `author.url` = `https://supuzz.com`
- [ ] `publisher.name` = `SUPUZZ`
- [ ] `publisher.logo.url` = `https://supuzz.com/images/android-chrome-512x512.png`
- [ ] `mainEntityOfPage.@id` = `https://supuzz.com/{lang}/article-{slug}.html`
- [ ] `keywords` translated
- [ ] `articleSection` translated
- [ ] `wordCount` = `"1800"` (or actual word count)
- [ ] `timeRequired` = `"PT6M"` (or actual reading time)

### 4b. BreadcrumbList
- [ ] Position 1: `name` = Home page label translated (Home/Inicio/ホーム/首頁/Startseite/Início/Accueil)
- [ ] Position 1: `item` = `https://supuzz.com/index.html`
- [ ] Position 2: `name` = Blog label translated (Blog/Jornal/ブログ/部落格/Diario/Journal/Blog)
- [ ] Position 2: `item` = `https://supuzz.com/{lang}/blog.html`
- [ ] Position 3: `name` = Article section translated
- [ ] Position 3: `item` = `https://supuzz.com/{lang}/article-{slug}.html`

---

## 5. Geo Region

- [ ] `<meta name="geo.region">` is correct per language:
  - en→US, es→ES, ja→JP, zh-Hant→TW, de→DE, pt→BR, fr→FR

---

## 6. Hreflang Tags

Verify ALL language files contain the complete set of hreflang links:

- [ ] `<link rel="canonical" href="https://supuzz.com/{lang}/article-{slug}.html">` (self-referencing)
- [ ] `<link rel="alternate" hreflang="en" href="...en/...">`
- [ ] `<link rel="alternate" hreflang="es" href="...es/...">`
- [ ] `<link rel="alternate" hreflang="ja" href="...ja/...">`
- [ ] `<link rel="alternate" hreflang="zh-Hant" href="...zh-Hant/...">`
- [ ] `<link rel="alternate" hreflang="de" href="...de/...">`
- [ ] `<link rel="alternate" hreflang="pt" href="...pt/...">`
- [ ] `<link rel="alternate" hreflang="fr" href="...fr/...">`
- [ ] `<link rel="alternate" hreflang="x-default" href="...en/...">`

---

## 7. Content & Structure

For each language file, verify:

- [ ] `<include src="components/header.html">` present
- [ ] `<include src="components/footer.html">` present
- [ ] `<link rel="stylesheet" href="../css/style.css">` present (note: `../` for language directories)
- [ ] Favicon links present (favicon.ico, favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png)
- [ ] `<link rel="manifest" href="../site.webmanifest">` present
- [ ] Viewport meta tag present
- [ ] Google Fonts link present (Outfit + Material Symbols Rounded)
- [ ] Visible date matches the localized format (e.g., en: "June 17, 2026", de: "17. Juni 2026")
- [ ] Visible breadcrumb shows correct translated labels, links to `index.html` and `blog.html`
- [ ] Tag label is translated and displayed
- [ ] `SUPUZZ` is all-caps in all visible text and meta tags
- [ ] Reading time is translated (e.g., en: "6 min read", ja: "読了時間 6 分")

---

## 8. Blog Listing Page (`blog.html`)

For each of the 7 language `blog.html` files, verify:

- [ ] A new card exists linking to `article-{slug}.html`
- [ ] Card has `data-category` attribute
- [ ] Card image uses `.webp` format
- [ ] Card title is translated
- [ ] Card description is translated
- [ ] "Read Article" link text is translated per language

---

## 9. Sitemap (`static/sitemap.xml`)

- [ ] All 7 language URLs added:
  - `https://supuzz.com/en/article-{slug}.html`
  - `https://supuzz.com/es/article-{slug}.html`
  - `https://supuzz.com/ja/article-{slug}.html`
  - `https://supuzz.com/zh-Hant/article-{slug}.html`
  - `https://supuzz.com/de/article-{slug}.html`
  - `https://supuzz.com/pt/article-{slug}.html`
  - `https://supuzz.com/fr/article-{slug}.html`

---

## 10. Brand Consistency

Across all files:

- [ ] `SUPUZZ` is always uppercase (never "Supuzz" or "supuzz")
- [ ] Product images use `/product-images/` path prefix (absolute paths)
- [ ] All internal URLs use `supuzz.com` (without www)

---

## Summary Report

After running all checks, output a summary table:

| Check Category | Status |
|---|---|
| 1. File Existence (7 languages) | ✅ / ❌ |
| 2. Image Format (.webp) | ✅ / ❌ |
| 3. SEO Metadata | ✅ / ❌ |
| 4. Schema.org Data | ✅ / ❌ |
| 5. Geo Region | ✅ / ❌ |
| 6. Hreflang Tags | ✅ / ❌ |
| 7. Content & Structure | ✅ / ❌ |
| 8. Blog Listing | ✅ / ❌ |
| 9. Sitemap | ✅ / ❌ |
| 10. Brand Consistency | ✅ / ❌ |

For any ❌ items, list the exact file and line where the issue was found.
