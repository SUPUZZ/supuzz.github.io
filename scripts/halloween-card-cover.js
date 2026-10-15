// Use the seasonal editorial cover consistently in every language's article list.
const descriptions = {
  en: 'Glowing jack-o-lanterns, purple bows and black-and-gold gift boxes for Halloween',
  es: 'Calabazas iluminadas, lazos morados y cajas de regalo negras y doradas para Halloween',
  ja: '光るジャック・オー・ランタン、紫のリボン、黒と金のギフトボックスを並べたハロウィーンの飾り付け',
  'zh-Hant': '發光南瓜燈、紫色蝴蝶結與黑金禮盒組成的萬聖節送禮佈置',
  de: 'Leuchtende Kürbislaternen, lila Schleifen und schwarz-goldene Geschenkboxen zu Halloween',
  pt: 'Abóboras iluminadas, laços roxos e caixas de presente pretas e douradas para o Halloween',
  fr: 'Citrouilles lumineuses, nœuds violets et boîtes cadeaux noires et dorées pour Halloween'
};

function halloweenCardCover(directory) {
  if (!descriptions[directory]) throw new Error(`Unknown Halloween cover locale: ${directory}`);
  return {
    image:'/product-images/journal/halloween-gifts-pumpkins-cover-480.webp',
    width:480, height:270, alt:descriptions[directory]
  };
}

module.exports = { halloweenCardCover };
