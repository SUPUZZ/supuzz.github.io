# SUPUZZ Website - Build & Deployment Guide

## Project Structure

```
supuzz.github.io/
├── index.html              # Home / Products page
├── blog.html               # Blog listing page
├── blog-post.html          # Single blog article (dynamic)
├── about.html              # About page
├── sitemap.xml             # Search engine sitemap
├── robots.txt              # Search engine directives
├── includes/
│   ├── header.html         # Navigation fragment
│   └── footer.html         # Footer fragment
├── assets/
│   └── css/
│       └── site.css        # Unified stylesheet (theme + components)
├── web-resource/
│   ├── images/
│   │   ├── toddler-chair.jpg
│   │   ├── coral-reef.png
│   │   └── forest-set.png
│   └── IMAGE_SOURCES.txt   # Image attribution
├── scripts/
│   └── build.py            # Build script
└── build/                  # Generated output (for production)
```

## Development

### Setup
1. Clone the repository
2. No additional dependencies required - uses vanilla HTML/CSS/JS

### Local Preview
Open any page directly in your browser:
```bash
# Using Python's built-in server
python3 -m http.server 8000

# Or with Node.js
npx http-server
```

Visit: `http://localhost:8000`

### Pages
- **Home**: `index.html` - Products showcase, blog preview, why choose us
- **Blog List**: `blog.html` - All blog articles
- **Blog Post**: `blog-post.html?id=1..8` - Dynamic article content
- **About**: `about.html` - Company story, team, values

### Navigation
The header and footer fragments are loaded dynamically via `fetch()` in development. This allows:
- Single source of truth for navigation
- Easy updates to header/footer across all pages
- Client-side flexibility

## Building for Production

The build script generates standalone HTML files with fragments inlined:

```bash
python3 scripts/build.py
```

This creates:
- `build/index.html` - With embedded header/footer
- `build/blog.html` - With embedded header/footer
- `build/blog-post.html` - With embedded header/footer
- `build/about.html` - With embedded header/footer
- `build/assets/` - Copied stylesheets
- `build/web-resource/` - Copied images
- `build/sitemap.xml` - Copied for search engines
- `build/robots.txt` - Copied for search engines

### Why Build?
- **Zero Runtime Dependencies**: No fetch() calls needed
- **Faster Load Time**: No additional network requests
- **SEO Friendly**: Complete HTML sent to crawlers
- **Offline Capable**: Works without internet connection

## Deployment Options

### Option A: Deploy from Main Branch (Simple)
1. Ensure all source files are updated
2. Push to `main` branch
3. GitHub Pages automatically serves `index.html`, `blog.html`, etc.
4. **Note**: Uses client-side fragment loading

```bash
git add .
git commit -m "Update site content"
git push origin main
```

### Option B: Deploy from gh-pages Branch (Recommended)
1. Build production files
2. Push source to `main`, built files to `gh-pages`
3. Configure GitHub Pages to use `gh-pages` branch

```bash
# Generate build
python3 scripts/build.py

# Stage and commit changes
git add .
git commit -m "chore: update site"

# Push source to main
git push origin main

# Copy build directory to gh-pages branch
git subtree push --prefix build origin gh-pages
```

**GitHub Pages Settings**:
- Source: Deploy from a branch
- Branch: `gh-pages`
- Folder: `/ (root)`

## SEO & Structured Data

### JSON-LD Schemas
- **Product Schema**: `index.html` - Lists 2 products
- **Article Schema**: `blog-post.html` - Dynamically injected per article

### Verification
Test with [Google Rich Results Test](https://search.google.com/test/rich-results):
```
https://supuzz.github.io/index.html
https://supuzz.github.io/blog-post.html?id=1
```

### Sitemap & Robots
- `sitemap.xml` - Lists all pages and blog posts
- `robots.txt` - Allows all crawlers, references sitemap

## Performance Tips

### Images
- Product images: ~10-300KB (optimized JPG/PNG)
- Hero background: Loaded via CSS `background-image`
- Blog thumbnails: Loaded from Unsplash (cached by CDN)

### CSS
- Unified `site.css` - ~500 lines, single request
- Uses CSS custom properties for theming
- Media queries for responsive design

### JavaScript
- Vanilla JS only (no frameworks)
- Fragment loading via `fetch()` (6KB inline)
- Article data embedded in `blog-post.html` (8KB inline)

## Styling System

### Theme Variables (in `assets/css/site.css`)
```css
:root {
    --primary-color: #E63946;    /* Main red */
    --accent-color: #2A9D8F;     /* Green */
    --highlight-color: #F4A261;  /* Orange */
}
```

### Component Classes
- `.btn-primary` - Call-to-action buttons
- `.btn-buy` - Amazon link buttons
- `.product-card` - Product showcase card
- `.blog-card` - Blog article card
- `.nav-item` - Navigation links

## Troubleshooting

### Header/Footer Not Loading
- Check browser console for fetch errors
- Ensure `/includes/header.html` and `/includes/footer.html` exist
- Verify file paths are absolute (`/includes/...` not `../includes/...`)

### Images Not Showing
- Local images: Check `/web-resource/images/` directory
- Unsplash images: Check internet connection, may require CORS
- Verify correct paths in `<img src="...">` tags

### Build Script Errors
```bash
# Ensure you're in the repository root
cd /Users/owant/supuzz-web-2025/supuzz.github.io
python3 scripts/build.py
```

### GitHub Pages Not Updating
1. Check branch configuration in repository settings
2. Verify files are actually committed: `git log --oneline`
3. Allow 1-2 minutes for GitHub to rebuild

## Content Updates

### Add New Blog Article
1. Edit `blog-post.html` - Add entry to `articles` array
2. Add new blog card to `blog.html`
3. Update `sitemap.xml` with new post URL
4. Rebuild and deploy

### Update Navigation
1. Edit `includes/header.html`
2. Changes automatically apply to all pages
3. Rebuild for production deployment

### Change Colors/Theme
1. Edit CSS variables in `assets/css/site.css`
2. All components automatically update
3. No need to change individual page styles

## Maintenance

### Regular Tasks
- **Monthly**: Review blog traffic, update sitemap if needed
- **Quarterly**: Check broken links, test all pages
- **Annually**: Review and update content, refresh images

### Monitoring
- Use Google Search Console to monitor search performance
- Check Google Analytics for user behavior
- Monitor 404 errors in server logs

## Next Steps

1. ✓ Verify all pages load correctly
2. ✓ Test header/footer fragments
3. ✓ Validate JSON-LD schemas
4. ✓ Check responsive design on mobile
5. ✓ Run build script
6. ✓ Deploy to GitHub Pages
7. Submit sitemap to Google Search Console
8. Monitor search performance

---

**Last Updated**: November 21, 2025
**GitHub Repository**: https://github.com/SUPUZZ/supuzz.github.io
