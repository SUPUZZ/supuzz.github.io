import { copy, worldCopy } from './future-copy.js';

const worlds = {
  coral: { number: '01', word: 'CORAL', label: 'THE CORAL COLLECTION', image: '/product-images/future/coral.webp', link: 'product-coral-reef-l3.html' },
  ice: { number: '02', word: 'FROST', label: 'THE ICE COLLECTION', image: '/product-images/future/ice.webp', link: 'product-icy-world-l3.html' },
  multi: { number: '03', word: 'BEYOND', label: 'THE MULTIDIMENSIONAL COLLECTION', image: '/product-images/future/multi.webp', link: 'product-waffle-building-blocks-128.html' },
  dino: { number: '04', word: 'ROAR!', label: 'THE DINOSAUR COLLECTION', image: '/product-images/future/dino.webp', link: 'product-dinosaur-jungle-l3.html' }
};
for (const key of Object.keys(worlds)) Object.assign(worlds[key], worldCopy[key]);
const root = document.getElementById('future');
const scene = document.getElementById('scene');
const product = document.getElementById('hero-product');
const buttons = [...document.querySelectorAll('[data-select]')];
const motion = document.getElementById('motion-toggle');
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
let viewer;
let selectedWorld = 'coral';
let exploded = false;
const explodeButton = document.getElementById('explode-toggle');
const viewButtons = [...document.querySelectorAll('.f-view-controls button')];
viewButtons.forEach(button => { button.disabled = true; });
function updateMotion() {
  root.classList.toggle('is-paused', paused);
  motion.setAttribute('aria-pressed', String(paused));
  motion.textContent = paused ? copy.rotate : copy.pause;
  viewer?.pause(paused);
  if (preference.matches) {
    motion.textContent = copy.reduced;
    motion.disabled = true;
  } else motion.disabled = false;
}
updateMotion();
motion.addEventListener('click', () => { paused = !paused; updateMotion(); });
preference.addEventListener('change', () => { paused = preference.matches; viewer?.reducedMotion(preference.matches); updateMotion(); });
function selectWorld(key) {
  const world = worlds[key];
  selectedWorld = key;
  root.dataset.world = key;
  product.src = world.image;
  product.alt = world.alt;
  document.getElementById('world-number').textContent = `${world.number} / 04`;
  document.getElementById('world-label').textContent = world.label;
  document.getElementById('world-features').textContent = world.features;
  document.getElementById('world-title').textContent = world.title;
  const link = document.getElementById('world-link');
  link.href = world.link;
  link.setAttribute('aria-label', copy.explore(world.name));
  scene.setAttribute('aria-label', copy.scene(world.name));
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.select === key)));
  viewer?.select(key);
  exploded = false;
  explodeButton.setAttribute('aria-pressed', 'false');
  explodeButton.textContent = copy.explode;
}
buttons.forEach((button, index) => {
  button.addEventListener('click', () => selectWorld(button.dataset.select));
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    buttons[next].focus();
    selectWorld(buttons[next].dataset.select);
  });
});
explodeButton.addEventListener('click', () => {
  exploded = !exploded;
  viewer?.explode(exploded);
  explodeButton.setAttribute('aria-pressed', String(exploded));
  explodeButton.textContent = exploded ? copy.assemble : copy.explode;
});
document.getElementById('reset-view').addEventListener('click', () => viewer?.reset());
document.getElementById('zoom-in').addEventListener('click', () => viewer?.zoom(.85));
document.getElementById('zoom-out').addEventListener('click', () => viewer?.zoom(1.18));
import('./future-3d.js').then(({ createWorldViewer }) => {
  viewer = createWorldViewer(document.getElementById('stage'), preference.matches);
  viewer.select(selectedWorld);
  viewer.pause(paused);
  viewButtons.forEach(button => { button.disabled = false; });
  document.getElementById('scene-status').textContent = copy.concept;
}).catch(error => {
  document.getElementById('scene-status').textContent = copy.unavailable;
  motion.disabled = true;
  motion.textContent = copy.static;
  console.warn('Future 3D unavailable:', error);
});
