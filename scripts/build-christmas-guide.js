// Render one Christmas guide per locale and preserve retired holiday URLs as redirects.
const fs = require('fs');
const path = require('path');
const { parser } = require('posthtml-parser');
const { locales, localizedCatalog } = require('./product-localization');
const { blogCardInclude } = require('./blog-card');
const { publicationMetadata } = require('./article-publication');
const copy = require('../resource/christmas-guide-locales.cjs');
const retired = require('../resource/retired-holiday-articles.json');
const source = require('../resource/products-en.json');
const root = path.resolve(__dirname, '..');
const file = 'article-icy-world.html';
const cover = '/product-images/journal/article-icy-world-cover.webp';
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const flatten = nodes => nodes.flatMap(n => typeof n === 'object' ? [n, ...flatten(n.content || [])] : []);
const write = (name, text) => fs.writeFileSync(path.join(root, name), text.trimEnd() + '\n');
for (const locale of locales) {
  const dir = locale.directory, c = copy[dir], url = `https://supuzz.com/${dir}/${file}`;
  const products = localizedCatalog(source, locale).filter(p => ['ice-l1','ice-l2','ice-l3'].includes(p.key));
  const productCards = products.map(p => {
    const product = fs.readFileSync(path.join(root, dir, `product-${p.slug}.html`), 'utf8');
    const image = flatten(parser(product)).find(n => n.tag === 'img').attrs;
    return `<section class="product-pick"><img src="${image.src.replace('.webp','-480.webp')}" width="${image.width}" height="${image.height}" alt="${escape(image.alt)}" loading="lazy" decoding="async"><h3><a href="product-${p.slug}.html">${escape(p.name)}</a></h3><p>${escape(p.facts.join(' · '))}</p><p>${escape(p.cardCopy)}</p><a href="product-${p.slug}.html">${escape(c.details)}</a></section>`;
  }).join('\n');
  const sections = [[c.choose,c.chooseBody],[c.wrapping,c.wrappingBody],[c.play,c.playBody],[c.shopping,c.shoppingBody]];
  const article = {
    '@context':'https://schema.org', '@type':'BlogPosting', headline:c.title, description:c.description,
    image:{'@type':'ImageObject',url:`https://supuzz.com${cover}`,width:1200,height:675},
    datePublished:'2025-11-20T00:00:00+00:00', dateModified:'2026-10-15T09:00:00+08:00',
    author:{'@type':'Organization',name:c.author,url:`https://supuzz.com/${dir}/about.html`},
    publisher:{'@type':'Organization',name:'SUPUZZ',url:'https://supuzz.com/'},
    mainEntityOfPage:{'@type':'WebPage','@id':url}, inLanguage:locale.htmlLang, articleSection:c.category
  };
  const breadcrumb = {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[[c.home,`https://supuzz.com/${dir}/index.html`],[c.blog,`https://supuzz.com/${dir}/blog.html`],[c.title,url]].map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))};
  write(`${dir}/${file}`, `<!DOCTYPE html>
<html lang="${locale.htmlLang}">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>${escape(c.title)} | SUPUZZ</title>
 <meta name="description" content="${escape(c.description)}">
 <meta name="author" content="${escape(c.author)}">
 <meta name="robots" content="index, follow, max-image-preview:large">
 <link rel="canonical" href="${url}">
${[...locales.map(l=>` <link rel="alternate" hreflang="${l.directory}" href="https://supuzz.com/${l.directory}/${file}">`),` <link rel="alternate" hreflang="x-default" href="https://supuzz.com/en/${file}">`].join('\n')}
 <meta property="og:type" content="article">
 <meta property="og:site_name" content="SUPUZZ">
 <meta property="og:locale" content="${locale.ogLocale}">
 <meta property="og:url" content="${url}">
 <meta property="og:title" content="${escape(c.title)} | SUPUZZ">
 <meta property="og:description" content="${escape(c.description)}">
 <meta property="og:image" content="https://supuzz.com${cover}">
 <meta property="og:image:width" content="1200">
 <meta property="og:image:height" content="675">
 <meta property="og:image:alt" content="${escape(c.alt)}">
 <meta property="article:published_time" content="${article.datePublished}">
 <meta property="article:modified_time" content="${article.dateModified}">
 <meta property="article:section" content="${escape(c.category)}">
 <meta name="twitter:card" content="summary_large_image">
 <meta name="twitter:url" content="${url}">
 <meta name="twitter:title" content="${escape(c.title)}">
 <meta name="twitter:description" content="${escape(c.description)}">
 <meta name="twitter:image" content="https://supuzz.com${cover}">
 <meta name="twitter:image:alt" content="${escape(c.alt)}">
 <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;800&amp;display=swap" rel="stylesheet">
 <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet">
 <link rel="stylesheet" href="../css/style.css">
 <link rel="stylesheet" href="../css/halloween-guides.css">
 <link rel="icon" href="../images/favicon.ico">
 <script type="application/ld+json">${JSON.stringify(article,null,2)}</script>
 <script type="application/ld+json">${JSON.stringify(breadcrumb,null,2)}</script>
</head>
<body>
 <include src="components/header.html"></include>
 <main class="container halloween-guide">
 <nav class="breadcrumb" aria-label="${escape(c.blog)}"><a href="index.html">${escape(c.home)}</a> / <a href="blog.html">${escape(c.blog)}</a> / <span aria-current="page">${escape(c.category)}</span></nav>
 <article class="article-container">
 <div class="article-header"><span class="tag">${escape(c.category)}</span><h1>${escape(c.title)}</h1><p class="meta">${escape(c.author)} · <time datetime="2025-11-20">${new Intl.DateTimeFormat(dir === 'zh-Hant' ? 'zh-TW' : dir,{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(article.datePublished))}</time></p></div>
 <figure><img class="featured-img" src="${cover}" width="1200" height="675" alt="${escape(c.alt)}" fetchpriority="high" decoding="async"><figcaption>${escape(c.caption)}</figcaption></figure>
 <div class="content"><p>${escape(c.intro)}</p>
 <section aria-labelledby="choose"><h2 id="choose">${escape(c.choose)}</h2><p>${escape(c.chooseBody)}</p></section>
 <section aria-labelledby="compare"><h2 id="compare">${escape(c.compare)}</h2><div class="product-picks">${productCards}</div></section>
${sections.slice(1).map(([title,body],i)=>` <section aria-labelledby="section-${i}"><h2 id="section-${i}">${escape(title)}</h2><p>${escape(body)}</p></section>`).join('\n')}
 <section aria-labelledby="questions"><h2 id="questions">${escape(c.faq)}</h2><h3>${escape(c.question)}</h3><p>${escape(c.answer)}</p></section>
 <p><a href="blog.html">${escape(c.blog)}</a></p>
 </div></article></main>
 <include src="components/footer.html"></include>
 <script type="module">import { apiService } from '../api/api-service.js'; document.addEventListener('DOMContentLoaded', () => { apiService.pageview(window.location.pathname, document.referrer); });</script>
</body>
</html>`);
  const card = blogCardInclude({href:file,category:'building-blocks',categoryLabel:c.category,image:cover,width:1200,height:675,alt:c.alt,title:c.title,excerpt:c.description,...publicationMetadata(path.join(root,dir,file),dir)});
  let blog = fs.readFileSync(path.join(root,dir,'blog.html'),'utf8');
  let found = false;
  blog = blog.replace(/<include src="components\/blog-card\.html">([\s\S]*?)<\/include>/g,(include,json)=>{
    if(JSON.parse(json).href!==file) return include;
    if(found) throw new Error(`Duplicate Christmas card: ${dir}`);
    found=true; return card;
  });
  if(!found) throw new Error(`Missing Christmas card: ${dir}`);
  write(`${dir}/blog.html`,blog);
  fs.mkdirSync(path.join(root,'static',dir),{recursive:true});
  for(const [old,target] of Object.entries(retired)) {
    write(`static/${dir}/${old}`,`<!DOCTYPE html>
<html lang="${locale.htmlLang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, follow"><link rel="canonical" href="https://supuzz.com/${dir}/${target}"><meta http-equiv="refresh" content="0;url=${target}"><title>SUPUZZ</title></head><body><p><a href="${target}">${escape(target===file?c.title:dir==='en'?'Halloween Toy Gifts for Kids: A Non-Candy Guide':require(`../resource/halloween-locales/${dir}.cjs`).articles[0].title)}</a></p></body></html>`);
  }
}
const posts = require('../resource/home-posts-en.json');
Object.assign(posts.find(post=>post.file===file),{category:'product-guides',title:copy.en.title,excerpt:copy.en.description,alt:copy.en.alt});
write('resource/home-posts-en.json',JSON.stringify(posts,null,2));
console.log('Built seven Christmas guides and redirects for 42 retired holiday articles.');
