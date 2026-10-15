// Shared include data for the blog index and homepage article cards.
function blogCardInclude(post) {
  const data = { category: '', label: '', date: '', dateText: '', ...post };
  for (const key of ['href', 'image', 'width', 'height', 'alt', 'title', 'excerpt']) {
    if (!data[key]) throw new Error(`Missing blog card ${key}: ${data.href || 'unknown article'}`);
  }
  // Keep JSON inside the include safe even when editorial copy contains HTML characters.
  const json = JSON.stringify(data, null, 4).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
  return `<include src="components/blog-card.html">\n${json}\n</include>`;
}

module.exports = { blogCardInclude };
