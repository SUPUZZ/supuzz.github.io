// Each article owns its cover; translations of the same article share that image.
const articles = [
  ['article-halloween-toy-gifts-for-kids.html', 'halloween-gifts-pumpkins-cover', 'Vera Kratochvil'],
  ['article-halloween-boo-basket-ideas-kids.html', 'halloween-boo-basket-cover', 'Linnaea Mallette'],
  ['article-non-candy-halloween-gifts-kids.html', 'halloween-non-candy-gifts-cover'],
  ['article-halloween-dinosaur-gifts-kids.html', 'halloween-dinosaur-adventure-cover'],
  ['article-halloween-building-block-activities.html', 'halloween-building-activities-cover'],
  ['article-halloween-classroom-party-gifts.html', 'halloween-classroom-party-cover', 'Petr Kratochvil']
];
const descriptions = {
  en: [
    'Glowing jack-o-lanterns, purple bows and black-and-gold Halloween gifts',
    'A wicker basket filled with orange pumpkins and autumn leaves',
    'A colorful robot built from SUPUZZ waffle blocks as a non-candy gift idea',
    'A child building a dinosaur jungle scene with SUPUZZ building pieces',
    'Colorful waffle-block structures and toy figures for creative building activities',
    'A Halloween party table decorated with pumpkins and warm lights'
  ],
  es: [
    'Calabazas iluminadas, lazos morados y regalos negros y dorados para Halloween',
    'Una cesta de mimbre con calabazas naranjas y hojas de otoño',
    'Un robot de colores hecho con bloques SUPUZZ como regalo sin dulces',
    'Un niño construye una selva de dinosaurios con piezas SUPUZZ',
    'Construcciones de bloques de colores y figuras para actividades creativas',
    'Una mesa de fiesta de Halloween con calabazas y luces cálidas'
  ],
  ja: [
    '光るジャック・オー・ランタン、紫のリボン、黒と金のハロウィーンギフト',
    'オレンジ色のカボチャと秋の葉を入れた編みかご',
    'お菓子の代わりのギフトとしてSUPUZZワッフルブロックで作ったカラフルなロボット',
    'SUPUZZのパーツで恐竜のジャングルを組み立てる子ども',
    '創作遊びのためのカラフルなワッフルブロックの建物と人形',
    'カボチャと暖かな照明で飾ったハロウィーンのパーティーテーブル'
  ],
  'zh-Hant': [
    '發光南瓜燈、紫色蝴蝶結與黑金禮盒組成的萬聖節送禮佈置',
    '藤編籃子裡的橘色南瓜與秋葉，呈現萬聖節驚喜禮籃靈感',
    '以 SUPUZZ 彩虹鬆餅積木拼搭的機器人，作為非糖果玩具禮物靈感',
    '孩子使用 SUPUZZ 積木搭建恐龍叢林與探險場景',
    '以彩色互鎖鬆餅積木拼成的建築與人物，呈現自由創作玩法',
    '以南瓜與暖色燈光佈置的萬聖節派對桌，呈現團體活動靈感'
  ],
  de: [
    'Leuchtende Kürbislaternen, lila Schleifen und schwarz-goldene Halloween-Geschenke',
    'Ein Weidenkorb mit orangefarbenen Kürbissen und Herbstblättern',
    'Ein bunter Roboter aus SUPUZZ-Waffelbausteinen als Geschenk ohne Süßigkeiten',
    'Ein Kind baut mit SUPUZZ-Bauteilen eine Dinosaurier-Dschungelszene',
    'Bunte Waffelbaustein-Konstruktionen und Spielfiguren für kreative Bauideen',
    'Ein Halloween-Partytisch mit Kürbissen und warmen Lichtern'
  ],
  pt: [
    'Abóboras iluminadas, laços roxos e presentes pretos e dourados para o Halloween',
    'Um cesto de vime com abóboras laranjas e folhas de outono',
    'Um robô colorido feito com blocos SUPUZZ como ideia de presente sem doces',
    'Uma criança monta uma selva de dinossauros com peças SUPUZZ',
    'Construções com blocos coloridos e figuras para atividades criativas',
    'Uma mesa de festa de Halloween decorada com abóboras e luzes quentes'
  ],
  fr: [
    'Citrouilles lumineuses, nœuds violets et cadeaux noirs et dorés pour Halloween',
    'Un panier en osier rempli de citrouilles orange et de feuilles d’automne',
    'Un robot coloré construit avec des blocs SUPUZZ comme cadeau sans bonbons',
    'Un enfant construit une jungle de dinosaures avec des pièces SUPUZZ',
    'Des constructions en blocs colorés et des figurines pour des activités créatives',
    'Une table de fête d’Halloween décorée de citrouilles et de lumières chaleureuses'
  ]
};
const photoLabels = {en:'Image', es:'Imagen', ja:'画像', 'zh-Hant':'圖片', de:'Bild', pt:'Imagem', fr:'Image'};

function halloweenHeroCover(directory, href) {
  const index = articles.findIndex(([file]) => file === href);
  if (index < 0 || !descriptions[directory]) throw new Error(`Unknown Halloween cover: ${directory}/${href}`);
  const [, name, creator] = articles[index];
  const src = `/product-images/journal/${name}.webp`;
  const alt = descriptions[directory][index];
  const credit = creator ? `${photoLabels[directory]}: ${creator} / Public Domain Pictures (CC0).` : '';
  return {src, thumb:src.replace('.webp', '-480.webp'), width:1280, height:720, thumbWidth:480, thumbHeight:270, alt, caption:[alt, credit].filter(Boolean).join(' ')};
}

function halloweenCardCover(directory, href) {
  const cover = halloweenHeroCover(directory, href);
  return {image:cover.thumb, width:cover.thumbWidth, height:cover.thumbHeight, alt:cover.alt};
}

module.exports = {halloweenArticles:articles.map(([file]) => file), halloweenHeroCover, halloweenCardCover};
