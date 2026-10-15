// The single Halloween guide shares its 16:9 cover across all languages.
const file = 'article-halloween-toy-gifts-for-kids.html';
const descriptions = {
  "en": "Glowing jack-o-lanterns, purple bows and black-and-gold Halloween gifts",
  "es": "Calabazas iluminadas, lazos morados y regalos negros y dorados para Halloween",
  "ja": "光るジャック・オー・ランタン、紫のリボン、黒と金のハロウィーンギフト",
  "zh-Hant": "發光南瓜燈、紫色蝴蝶結與黑金禮盒組成的萬聖節送禮佈置",
  "de": "Leuchtende Kürbislaternen, lila Schleifen und schwarz-goldene Halloween-Geschenke",
  "pt": "Abóboras iluminadas, laços roxos e presentes pretos e dourados para o Halloween",
  "fr": "Citrouilles lumineuses, nœuds violets et cadeaux noirs et dorés pour Halloween"
};
const labels = {en:'Image',es:'Imagen',ja:'画像','zh-Hant':'圖片',de:'Bild',pt:'Imagem',fr:'Image'};
function halloweenHeroCover(directory, href) {
  if (href !== file || !descriptions[directory]) throw new Error('Unknown Halloween cover: ' + directory + '/' + href);
  const src = '/product-images/journal/halloween-gifts-pumpkins-cover.webp';
  const alt = descriptions[directory];
  return {src, thumb:src.replace('.webp','-480.webp'), width:1280, height:720, thumbWidth:480, thumbHeight:270, alt, caption:alt + '. ' + labels[directory] + ': Vera Kratochvil / Public Domain Pictures (CC0).'};
}
function halloweenCardCover(directory, href) {
  const cover = halloweenHeroCover(directory, href);
  return {image:cover.thumb, width:cover.thumbWidth, height:cover.thumbHeight, alt:cover.alt};
}
module.exports = {halloweenArticles:[file], halloweenHeroCover, halloweenCardCover};
