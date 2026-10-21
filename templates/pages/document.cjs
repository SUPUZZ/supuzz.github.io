// Common document shell for all newly generated multilingual pages.
module.exports = function document({ definition, locale, content, body, url, alternates, escape, jsonLd, structuredData = [] }) {
  const shared = definition.shared || {};
  const article = definition.type === 'article';
  const image = shared.image;
  const title = content.documentTitle || `${content.title} | SUPUZZ`;
  const schema = article ? {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: content.title, description: content.description, inLanguage: locale.htmlLang,
    datePublished: shared.datePublished, dateModified: shared.dateModified || shared.datePublished,
    author: { '@type': 'Organization', name: content.author || 'SUPUZZ', url: `https://supuzz.com/${locale.directory}/about.html` },
    publisher: { '@type': 'Organization', name: 'SUPUZZ', url: 'https://supuzz.com/' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: { '@type': 'ImageObject', url: `https://supuzz.com${image}`, width: shared.imageWidth, height: shared.imageHeight }
  } : {
    '@context': 'https://schema.org', '@type': definition.schemaType || 'WebPage', url,
    name: content.title, description: content.description, inLanguage: locale.htmlLang
  };
  const breadcrumb = article ? {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: content.homeLabel, item: `https://supuzz.com/${locale.directory}/index.html` },
      { '@type': 'ListItem', position: 2, name: content.blogLabel, item: `https://supuzz.com/${locale.directory}/blog.html` },
      { '@type': 'ListItem', position: 3, name: content.title, item: url }
    ]
  } : null;
  return `<!DOCTYPE html>
<html lang="${escape(locale.htmlLang)}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(content.description)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${escape(url)}">
${alternates.map(([language, href]) => `    <link rel="alternate" hreflang="${escape(language)}" href="${escape(href)}">`).join('\n')}
    <meta property="og:type" content="${article ? 'article' : 'website'}">
    <meta property="og:site_name" content="SUPUZZ">
    <meta property="og:locale" content="${escape(locale.ogLocale)}">
    <meta property="og:url" content="${escape(url)}">
    <meta property="og:title" content="${escape(title)}">
    <meta property="og:description" content="${escape(content.description)}">
    <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
    <meta name="twitter:url" content="${escape(url)}">
    <meta name="twitter:title" content="${escape(title)}">
    <meta name="twitter:description" content="${escape(content.description)}">
${image ? `    <meta property="og:image" content="https://supuzz.com${escape(image)}">
    <meta property="og:image:width" content="${shared.imageWidth}">
    <meta property="og:image:height" content="${shared.imageHeight}">
    <meta property="og:image:alt" content="${escape(content.imageAlt)}">
    <meta name="twitter:image" content="https://supuzz.com${escape(image)}">
    <meta name="twitter:image:alt" content="${escape(content.imageAlt)}">` : ''}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;800&amp;display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css">
${(definition.styles || []).map(href => `    <link rel="stylesheet" href="${escape(href)}">`).join('\n')}
    <link rel="icon" href="../images/favicon.ico">
    ${jsonLd(schema)}
    ${breadcrumb ? jsonLd(breadcrumb) : ''}
${structuredData.map(value => `    ${jsonLd(value)}`).join('\n')}
</head>
<body>
    <include src="components/header.html"></include>
${body}
    <include src="components/footer.html"></include>
${(definition.scripts || []).map(src => `    <script type="module" src="${escape(src)}"></script>`).join('\n')}
</body>
</html>
`;
};
