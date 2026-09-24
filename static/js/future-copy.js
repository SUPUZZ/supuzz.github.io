const english = document.documentElement.lang.toLowerCase().startsWith('en');

export const copy = english ? {
  rotate: 'Auto-rotate ▷', pause: 'Pause rotation Ⅱ', reduced: 'Reduced motion enabled',
  explode: 'Take apart', assemble: 'Reassemble',
  concept: 'Collection-inspired scenes · Not to-scale product models',
  unavailable: '3D is unavailable. Explore the collection photos instead.',
  static: 'Photo view', lost: '3D paused. Refresh the page to try again.',
  instructions: 'Drag or use arrow keys to rotate. Use plus and minus to zoom.',
  explore: name => `Explore ${name}`,
  scene: name => `${name} interactive 3D scene`,
} : {
  rotate: '自動旋轉 ▷', pause: '暫停旋轉 Ⅱ', reduced: '已依系統減少動態',
  explode: '拆解看看', assemble: '重新組合',
  concept: '系列創意場景 · 非實物等比例模型',
  unavailable: '目前無法啟動 3D，先看看系列實拍。',
  static: '靜態展示', lost: '立體場景暫停，重新整理可再試一次。',
  instructions: '拖曳或用方向鍵旋轉，使用加減鍵縮放。',
  explore: name => `探索${name}系列`,
  scene: name => `${name}互動立體場景`,
};

export const worldCopy = english ? {
  coral: { title: 'Coral wonders', name: 'Coral', features: 'Clownfish / Coral', alt: 'Colorful SUPUZZ Coral Reef building creation' },
  ice: { title: 'Icy adventures', name: 'Ice', features: 'Penguins / Deer', alt: 'SUPUZZ Icy World animals and building creation' },
  multi: { title: 'Beyond dimensions', name: 'Multidimensional', features: 'Hash-shaped blocks / 3D builds', alt: 'A robot built with SUPUZZ colorful waffle-style blocks' },
  dino: { title: 'Dinosaur jungle', name: 'Dinosaurs', features: 'Pterosaur / T. rex / Baby dinosaur', alt: 'SUPUZZ dinosaur figures and jungle building creation' },
} : {
  coral: { title: '珊瑚奇境', name: '珊瑚', features: '小丑魚 / 珊瑚', alt: '珊瑚礁系列彩色海底拼搭作品' },
  ice: { title: '冰雪奇遇', name: '冰雪', features: '企鵝 / 鹿', alt: '冰雪系列極地動物與冰雪拼搭場景' },
  multi: { title: '多維想像', name: '多維', features: '井字形積木 / 立體拼搭', alt: '多維系列彩虹鬆餅積木機器人' },
  dino: { title: '恐龍叢林', name: '恐龍', features: '翼龍 / 霸王龍 / 恐龍寶寶', alt: '恐龍系列角色與綠色叢林拼搭場景' },
};
