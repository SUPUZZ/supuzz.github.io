// Full product image viewer: swipe, pan, pinch, wheel and double-tap zoom.
(() => {
  const viewer = document.querySelector('[data-gallery-viewer]');
  if (!viewer) return;
  const dataElement = document.querySelector('[data-gallery-photos]');
  if (!dataElement) return;
  const { photos } = JSON.parse(dataElement.textContent);
  if (!Array.isArray(photos) || !photos.length) return;

  const frame = viewer.querySelector('[data-gallery-frame]');
  const image = viewer.querySelector('[data-gallery-photo]');
  const stage = viewer.querySelector('[data-gallery-stage]');
  const counter = viewer.querySelector('[data-gallery-count]');
  const backLink = viewer.querySelector('.gallery-back');
  const thumbs = [...viewer.querySelectorAll('[data-gallery-thumb]')];
  const previousButton = viewer.querySelector('[data-gallery-prev]');
  const nextButton = viewer.querySelector('[data-gallery-next]');
  const zoomInButton = viewer.querySelector('[data-gallery-zoom-in]');
  const zoomOutButton = viewer.querySelector('[data-gallery-zoom-out]');
  const zoomResetButton = viewer.querySelector('[data-gallery-zoom-reset]');
  const zoomValue = viewer.querySelector('[data-gallery-zoom-value]');

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  let index = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dragState = null;
  let pinchState = null;
  let lastTap = 0;
  let lastTapX = 0;
  let lastTapY = 0;
  let lastTouchAt = -Infinity;
  const pointers = new Map();
  const preloaded = new Set();

  const hashIndex = Number((window.location.hash.match(/photo-(\d+)/) || [])[1]);
  if (Number.isInteger(hashIndex) && hashIndex > 0) index = Math.min(hashIndex, photos.length) - 1;

  function isControl(target) {
    return target instanceof Element && Boolean(target.closest('button, a'));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function clampOffsets() {
    const width = image.offsetWidth * scale;
    const height = image.offsetHeight * scale;
    const maxX = Math.max(0, (width - frame.clientWidth) / 2);
    const maxY = Math.max(0, (height - frame.clientHeight) / 2);
    offsetX = clamp(offsetX, -maxX, maxX);
    offsetY = clamp(offsetY, -maxY, maxY);
  }

  function applyTransform() {
    image.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`;
    frame.classList.toggle('is-zoomed', scale > MIN_SCALE + 0.01);
    if (zoomValue) zoomValue.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetZoom() {
    scale = MIN_SCALE;
    offsetX = 0;
    offsetY = 0;
    applyTransform();
  }

  function setZoom(nextScale, clientX, clientY) {
    const target = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    if (Math.abs(target - scale) < 0.001) return;
    const rect = frame.getBoundingClientRect();
    const pointX = clientX - (rect.left + rect.width / 2);
    const pointY = clientY - (rect.top + rect.height / 2);
    const ratio = target / scale;
    offsetX = pointX - (pointX - offsetX) * ratio;
    offsetY = pointY - (pointY - offsetY) * ratio;
    scale = target;
    clampOffsets();
    applyTransform();
  }

  function zoomAtCenter(factor) {
    const rect = frame.getBoundingClientRect();
    setZoom(scale * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function toggleZoom(clientX, clientY) {
    if (scale > MIN_SCALE + 0.01) resetZoom();
    else setZoom(2.5, clientX, clientY);
  }

  function preload(nextIndex) {
    const photo = photos[(nextIndex + photos.length) % photos.length];
    if (!photo || preloaded.has(photo.file)) return;
    preloaded.add(photo.file);
    const loader = new Image();
    loader.src = photo.file;
  }

  function select(nextIndex, { updateHash = true } = {}) {
    index = ((nextIndex % photos.length) + photos.length) % photos.length;
    const photo = photos[index];
    image.width = photo.width;
    image.height = photo.height;
    image.alt = photo.alt;
    image.src = photo.file;
    counter.textContent = `${index + 1} / ${photos.length}`;
    thumbs.forEach((thumb, thumbIndex) => thumb.setAttribute('aria-current', String(thumbIndex === index)));
    resetZoom();
    if (updateHash) window.history.replaceState(null, '', `#photo-${index + 1}`);
    preload(index + 1);
    preload(index - 1);
  }

  previousButton?.addEventListener('click', () => select(index - 1));
  nextButton?.addEventListener('click', () => select(index + 1));
  zoomInButton?.addEventListener('click', () => zoomAtCenter(1.5));
  zoomOutButton?.addEventListener('click', () => zoomAtCenter(1 / 1.5));
  zoomResetButton?.addEventListener('click', resetZoom);

  thumbs.forEach((thumb, thumbIndex) => {
    thumb.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (thumbIndex !== index) select(thumbIndex);
    });
  });

  image.addEventListener('load', () => {
    clampOffsets();
    applyTransform();
  });

  window.addEventListener('resize', () => {
    clampOffsets();
    applyTransform();
  });

  window.addEventListener('hashchange', () => {
    const next = Number((window.location.hash.match(/photo-(\d+)/) || [])[1]);
    if (Number.isInteger(next) && next > 0 && next - 1 !== index) select(next - 1, { updateHash: false });
  });

  stage.addEventListener('wheel', (event) => {
    if (!(event.ctrlKey || event.metaKey || scale > MIN_SCALE + 0.01)) return;
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.002);
    setZoom(scale * factor, event.clientX, event.clientY);
  }, { passive: false });

  frame.addEventListener('dblclick', (event) => {
    if (isControl(event.target)) return;
    if (performance.now() - lastTouchAt < 700) return;
    toggleZoom(event.clientX, event.clientY);
  });

  frame.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (isControl(event.target)) return;
    frame.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      dragState = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        baseX: offsetX,
        baseY: offsetY,
        moved: false,
        startedAt: performance.now()
      };
    } else if (pointers.size === 2) {
      dragState = null;
      const [first, second] = [...pointers.values()];
      pinchState = {
        distance: Math.hypot(first.x - second.x, first.y - second.y) || 1,
        scale,
        midX: (first.x + second.x) / 2,
        midY: (first.y + second.y) / 2
      };
    }
  });

  frame.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchState && pointers.size >= 2) {
      const [first, second] = [...pointers.values()];
      const distance = Math.hypot(first.x - second.x, first.y - second.y) || 1;
      const midX = (first.x + second.x) / 2;
      const midY = (first.y + second.y) / 2;
      setZoom(pinchState.scale * distance / pinchState.distance, midX, midY);
      offsetX += midX - pinchState.midX;
      offsetY += midY - pinchState.midY;
      pinchState.midX = midX;
      pinchState.midY = midY;
      clampOffsets();
      applyTransform();
      return;
    }
    if (!dragState || event.pointerId !== dragState.id) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) dragState.moved = true;
    if (scale > MIN_SCALE + 0.01) {
      offsetX = dragState.baseX + deltaX;
      offsetY = dragState.baseY + deltaY;
      clampOffsets();
      frame.classList.add('is-dragging');
      applyTransform();
    }
  });

  function endPointer(event) {
    const point = pointers.get(event.pointerId);
    if (!point) return;
    const wasDrag = dragState && dragState.id === event.pointerId;
    const drag = wasDrag ? dragState : null;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchState = null;
    if (!wasDrag) {
      if (!pointers.size) dragState = null;
      return;
    }
    dragState = null;
    frame.classList.remove('is-dragging');
    if (scale <= MIN_SCALE + 0.01 && drag) {
      const deltaX = point.x - drag.startX;
      const deltaY = point.y - drag.startY;
      if (Math.abs(deltaX) > 46 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        select(deltaX < 0 ? index + 1 : index - 1);
        return;
      }
    }
    if (event.pointerType === 'touch' && drag && !drag.moved && performance.now() - drag.startedAt < 280) {
      lastTouchAt = performance.now();
      const now = performance.now();
      if (now - lastTap < 340 && Math.hypot(point.x - lastTapX, point.y - lastTapY) < 36) {
        toggleZoom(point.x, point.y);
        lastTap = 0;
      } else {
        lastTap = now;
        lastTapX = point.x;
        lastTapY = point.y;
      }
    }
  }

  frame.addEventListener('pointerup', endPointer);
  frame.addEventListener('pointercancel', (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchState = null;
    if (!pointers.size) {
      dragState = null;
      frame.classList.remove('is-dragging');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]'))) return;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        select(index - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        select(index + 1);
        break;
      case 'Home':
        event.preventDefault();
        select(0);
        break;
      case 'End':
        event.preventDefault();
        select(photos.length - 1);
        break;
      case '+':
      case '=':
        event.preventDefault();
        zoomAtCenter(1.5);
        break;
      case '-':
      case '_':
        event.preventDefault();
        zoomAtCenter(1 / 1.5);
        break;
      case '0':
        event.preventDefault();
        resetZoom();
        break;
      case 'Escape':
        if (scale > MIN_SCALE + 0.01) {
          event.preventDefault();
          resetZoom();
        } else if (backLink) {
          window.location.href = backLink.href;
        }
        break;
      default:
        break;
    }
  });

  if (index > 0) select(index, { updateHash: false });
  else {
    counter.textContent = `1 / ${photos.length}`;
    preload(1);
    preload(photos.length - 1);
  }
  applyTransform();
})();
