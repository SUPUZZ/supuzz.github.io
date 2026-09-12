// Translations are authored locally. Product identifiers, images and reviewed facts
// come from the shared English catalog so variants cannot drift between languages.
const uiKeys = [
  'View details', 'Shop on Amazon', 'Visit Amazon Store', 'opens in a new tab',
  'Choose your set', 'Home', 'Products', 'Breadcrumb', 'Open full-size product image',
  'View full image ↗', 'Product images', 'Show product image', 'Product information',
  'Explore the product', 'What’s included', 'Specifications', 'FAQs',
  'GET TO KNOW THE DETAILS', 'Their place at the table.', 'More than one way to play.',
  'THE SIZE & THE DETAILS', 'WHAT’S INCLUDED', 'THE FACTS AT A GLANCE',
  'Product specifications', 'BEFORE YOU CHOOSE', 'A few useful answers.',
  'THERE’S MORE TO EXPLORE', 'Find their next favorite.', 'All products',
  'Filter products', 'Waffle blocks', 'Coral Reef', 'Icy World', 'Dinosaurs',
  'Kids furniture', 'THE SUPUZZ COLLECTION', 'product', 'products',
  'Build their', 'next adventure.', 'Looking for Rotating Forest or another SUPUZZ set?',
  'Explore the Amazon Store ↗', 'Checkout, current pricing and delivery on Amazon.',
  'Lifestyle photos include tables and accessories sold separately.',
  'Table and accessories shown are sold separately.',
  'Mixed collection shown. Additional sets sold separately.', 'Kids Chairs', 'Building Toys'
];

const locales = [{
  directory: 'en', htmlLang: 'en-US', ogLocale: 'en_US',
  homeTitle: 'SUPUZZ | Waffle Blocks, Dinosaur & Nature Building Sets',
  homeDescription: 'Explore SUPUZZ waffle blocks, dinosaur jungles, coral reefs, icy worlds and kids chairs. Compare sets, view product details and shop on Amazon.'
}, ...['es', 'ja', 'zh-Hant', 'de', 'pt', 'fr'].map(directory => {
  const data = require(`../resource/product-locales/${directory}.json`);
  if (data.ui.length !== uiKeys.length) throw new Error(`UI translation count: ${directory}: ${data.ui.length}/${uiKeys.length}`);
  return { ...data, directory, ui: Object.fromEntries(uiKeys.map((key, index) => [key, data.ui[index]])) };
})];

