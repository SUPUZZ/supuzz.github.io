// Puzzle Online — browser jigsaw for supuzz.com.
// Game content (picture collections) comes from the admin API; the built-in
// fallback keeps the page playable when the API is unreachable.
(() => {
  'use strict';

  const app = document.getElementById('puzzleApp');
  if (!app) return;

  const $ = id => document.getElementById(id);
  const messagesEl = $('pzMessages');
  const messages = messagesEl ? JSON.parse(messagesEl.textContent) : { setup: {}, game: {} };
  // Local preview uses the local API automatically; ?api=... overrides it.
  const apiOverride = new URLSearchParams(window.location.search).get('api');
  const isLocalHost = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/.test(window.location.hostname);
  const defaultApiBase = isLocalHost ? `http://${window.location.hostname}:8080` : (app.dataset.apiBase || 'https://api.supuzz.cn');
  const API_BASE = ((apiOverride && /^https?:\/\//i.test(apiOverride)) ? apiOverride : defaultApiBase).replace(/\/+$/, '');
  const SITE_ORIGIN = window.location.origin;
  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Resolve site-relative picture paths against supuzz.com, keep absolute URLs.
  function resolveUrl(url) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || /^blob:|^data:/i.test(url)) return url;
    if (url.startsWith('/')) return SITE_ORIGIN + url;
    return url;
  }

  function t(path, vars = {}) {
    let value = path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), messages);
    if (typeof value !== 'string') value = '';
    return value.replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? String(vars[key]) : match));
  }

  // Built-in collections: same themes as the backend seed, using pictures that
  // already ship with the site. Replaced automatically by the admin collections.
  // Fixed copy of the collections currently configured in the admin backend
  // (GET api.supuzz.cn/api/puzzle/collections). Used only when the API is
  // unreachable and nothing is cached yet. Keep in sync with the backend.
  const FALLBACK_COLLECTIONS = [
    {
      id: 'fallback-snow',
      title: 'Snow Garden & Winter Garden',
      description: 'Snow garden stacking toy and winter garden stacking set scenes with penguins, Arctic animals and icy bricks.',
      images: [
        {
          id: 'snow-0',
          url: '/product-images/snow-garden-puzzle-main.webp',
          alt: 'Snow garden stacking toy with penguins, a snowman and Arctic animals'
        }
      ]
    }
  ];

  // ================= Setup state =================
  let collections = [];
  let selectedImage = null;
  let selectedButton = null;
  let difficulty = 4;
  let starting = false;
  let photoObjectUrl = null;

  function showError(message) {
    const box = $('pzError');
    if (!box) return;
    clearTimeout(showError.timer);
    if (!message) {
      box.textContent = '';
      box.hidden = true;
      return;
    }
    box.textContent = message;
    box.hidden = false;
    showError.timer = setTimeout(() => { box.hidden = true; }, 6000);
  }

  // Stable hash used when an older backend does not send a version yet, so the
  // "same data -> no re-render" rule still works during a rollout.
  function contentVersion(list) {
    const text = JSON.stringify(list);
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return 'h' + (hash >>> 0).toString(16);
  }

  function normalizeCollections(payload) {
    if (!payload || !Array.isArray(payload.collections)) return { version: '', collections: [] };
    const version = typeof payload.version === 'string' ? payload.version : '';
    const collections = payload.collections.map(collection => {
      const images = Array.isArray(collection.images) ? collection.images : [];
      return {
        id: String(collection.id || collection.title || Math.random()),
        title: String(collection.title || ''),
        description: typeof collection.description === 'string' ? collection.description : '',
        images: images
          .filter(image => image && typeof image.url === 'string' && image.url.trim())
          .map((image, index) => ({
            id: String(image.id || index),
            url: image.url.trim(),
            alt: typeof image.alt === 'string' && image.alt.trim() ? image.alt : String(collection.title || '')
          }))
      };
    }).filter(collection => collection.title && collection.images.length);
    return { version: version || contentVersion(collections), collections };
  }

  function renderCollections(list, { keepSelection = false } = {}) {
    collections = list;
    const box = $('pzCollections');
    box.innerHTML = '';

    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'pz-loading';
      empty.textContent = t('setup.empty');
      box.appendChild(empty);
      return;
    }

    let firstSelectable = null;
    list.forEach((collection, collectionIndex) => {
      const section = document.createElement('section');
      section.className = 'pz-collection';

      const head = document.createElement('div');
      head.className = 'pz-collection-head';
      const title = document.createElement('h3');
      title.textContent = collection.title;
      head.appendChild(title);
      section.appendChild(head);

      const thumbs = document.createElement('div');
      thumbs.className = 'pz-thumbs';
      collection.images.forEach((image, imageIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pz-thumb';
        button.dataset.key = `${collection.id}:${image.id}`;
        button.setAttribute('aria-label', t('setup.chooseThis', { alt: image.alt || collection.title }));
        button.setAttribute('aria-pressed', 'false');

        const img = document.createElement('img');
        img.src = resolveUrl(image.url);
        img.alt = image.alt || collection.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', () => { button.hidden = true; });
        button.appendChild(img);

        button.addEventListener('click', () => {
          selectImage({ ...image, collectionId: collection.id, collectionTitle: collection.title }, button);
        });

        thumbs.appendChild(button);
        if (!firstSelectable) firstSelectable = { collection, image, button, index: collectionIndex + imageIndex };
      });
      section.appendChild(thumbs);
      box.appendChild(section);
    });

    if (keepSelection && selectedImage) {
      const match = box.querySelector(`.pz-thumb[data-key="${cssEscape(selectedImage.collectionId + ':' + selectedImage.id)}"]`);
      if (match) {
        selectImage(selectedImage, match);
        return;
      }
    }
    if (selectedButton && document.contains(selectedButton)) return;
    if (firstSelectable) selectImage({ ...firstSelectable.image, collectionId: firstSelectable.collection.id, collectionTitle: firstSelectable.collection.title }, firstSelectable.button);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function selectImage(image, button) {
    selectedImage = image;
    if (selectedButton) {
      selectedButton.classList.remove('is-selected');
      selectedButton.setAttribute('aria-pressed', 'false');
    }
    selectedButton = button;
    if (selectedButton) {
      selectedButton.classList.add('is-selected');
      selectedButton.setAttribute('aria-pressed', 'true');
    }
    setStartButtonsDisabled(false);
    if ($('pzError')) $('pzError').hidden = true;
  }

  function showSourceNote(text) {
    const note = $('pzSource');
    if (!note) return;
    if (text) {
      note.textContent = text;
      note.hidden = false;
    } else {
      note.hidden = true;
    }
  }

  // The site caches the last collection list together with the backend version.
  // Same version -> keep the rendered grid untouched (no flicker, no image reloads);
  // new version -> replace it. The cache also lets repeat visitors skip the wait.
  const COLLECTIONS_CACHE_KEY = 'pz.collections.v1';

  function readCollectionsCache() {
    try {
      const raw = localStorage.getItem(COLLECTIONS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.version !== 'string' || !Array.isArray(parsed.collections)) return null;
      return parsed.collections.length ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function writeCollectionsCache(version, list) {
    try {
      localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify({ version: version || '', collections: list }));
    } catch (error) {
      // Storage may be full or disabled; caching is optional.
    }
  }

  async function loadCollections() {
    const cached = readCollectionsCache();
    let renderedVersion = '';
    if (cached) {
      renderCollections(cached.collections);
      renderedVersion = cached.version;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    let payload = null;
    try {
      const response = await fetch(`${API_BASE}/api/puzzle/collections`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      payload = normalizeCollections(await response.json());
    } catch (error) {
      payload = null;
    } finally {
      clearTimeout(timeout);
    }

    if (gameActive) return;

    if (!payload || !payload.collections.length) {
      // Nothing usable from the backend: keep the cached copy if we have one,
      // otherwise fall back to the built-in snapshot.
      if (!renderedVersion) {
        renderCollections(FALLBACK_COLLECTIONS);
        showSourceNote(t('setup.fallbackNote'));
      }
      return;
    }

    const version = payload.version || '';
    if (renderedVersion && version && version === renderedVersion) {
      // Backend data did not change: leave the already rendered grid alone.
      return;
    }

    if (selectedImage && selectedImage.collectionId === 'user-photo') {
      // A photo was picked while the request was in flight: keep it selected but
      // refresh the library so the next upload still lists the real collections.
      collections = payload.collections;
      writeCollectionsCache(version, payload.collections);
      return;
    }

    renderCollections(payload.collections, { keepSelection: true });
    writeCollectionsCache(version, payload.collections);
    showSourceNote('');
  }

  // ================= Upload a photo =================
  function bindUpload() {
    const uploadButton = $('pzUploadBtn');
    const input = $('pzUpload');
    if (!uploadButton || !input) return;

    uploadButton.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        showError(t('setup.uploadFailed'));
        return;
      }
      const url = URL.createObjectURL(file);
      loadPictureCanvas(url).then(() => {
        if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
        photoObjectUrl = url;
        const photoCollection = {
          id: 'user-photo',
          title: t('setup.yourPhotoTitle'),
          description: '',
          images: [{ id: 'photo', url, alt: t('setup.yourPhotoTitle') }]
        };
        const rest = collections.filter(collection => collection.id !== 'user-photo');
        renderCollections([photoCollection, ...rest]);
        const button = document.querySelector('.pz-thumb[data-key="user-photo:photo"]');
        if (button) button.click();
      }).catch(() => {
        URL.revokeObjectURL(url);
        showError(t('setup.uploadFailed'));
      });
    });
  }

  // ================= Difficulty =================
  function bindDifficulty() {
    const options = document.querySelectorAll('.pz-diff');
    options.forEach(button => {
      button.addEventListener('click', () => {
        difficulty = Number.parseInt(button.dataset.size, 10) || 4;
        options.forEach(item => item.setAttribute('aria-pressed', item === button ? 'true' : 'false'));
      });
    });
  }

  // ================= Game state =================
  const setupPanel = $('pzSetup');
  const stage = $('pzStage');
  const workspace = $('pzWorkspace');
  const layer = $('pzLayer');

  let srcCanvas = null;
  let LAYER_W = 0;
  let LAYER_H = 0;
  let N = 4;
  let P = 0;
  let MARGIN = 0;
  let SIZE = 0;
  let full = 0;
  let OX = 0;
  let OY = 0;
  let viewScale = 1;
  // Pieces are rasterised at the device pixel ratio, otherwise every tile is
  // upscaled by the browser on retina screens and looks soft.
  let DPR = 1;
  const MEMORY_SECONDS = 5;
  let memoryActive = false;
  let memoryTimer = 0;
  let memoryResolve = null;

  let edgeSigns = null;
  let picture = null;
  let templates = [];
  let pieces = [];
  let groups = [];
  let steps = 0;
  let seconds = 0;
  let timerId = null;
  let started = false;
  let zTop = 10;
  let animating = false;
  let introRAF = 0;
  let shuffleRAF = 0;
  let introTimer = 0;
  let won = false;
  let gameActive = false;

  function setStartButtonsDisabled(disabled) {
    ['pzStart', 'pzStartFull'].forEach(id => {
      const button = $(id);
      if (button) button.disabled = disabled;
    });
  }

  function isNarrowScreen() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  // Immersive mode puts only the game on screen: the stage fills the viewport and
  // the page behind it cannot scroll, which is what makes dragging work on phones.
  // The system back gesture inside the fullscreen game should close the game
  // layer and stay on Puzzle Online, not walk back to whatever page came before.
  // One history entry is pushed when fullscreen opens and consumed when it closes.
  let ignoreNextPop = false;

  function setImmersive(on) {
    if (on === document.body.classList.contains('pz-immersive')) return;
    document.body.classList.toggle('pz-immersive', on);
    const button = $('pzFull');
    if (button) {
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.textContent = t(on ? 'game.exitFullscreen' : 'game.fullscreen');
    }
    if (on) {
      try {
        history.pushState({ pzImmersive: true }, '');
      } catch (error) {
        // History is not essential to playing; ignore private-mode failures.
      }
    } else if (history.state && history.state.pzImmersive) {
      ignoreNextPop = true;
      history.back();
    }
    if (gameActive) {
      requestAnimationFrame(() => requestAnimationFrame(fitLayer));
    }
  }

  window.addEventListener('popstate', () => {
    if (ignoreNextPop) {
      ignoreNextPop = false;
      return;
    }
    if (document.body.classList.contains('pz-immersive')) setImmersive(false);
  });

  function setHudCollapsed(collapsed) {
    const hud = $('pzHud');
    const toggle = $('pzHudToggle');
    if (!hud || !toggle) return;
    hud.classList.toggle('is-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (gameActive) {
      requestAnimationFrame(() => requestAnimationFrame(fitLayer));
    }
  }

  function startGame(options = {}) {
    if (!selectedImage || starting) return;
    starting = true;
    setStartButtonsDisabled(true);
    showError('');
    if (options.immersive) setImmersive(true);
    loadPictureCanvas(selectedImage.url).then(canvas => {
      srcCanvas = canvas;
      enterStage();
    }).catch(() => {
      showError(t('game.imageError'));
    }).finally(() => {
      starting = false;
      if (!gameActive && selectedImage) setStartButtonsDisabled(false);
    });
  }

  function enterStage() {
    gameActive = true;
    setupPanel.hidden = true;
    stage.hidden = false;
    app.classList.add('is-playing');
    if (isNarrowScreen()) {
      setImmersive(true);
      setHudCollapsed(true);
    }
    $('pzRef').src = resolveUrl(selectedImage.url);
    $('pzRef').alt = selectedImage.alt || '';
    $('pzRefWrap').classList.remove('hide');
    $('pzWin').classList.remove('show');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          app.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'start' });
        } catch (error) {
          app.scrollIntoView();
        }
        LAYER_W = 0;
        buildBoard();
        resetRoundState();
        layoutCorrect();
        fitLayer();
        runIntro();
      });
    });
  }

  // ================= Fixed piece shapes =================
  function tabEdge(path, ax, ay, bx, by, nx, ny, sign) {
    if (sign === 0) {
      path.lineTo(bx, by);
      return;
    }
    const ux = bx - ax;
    const uy = by - ay;
    const length = Math.hypot(ux, uy);
    const depth = length * 0.2;
    const point = (fraction, offset) => [
      ax + ux * fraction + nx * sign * depth * offset,
      ay + uy * fraction + ny * sign * depth * offset
    ];
    path.lineTo(...point(0.34, 0));
    path.bezierCurveTo(...point(0.36, 0), ...point(0.36, 0.12), ...point(0.36, 0.3));
    path.bezierCurveTo(...point(0.36, 0.69), ...point(0.42, 1), ...point(0.5, 1));
    path.bezierCurveTo(...point(0.58, 1), ...point(0.64, 0.69), ...point(0.64, 0.3));
    path.bezierCurveTo(...point(0.64, 0.12), ...point(0.64, 0), ...point(0.66, 0));
    path.lineTo(bx, by);
  }

  function piecePath(path, size, margin, top, right, bottom, left) {
    path.moveTo(margin, margin);
    tabEdge(path, margin, margin, margin + size, margin, 0, -1, top);
    tabEdge(path, margin + size, margin, margin + size, margin + size, 1, 0, right);
    tabEdge(path, margin + size, margin + size, margin, margin + size, 0, 1, bottom);
    tabEdge(path, margin, margin + size, margin, margin, -1, 0, left);
    path.closePath();
  }

  // Sit the board a little above the middle so the bottom edge (shuffle button,
  // reference thumbnail, result bar) has room.
  function verticalOffset(layerHeight, boardSize) {
    const factor = document.body.classList.contains('pz-immersive') ? 0.4 : 0.45;
    return Math.round((layerHeight - boardSize) * factor);
  }

  function buildBoard() {
    N = difficulty;
    const rect = workspace.getBoundingClientRect();
    if (!LAYER_W || !rect.width || Math.abs(rect.width - LAYER_W) > LAYER_W * 0.15) {
      LAYER_W = Math.max(320, Math.round(rect.width));
      LAYER_H = Math.max(360, Math.round(rect.height));
    }
    layer.style.width = LAYER_W + 'px';
    layer.style.height = LAYER_H + 'px';
    layer.style.transform = 'none';
    layer.style.left = '0px';
    layer.style.top = '0px';
    viewScale = 1;

    const immersive = document.body.classList.contains('pz-immersive');
    const widthFactor = immersive ? 0.9 : 0.82;
    const heightFactor = immersive ? 0.84 : 0.8;
    const maxBoard = immersive ? 860 : 680;
    const target = Math.min(Math.floor(Math.min(LAYER_W * widthFactor, LAYER_H * heightFactor)), maxBoard);
    P = Math.max(26, Math.floor(target / N));
    full = P * N;
    MARGIN = Math.max(6, Math.round(P * 0.26));
    SIZE = P + MARGIN * 2;
    OX = Math.round((LAYER_W - full) / 2);
    OY = verticalOffset(LAYER_H, full);
    // Render at up to the screen's pixel ratio, but never above the detail the
    // source picture can actually provide (small uploads stay at 1x).
    const nativeScale = srcCanvas ? srcCanvas.width / (full + MARGIN * 2) : 2;
    DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 3, Math.round(nativeScale)));

    // Canvas space works in device pixels; layout stays in CSS pixels.
    const PPX = P * DPR;
    const MPX = MARGIN * DPR;
    const FPX = full * DPR;

    layer.querySelectorAll('.pz-piece').forEach(element => element.remove());
    pieces = [];
    templates = [];

    const hint = $('pzTarget');
    hint.style.left = OX + 'px';
    hint.style.top = OY + 'px';
    hint.style.width = full + 'px';
    hint.style.height = full + 'px';
    const hintCanvas = hint.querySelector('canvas');
    hintCanvas.width = FPX;
    hintCanvas.height = FPX;
    const hintContext = hintCanvas.getContext('2d');
    hintContext.strokeStyle = 'rgba(28,27,31,.10)';
    hintContext.lineWidth = DPR;
    for (let index = 1; index < N; index += 1) {
      hintContext.beginPath();
      hintContext.moveTo(index * PPX, 0);
      hintContext.lineTo(index * PPX, FPX);
      hintContext.stroke();
      hintContext.beginPath();
      hintContext.moveTo(0, index * PPX);
      hintContext.lineTo(FPX, index * PPX);
      hintContext.stroke();
    }

    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = FPX;
    const tmpContext = tmp.getContext('2d');
    tmpContext.imageSmoothingQuality = 'high';
    tmpContext.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, 0, 0, FPX, FPX);

    const padded = FPX + MPX * 2;
    picture = document.createElement('canvas');
    picture.width = picture.height = padded;
    const pictureContext = picture.getContext('2d');
    pictureContext.drawImage(tmp, 0, 0, FPX, 1, MPX, 0, FPX, MPX);
    pictureContext.drawImage(tmp, 0, FPX - 1, FPX, 1, MPX, MPX + FPX, FPX, MPX);
    pictureContext.drawImage(tmp, 0, 0, 1, FPX, 0, MPX, MPX, FPX);
    pictureContext.drawImage(tmp, FPX - 1, 0, 1, FPX, MPX + FPX, MPX, MPX, FPX);
    pictureContext.drawImage(tmp, 0, 0, 1, 1, 0, 0, MPX, MPX);
    pictureContext.drawImage(tmp, FPX - 1, 0, 1, 1, MPX + FPX, 0, MPX, MPX);
    pictureContext.drawImage(tmp, 0, FPX - 1, 1, 1, 0, MPX + FPX, MPX, MPX);
    pictureContext.drawImage(tmp, FPX - 1, FPX - 1, 1, 1, MPX + FPX, MPX + FPX, MPX, MPX);
    pictureContext.drawImage(tmp, MPX, MPX);

    const verticalEdges = [];
    const horizontalEdges = [];
    for (let row = 0; row < N; row += 1) {
      verticalEdges[row] = [];
      for (let column = 1; column < N; column += 1) verticalEdges[row][column] = Math.random() < 0.5 ? 1 : -1;
    }
    for (let row = 1; row < N; row += 1) {
      horizontalEdges[row] = [];
      for (let column = 0; column < N; column += 1) horizontalEdges[row][column] = Math.random() < 0.5 ? 1 : -1;
    }
    edgeSigns = { verticalEdges, horizontalEdges };

    for (let row = 0; row < N; row += 1) {
      for (let column = 0; column < N; column += 1) {
        const top = row === 0 ? 0 : -horizontalEdges[row][column];
        const bottom = row === N - 1 ? 0 : horizontalEdges[row + 1][column];
        const left = column === 0 ? 0 : -verticalEdges[row][column];
        const right = column === N - 1 ? 0 : verticalEdges[row][column + 1];

        const pieceCanvas = renderPiece(column, row, top, right, bottom, left);
        templates.push(pieceCanvas);

        const element = document.createElement('div');
        element.className = 'pz-piece';
        element.style.width = SIZE + 'px';
        element.style.height = SIZE + 'px';
        element.appendChild(pieceCanvas);
        layer.appendChild(element);

        const piece = { row, column, x: 0, y: 0, el: element, grp: row * N + column };
        pieces.push(piece);
        bindDrag(piece);
      }
    }
  }

  function renderPiece(column, row, top, right, bottom, left) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.round(SIZE * DPR);
    canvas.style.width = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    const context = canvas.getContext('2d');
    const path = new Path2D();
    piecePath(path, P * DPR, MARGIN * DPR, top, right, bottom, left);
    context.save();
    context.strokeStyle = '#000';
    context.lineWidth = 2 * DPR;
    context.lineJoin = 'round';
    context.stroke(path);
    context.fill(path);
    context.globalCompositeOperation = 'source-in';
    context.drawImage(picture, -column * P * DPR, -row * P * DPR);
    context.restore();
    return canvas;
  }

  function resetRoundState() {
    groups = [];
    pieces.forEach((piece, index) => {
      piece.grp = index;
      groups[index] = new Set([piece]);
      piece.el.style.transform = '';
      piece.el.classList.remove('cutpop', 'joined', 'dragging');
    });
    steps = 0;
    seconds = 0;
    started = false;
    won = false;
    stopTimer();
    $('pzTime').textContent = '00:00';
    $('pzMoves').textContent = '0';
    $('pzGroups').textContent = N * N;
    $('pzWin').classList.remove('show');
    $('pzDone').hidden = true;
    app.classList.remove('is-done');
  }

  function layoutCorrect() {
    pieces.forEach(piece => {
      piece.x = OX + piece.column * P;
      piece.y = OY + piece.row * P;
      piece.el.style.zIndex = 10;
      place(piece);
    });
  }

  function place(piece) {
    piece.el.style.left = Math.round(piece.x - MARGIN) + 'px';
    piece.el.style.top = Math.round(piece.y - MARGIN) + 'px';
  }

  // ================= Intro: memorise, cut lines, then shuffle =================
  // The complete picture is held on screen before it is cut, so the player has a
  // chance to remember it instead of watching it disappear in a fast animation.
  function showMemoryPhase(seconds) {
    return new Promise(resolve => {
      const tip = $('pzTip');
      const skip = $('pzSkip');
      memoryActive = true;
      memoryResolve = resolve;
      let remaining = seconds;
      tip.classList.add('memory');
      tip.style.opacity = '1';
      skip.textContent = t('game.memorizeGo');
      skip.classList.add('show');
      const tick = () => {
        if (!memoryActive) return;
        if (remaining <= 0) {
          endMemory();
          return;
        }
        tip.textContent = t('game.memorizeCount', { n: remaining });
        remaining -= 1;
        memoryTimer = setTimeout(tick, 1000);
      };
      tick();
    });
  }

  function endMemory() {
    if (!memoryActive) return;
    memoryActive = false;
    clearTimeout(memoryTimer);
    $('pzTip').classList.remove('memory');
    const resolve = memoryResolve;
    memoryResolve = null;
    if (resolve) resolve();
  }

  async function runIntro() {
    cancelAnimationFrame(introRAF);
    cancelAnimationFrame(shuffleRAF);
    clearTimeout(introTimer);
    animating = true;

    const cutStage = $('pzCutStage');
    const tip = $('pzTip');
    const skip = $('pzSkip');
    cutStage.classList.remove('fade');
    cutStage.style.left = OX + 'px';
    cutStage.style.top = OY + 'px';
    cutStage.style.width = full + 'px';
    cutStage.style.height = full + 'px';
    cutStage.style.display = 'block';
    tip.style.opacity = '1';
    skip.classList.add('show');

    $('pzGather').hidden = true;

    const cutPicture = $('pzCutPic');
    const cutGrid = $('pzCutGrid');
    const cutSize = Math.round(full * DPR);
    cutPicture.width = cutGrid.width = cutSize;
    cutPicture.height = cutGrid.height = cutSize;
    cutPicture.style.width = cutPicture.style.height = full + 'px';
    cutGrid.style.width = cutGrid.style.height = full + 'px';
    cutPicture.getContext('2d').drawImage(picture, -MARGIN * DPR, -MARGIN * DPR);
    const gridContext = cutGrid.getContext('2d');

    await showMemoryPhase(MEMORY_SECONDS);
    if (!gameActive || !animating) return;
    skip.textContent = t('game.skip');

    if (REDUCE_MOTION) {
      skipIntro();
      return;
    }

    tip.textContent = t('game.cutting', { n: N, total: N * N });

    const lines = [];
    for (let column = 1; column < N; column += 1) lines.push({ vertical: true, at: column * P * DPR });
    for (let row = 1; row < N; row += 1) lines.push({ vertical: false, at: row * P * DPR });

    const duration = 900;
    const startedAt = performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      gridContext.clearRect(0, 0, cutSize, cutSize);
      gridContext.strokeStyle = 'rgba(28,27,31,.9)';
      gridContext.lineWidth = Math.max(2, full / 260) * DPR;
      gridContext.shadowColor = 'rgba(254,221,0,.95)';
      gridContext.shadowBlur = 10 * DPR;
      lines.forEach((line, index) => {
        const start = (index / lines.length) * 0.62;
        const lineProgress = Math.max(0, Math.min(1, (progress - start) / 0.38));
        if (lineProgress <= 0) return;
        gridContext.beginPath();
        if (line.vertical) {
          gridContext.moveTo(line.at, 0);
          gridContext.lineTo(line.at, cutSize * lineProgress);
        } else {
          gridContext.moveTo(0, line.at);
          gridContext.lineTo(cutSize * lineProgress, line.at);
        }
        gridContext.stroke();
      });
      if (progress < 1) {
        introRAF = requestAnimationFrame(frame);
        return;
      }

      tip.textContent = t('game.cutDone', { total: N * N });
      cutStage.classList.add('fade');
      pieces.forEach((piece, index) => {
        piece.el.style.animationDelay = index * 12 + 'ms';
        piece.el.classList.add('cutpop');
      });
      introTimer = setTimeout(() => {
        cutStage.style.display = 'none';
        pieces.forEach(piece => piece.el.classList.remove('cutpop'));
        shuffleAnimation();
      }, 520);
    }
    introRAF = requestAnimationFrame(frame);
  }

  function scatterTargets() {
    const slots = [];
    const cellWidth = LAYER_W / N;
    const cellHeight = LAYER_H / N;
    for (let row = 0; row < N; row += 1) {
      for (let column = 0; column < N; column += 1) {
        slots.push({
          x: column * cellWidth + (cellWidth - P) / 2 + (Math.random() - 0.5) * cellWidth * 0.22,
          y: row * cellHeight + (cellHeight - P) / 2 + (Math.random() - 0.5) * cellHeight * 0.22
        });
      }
    }
    for (let index = slots.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [slots[index], slots[swap]] = [slots[swap], slots[index]];
    }
    const minX = MARGIN + 12;
    const maxX = LAYER_W - P - MARGIN - 12;
    const minY = MARGIN + 12;
    const maxY = LAYER_H - P - MARGIN - 12;
    return slots.map(slot => ({
      x: Math.round(Math.max(minX, Math.min(maxX, slot.x))),
      y: Math.round(Math.max(minY, Math.min(maxY, slot.y)))
    }));
  }

  // Spread: a full reshuffle - every piece is pulled out of its group and
  // scattered across the whole area again (same as a fresh round, timer resets).
  function pileTargets(count) {
    const spread = Math.min(P * 0.5, 72);
    const baseX = 14 + MARGIN;
    // Keep the heap above the pile tool in the bottom-left corner.
    const baseY = LAYER_H - 104 - P - MARGIN;
    return Array.from({ length: count }, () => {
      const x = baseX + Math.random() * spread;
      const y = baseY - Math.random() * spread * 0.9;
      return {
        x: Math.round(Math.max(MARGIN + 4, Math.min(LAYER_W - P - MARGIN - 4, x))),
        y: Math.round(Math.max(MARGIN + 4, Math.min(LAYER_H - P - MARGIN - 4, y)))
      };
    });
  }

  function shuffleAnimation() {
    cancelAnimationFrame(shuffleRAF);
    animating = true;
    const targets = scatterTargets();
    const animations = pieces.map((piece, index) => ({
      piece,
      fromX: piece.x,
      fromY: piece.y,
      toX: targets[index].x,
      toY: targets[index].y,
      delay: Math.random() * 220,
      rotation: (Math.random() - 0.5) * 40,
      z: 10 + Math.floor(Math.random() * 40)
    }));
    const duration = REDUCE_MOTION ? 0 : 780;
    const startedAt = performance.now();
    $('pzTip').style.opacity = '1';
    $('pzTip').textContent = t('game.shuffling');

    function frame(now) {
      const elapsed = now - startedAt;
      let done = true;
      animations.forEach(animation => {
        const progress = Math.max(0, Math.min(1, (elapsed - animation.delay) / duration));
        if (progress < 1) done = false;
        const eased = 1 - Math.pow(1 - progress, 3);
        const swing = Math.sin(progress * Math.PI);
        animation.piece.x = animation.fromX + (animation.toX - animation.fromX) * eased;
        animation.piece.y = animation.fromY + (animation.toY - animation.fromY) * eased;
        animation.piece.el.style.zIndex = animation.z;
        animation.piece.el.style.transform = `rotate(${animation.rotation * swing}deg) scale(${1 - 0.1 * swing})`;
        place(animation.piece);
      });
      if (!done) {
        shuffleRAF = requestAnimationFrame(frame);
        return;
      }
      animations.forEach(animation => {
        animation.piece.x = animation.toX;
        animation.piece.y = animation.toY;
        animation.piece.el.style.transform = '';
        place(animation.piece);
      });
      finishIntro();
    }

    if (REDUCE_MOTION) {
      animations.forEach(animation => {
        animation.piece.x = animation.toX;
        animation.piece.y = animation.toY;
        place(animation.piece);
      });
      finishIntro();
      return;
    }
    shuffleRAF = requestAnimationFrame(frame);
  }

  // Pile up: a tidy tool, not a reshuffle. Only loose single pieces are collected
  // into the bottom-left heap; anything already joined together stays where it is.
  function gatherLoosePieces() {
    if (animating || won) return;
    const loose = pieces.filter(piece => groups[piece.grp] && groups[piece.grp].size === 1);
    if (!loose.length) return;
    // Keep assembled units in front of the heap so it never hides finished work.
    groups.forEach(group => {
      if (group && group.size > 1) group.forEach(piece => { piece.el.style.zIndex = 200; });
    });
    cancelAnimationFrame(shuffleRAF);
    animating = true;
    const targets = pileTargets(loose.length);
    const list = loose.map((piece, index) => ({
      piece,
      fromX: piece.x,
      fromY: piece.y,
      toX: targets[index].x,
      toY: targets[index].y,
      delay: Math.random() * 160,
      rotation: (Math.random() - 0.5) * 14,
      z: 10 + Math.floor(Math.random() * 40)
    }));
    const duration = REDUCE_MOTION ? 0 : 620;
    const startedAt = performance.now();

    function settle() {
      list.forEach(item => {
        item.piece.x = item.toX;
        item.piece.y = item.toY;
        item.piece.el.style.transform = `rotate(${item.rotation.toFixed(1)}deg)`;
        place(item.piece);
      });
      animating = false;
    }

    function frame(now) {
      const elapsed = now - startedAt;
      let done = true;
      list.forEach(item => {
        const progress = Math.max(0, Math.min(1, (elapsed - item.delay) / duration));
        if (progress < 1) done = false;
        const eased = 1 - Math.pow(1 - progress, 3);
        item.piece.x = item.fromX + (item.toX - item.fromX) * eased;
        item.piece.y = item.fromY + (item.toY - item.fromY) * eased;
        item.piece.el.style.zIndex = item.z;
        item.piece.el.style.transform = `rotate(${(item.rotation * eased).toFixed(1)}deg)`;
        place(item.piece);
      });
      if (!done) {
        shuffleRAF = requestAnimationFrame(frame);
        return;
      }
      settle();
    }

    if (REDUCE_MOTION) {
      settle();
      return;
    }
    shuffleRAF = requestAnimationFrame(frame);
  }

  function finishIntro() {
    animating = false;
    $('pzGather').hidden = false;
    $('pzSkip').classList.remove('show');
    const tip = $('pzTip');
    tip.textContent = t('game.dragTip');
    setTimeout(() => { tip.style.opacity = '0'; }, 1400);
  }

  function skipIntro() {
    endMemory();
    $('pzSkip').textContent = t('game.skip');
    if (!animating) return;
    cancelAnimationFrame(introRAF);
    cancelAnimationFrame(shuffleRAF);
    clearTimeout(introTimer);
    const cutStage = $('pzCutStage');
    cutStage.classList.add('fade');
    cutStage.style.display = 'none';
    pieces.forEach(piece => piece.el.classList.remove('cutpop'));
    const targets = scatterTargets();
    pieces.forEach((piece, index) => {
      piece.x = targets[index].x;
      piece.y = targets[index].y;
      piece.el.style.transform = '';
      place(piece);
    });
    finishIntro();
  }

  // ================= Drag, snap, merge =================
  function bindDrag(piece) {
    piece.el.addEventListener('pointerdown', event => {
      if (animating || won) return;
      event.preventDefault();
      startTimer();
      const group = groups[piece.grp];
      group.forEach(item => { item.el.style.zIndex = ++zTop; });
      const moving = [...group];
      moving.forEach(item => {
        item.el.classList.add('dragging');
        item.el.style.transform = '';
      });
      piece.el.setPointerCapture(event.pointerId);

      let lastX = event.clientX;
      let lastY = event.clientY;

      const onMove = moveEvent => {
        const dx = (moveEvent.clientX - lastX) / viewScale;
        const dy = (moveEvent.clientY - lastY) / viewScale;
        lastX = moveEvent.clientX;
        lastY = moveEvent.clientY;
        moving.forEach(item => {
          item.x += dx;
          item.y += dy;
          place(item);
        });
      };

      const onUp = () => {
        piece.el.releasePointerCapture?.(event.pointerId);
        piece.el.removeEventListener('pointermove', onMove);
        piece.el.removeEventListener('pointerup', onUp);
        piece.el.removeEventListener('pointercancel', onUp);
        moving.forEach(item => item.el.classList.remove('dragging'));
        steps += 1;
        $('pzMoves').textContent = steps;
        const anchor = moving[0];
        const shiftX = Math.round(anchor.x) - anchor.x;
        const shiftY = Math.round(anchor.y) - anchor.y;
        moving.forEach(item => {
          item.x += shiftX;
          item.y += shiftY;
          place(item);
        });
        trySnap(moving);
      };

      piece.el.addEventListener('pointermove', onMove);
      piece.el.addEventListener('pointerup', onUp);
      piece.el.addEventListener('pointercancel', onUp);
    });
  }

  const tolerance = () => Math.max(20, P * 0.3);

  function snapToGrid(groupId) {
    const group = groups[groupId];
    if (!group || !group.size) return;
    const base = group.values().next().value;
    const baseX = Math.round(base.x);
    const baseY = Math.round(base.y);
    group.forEach(item => {
      item.x = baseX + (item.column - base.column) * P;
      item.y = baseY + (item.row - base.row) * P;
      item.el.style.transform = '';
      place(item);
    });
  }

  function trySnap(startSet) {
    const members = new Set(startSet);
    let merged = true;
    let guard = 0;
    while (merged && guard < 400) {
      guard += 1;
      merged = false;
      for (const piece of [...members]) {
        const candidates = [];
        const left = pieceAt(piece.row, piece.column - 1);
        if (left && left.grp !== piece.grp) candidates.push({ neighbor: left, dx: (left.x + P) - piece.x, dy: left.y - piece.y });
        const right = pieceAt(piece.row, piece.column + 1);
        if (right && right.grp !== piece.grp) candidates.push({ neighbor: right, dx: (right.x - P) - piece.x, dy: right.y - piece.y });
        const top = pieceAt(piece.row - 1, piece.column);
        if (top && top.grp !== piece.grp) candidates.push({ neighbor: top, dx: top.x - piece.x, dy: (top.y + P) - piece.y });
        const bottom = pieceAt(piece.row + 1, piece.column);
        if (bottom && bottom.grp !== piece.grp) candidates.push({ neighbor: bottom, dx: bottom.x - piece.x, dy: (bottom.y - P) - piece.y });

        let best = null;
        let bestDistance = Infinity;
        for (const candidate of candidates) {
          const distance = Math.hypot(candidate.dx, candidate.dy);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
          }
        }
        if (best && bestDistance <= tolerance()) {
          members.forEach(item => {
            item.x += best.dx;
            item.y += best.dy;
          });
          mergeGroups(piece.grp, best.neighbor.grp);
          const group = groups[piece.grp];
          if (group) group.forEach(item => members.add(item));
          snapToGrid(piece.grp);
          merged = true;
          break;
        }
      }
    }
    const groupId = members.values().next().value.grp;
    if (groups[groupId]) {
      snapToGrid(groupId);
      if (groups[groupId].size === N * N) win();
    }
  }

  function pieceAt(row, column) {
    if (row < 0 || column < 0 || row >= N || column >= N) return null;
    return pieces[row * N + column];
  }

  function mergeGroups(groupA, groupB) {
    if (groupA === groupB) return;
    const setA = groups[groupA];
    const setB = groups[groupB];
    const [small, big, smallId, bigId] = setA.size <= setB.size
      ? [setA, setB, groupA, groupB]
      : [setB, setA, groupB, groupA];
    small.forEach(item => {
      item.grp = bigId;
      big.add(item);
    });
    groups[smallId] = null;
    $('pzGroups').textContent = groups.filter(Boolean).length;
    big.forEach(item => {
      item.el.classList.add('joined');
      if (!REDUCE_MOTION) {
        item.el.animate([{ filter: 'brightness(1.35)' }, { filter: 'brightness(1)' }], { duration: 240 });
      }
    });
  }

  function win() {
    if (won) return;
    won = true;
    stopTimer();
    const detail = t('game.winDetail', {
      time: formatTime(seconds),
      moves: steps,
      n: N,
      total: N * N
    });
    $('pzWinDetail').textContent = detail;
    setTimeout(() => {
      $('pzWin').classList.add('show');
      $('pzAgain').focus({ preventScroll: true });
      if (!REDUCE_MOTION) confetti();
    }, 380);
  }

  // Dismiss the celebration so the finished picture can be admired, and keep a
  // small bar with "Play again" / "Choose another picture" within reach.
  function showResult() {
    $('pzWin').classList.remove('show');
    $('pzDoneText').textContent = t('game.winDetail', {
      time: formatTime(seconds),
      moves: steps,
      n: N,
      total: N * N
    });
    $('pzDone').hidden = false;
    app.classList.add('is-done');
    $('pzDoneAgain').focus({ preventScroll: true });
  }

  function restartRound() {
    $('pzWin').classList.remove('show');
    $('pzDone').hidden = true;
    app.classList.remove('is-done');
    resetRoundState();
    shuffleAnimation();
  }

  function confetti() {
    const colors = ['#FEDD00', '#BF4638', '#46E3B7', '#6C8CFF', '#B28CFF'];
    for (let index = 0; index < 90; index += 1) {
      const piece = document.createElement('div');
      piece.className = 'pz-confetti';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[index % colors.length];
      piece.style.animationDuration = 2 + Math.random() * 2.2 + 's';
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 5200);
    }
  }

  // ================= Timer =================
  function startTimer() {
    if (started) return;
    started = true;
    timerId = setInterval(() => {
      seconds += 1;
      $('pzTime').textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerId);
  }

  function formatTime(total) {
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }

  // ================= Viewport fit =================
  function fitLayer() {
    if (!gameActive) return;
    const rect = workspace.getBoundingClientRect();
    if (!LAYER_W || !rect.width) return;
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(360, Math.round(rect.height));
    if (width === LAYER_W && height === LAYER_H) return;

    const nextOX = Math.round((width - full) / 2);
    const nextOY = verticalOffset(height, full);
    const deltaX = nextOX - OX;
    const deltaY = nextOY - OY;
    LAYER_W = width;
    LAYER_H = height;
    OX = nextOX;
    OY = nextOY;
    layer.style.width = width + 'px';
    layer.style.height = height + 'px';
    layer.style.transform = 'none';
    layer.style.left = '0px';
    layer.style.top = '0px';
    viewScale = 1;

    $('pzTarget').style.left = OX + 'px';
    $('pzTarget').style.top = OY + 'px';
    $('pzCutStage').style.left = OX + 'px';
    $('pzCutStage').style.top = OY + 'px';

    pieces.forEach(piece => {
      piece.x += deltaX;
      piece.y += deltaY;
      place(piece);
    });
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitLayer, 150);
  });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitLayer, 150);
  });

  // ================= HUD =================
  function leaveStage() {
    cancelAnimationFrame(introRAF);
    cancelAnimationFrame(shuffleRAF);
    clearTimeout(introTimer);
    endMemory();
    stopTimer();
    animating = false;
    gameActive = false;
    stage.hidden = true;
    setupPanel.hidden = false;
    app.classList.remove('is-playing');
    $('pzCutStage').style.display = 'none';
    $('pzSkip').classList.remove('show');
    $('pzTip').style.opacity = '0';
    $('pzWin').classList.remove('show');
    $('pzDone').hidden = true;
    app.classList.remove('is-done');
    setImmersive(false);
    setHudCollapsed(false);
    $('pzRefWrap').classList.remove('hide');
    $('pzStart').focus({ preventScroll: true });
    layer.querySelectorAll('.pz-piece').forEach(element => element.remove());
    pieces = [];
    groups = [];
    LAYER_W = 0;
    LAYER_H = 0;
    setStartButtonsDisabled(!selectedImage);
    showError('');
  }

  $('pzStart').addEventListener('click', () => startGame());
  $('pzStartFull').addEventListener('click', () => startGame({ immersive: true }));
  $('pzBack').addEventListener('click', leaveStage);
  $('pzAnother').addEventListener('click', leaveStage);
  $('pzDoneAnother').addEventListener('click', leaveStage);
  $('pzView').addEventListener('click', showResult);
  $('pzWinClose').addEventListener('click', showResult);
  $('pzWin').addEventListener('click', event => {
    if (event.target === $('pzWin')) showResult();
  });
  $('pzHudToggle').addEventListener('click', () => {
    setHudCollapsed(!$('pzHud').classList.contains('is-collapsed'));
  });
  $('pzFull').addEventListener('click', () => {
    setImmersive(!document.body.classList.contains('pz-immersive'));
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if ($('pzWin').classList.contains('show')) {
      showResult();
      return;
    }
    if (document.body.classList.contains('pz-immersive')) setImmersive(false);
  });
  $('pzHint').addEventListener('click', () => $('pzRefWrap').classList.toggle('hide'));
  $('pzShuffle').addEventListener('click', () => {
    if (animating) skipIntro();
    resetRoundState();
    shuffleAnimation();
  });
  $('pzGather').addEventListener('click', gatherLoosePieces);
  $('pzAgain').addEventListener('click', restartRound);
  $('pzDoneAgain').addEventListener('click', restartRound);
  $('pzSkip').addEventListener('click', () => {
    if (memoryActive) {
      endMemory();
      return;
    }
    skipIntro();
  });

  // ================= Boot =================
  bindDifficulty();
  bindUpload();
  loadCollections();
})();
