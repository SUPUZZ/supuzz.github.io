import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const productImagesDir = resolve(root, 'static', 'product-images');
const inputDir = resolve(root, 'input');

mkdirSync(productImagesDir, { recursive: true });

const tasks = [
  // 1. 新的头图 PNG → WebP
  {
    src: resolve(inputDir, '轮播图-手机端-早教场景.png'),
    dest: resolve(productImagesDir, 'waffle-blocks-early-education.webp'),
    label: '头图 PNG → WebP',
    width: 1200,
  },
  // 2. 已有 JPG → WebP
  {
    src: resolve(productImagesDir, 'waffle-blocks-figures.jpg'),
    dest: resolve(productImagesDir, 'waffle-blocks-figures.webp'),
    label: 'figures JPG → WebP',
    width: 1200,
  },
  {
    src: resolve(productImagesDir, 'waffle-blocks-scene.jpg'),
    dest: resolve(productImagesDir, 'waffle-blocks-scene.webp'),
    label: 'scene JPG → WebP',
    width: 1200,
  },
  {
    src: resolve(productImagesDir, 'waffle-blocks-mechanical.jpg'),
    dest: resolve(productImagesDir, 'waffle-blocks-mechanical.webp'),
    label: 'mechanical JPG → WebP',
    width: 1200,
  },
  {
    src: resolve(productImagesDir, 'waffle-blocks-amusement-park.jpg'),
    dest: resolve(productImagesDir, 'waffle-blocks-amusement-park.webp'),
    label: 'amusement-park JPG → WebP',
    width: 1200,
  },
];

async function convert({ src, dest, label, width }) {
  const info = await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(dest);
  const srcSize = (await sharp(src).metadata()).size;
  const destSize = info.size;
  const ratio = ((1 - destSize / srcSize) * 100).toFixed(1);
  console.log(`✅ ${label}: ${(srcSize / 1024).toFixed(0)}KB → ${(destSize / 1024).toFixed(0)}KB (减小 ${ratio}%)`);
}

(async () => {
  console.log('开始转换图片...\n');
  for (const task of tasks) {
    try {
      await convert(task);
    } catch (e) {
      console.error(`❌ ${task.label}: ${e.message}`);
    }
  }
  console.log('\n全部完成！');
})();