function localizedCatalog(source, locale) {
  if (locale.directory === 'en') return source;
  const w = locale.words, c = locale.copy;
  const pieces = count => `${count} ${w.pieces}`;
  return source.filter(p => !p.storeOnly).map(original => {
    const p = structuredClone(original);
    const family = p.category === 'furniture' ? 'chair' : p.variantGroup;
    const name = locale.names[['waffle','dinosaur','ocean','ice','chair'].indexOf(family)];
    if (!name) throw new Error(`Missing translated family: ${p.key}`);
    const chair = family === 'chair', waffle = family === 'waffle', dinosaur = family === 'dinosaur';
    const count = chair ? null : p.metrics[0][0];
    const level = p.variantOrder;
    const age = original.specs['Suggested age']?.replace(/ years(?: and up)?$/, '').replace('3 and up','3+');
    const ageValue = original.specs['Suggested age'] === '3 years and up' ? '3+' : age;
    const storage = waffle ? w.case : dinosaur ? c.dinoStorage : level > 1 ? w.box : w.noBox;
    const familyCopy = c[family];
    const summary = chair ? w.chair : `${w.set} L${level} · ${pieces(count)}`;
    p.name = chair ? name : `${name} · L${level}`;
    p.title = `${p.name}${chair ? '' : ' — ' + pieces(count)} | SUPUZZ`;
    p.label = chair ? locale.ui['Kids furniture'] : `${name} / L${level}`;
    p.facts = chair ? [w.pink, 'PP', w.chair] : [pieces(count), ...(ageValue ? [`${ageValue} ${w.years}`] : []), `L${level}`];
    p.variantLabel = chair ? undefined : `L${level} · ${pieces(count)}`;
    p.subtitle = chair ? familyCopy[0].split(/[。.!]/)[0] : `${summary}${waffle || !dinosaur && level > 1 ? ' · ' + storage : ''}`;
    p.cardCopy = familyCopy[0];
    p.intro = `${summary}。 ${familyCopy[0]}`.replace('。 ', /^(ja|zh-Hant)$/.test(locale.directory) ? '。' : '. ');
    const firstSentence = familyCopy[0].match(/^.*?[。.!](?:\s|$)/)?.[0].trim() || familyCopy[0];
    p.description = `${p.name} · ${chair ? 'PP · ' + w.pink : pieces(count)}. ${firstSentence}`;
    p.metrics = chair ? [[w.pink,w.color],['PP',w.material],['1',w.chair]] : [[count,w.pieces],...(ageValue ? [[ageValue,w.years]] : [[`L${level}`,w.level]]),[waffle ? 'L' + level : !dinosaur && level > 1 ? w.included : 'L' + level, waffle || dinosaur || level === 1 ? w.level : w.storage]];
    p.highlights = chair ? [familyCopy[5],c.chairA,c.fitA] : [pieces(count),familyCopy[5],waffle ? w.case : dinosaur ? w.plastic : level > 1 ? w.box : c.buildTip];
    p.gallery = original.gallery.map(([suffix]) => {
      const role = /contents|package/.test(suffix) || suffix === original.packageImage && !waffle && !chair ? w.contentsAlt : /connections/.test(suffix) || waffle && suffix === 'amazon-3' ? w.connectionsAlt : /play|mixed/.test(suffix) ? w.playAlt : w.mainAlt;
      return [suffix, chair && suffix === 'main' ? w.chairAlt : `${role} — SUPUZZ ${p.name}${chair ? '' : ' · ' + pieces(count)}`];
    });
    p.galleryNote = chair ? locale.ui['Lifestyle photos include tables and accessories sold separately.'] : waffle ? c.waffleNote : dinosaur ? c.dinoNote : c.mixed;
    // Keep the verified gallery and illustrated feature-image choices of each set.
    p.features = original.features.map((feature, index) => ({
      image: feature.image,
      eyebrow: index ? locale.ui['THERE’S MORE TO EXPLORE'] : locale.ui['GET TO KNOW THE DETAILS'],
      title: familyCopy[index ? 3 : 1], body: familyCopy[index ? 4 : 2],
      points: chair ? [index ? c.fitA : c.chairA] : [index ? c.buildTip : `${c.countLabel}: ${pieces(count)}`, c.inventoryTip],
      caption: chair ? locale.ui['Table and accessories shown are sold separately.'] : waffle ? c.waffleNote : dinosaur ? c.dinoNote : index ? c.mixed : ''
    }));
    p.includedTitle = `${w.inBox}${chair ? '' : ' · ' + pieces(count)}`;
    p.included = chair ? [familyCopy[5],c.chairA] : [`${pieces(count)} · ${familyCopy[5]}`, ...(waffle ? [w.case,w.guide] : !dinosaur && level > 1 ? [w.box] : [])];
    if (p.key === 'ice-l3') p.included.push(c.figures);
    if (p.key === 'ice-l1') p.included.push(c.penguin);
    if (p.key === 'ocean-l1') p.included.push(c.octopus);
    p.packageCaption = chair ? w.chairAlt : waffle ? c.exampleNote : `${c.packageNote} ${p.name} · ${pieces(count)}`;
    p.specs = chair ? { [w.series]:name, [w.color]:w.pink, [w.material]:'PP', [w.size]:w.chair, [w.dimensions]:w.dimensionValue } : {
      [w.series]:name,[w.level]:`L${level}`,[w.size]:pieces(count),
      ...(ageValue ? {[w.age]:`${ageValue} ${w.years}`} : {}),
      [w.storage]:storage, ...(waffle ? {[w.guide]:w.included} : dinosaur ? {[w.material]:w.plastic} : {})
    };
    const variants = chair ? [] : source.filter(item => item.variantGroup === original.variantGroup).sort((a,b) => a.variantOrder-b.variantOrder);
    const comparison = variants.map(item => `L${item.variantOrder}: ${pieces(item.metrics[0][0])}`).join(' · ');
    p.faq = chair ? [[c.chairQ,c.chairA],[c.fitQ,c.fitA]] : [
      [c.compareQ,comparison], [c.boxQ,storage],
      [waffle || dinosaur ? c.photoQ : c.compatQ, waffle ? c.waffleNote : dinosaur ? c.dinoNote : c.compatA]
    ];
    // Legacy English editorial fields are not used by the shared rich template.
    delete p.story; delete p.storyTitle; delete p.imageAlts;
    return p;
  });
}

module.exports = { locales, localizedCatalog };
