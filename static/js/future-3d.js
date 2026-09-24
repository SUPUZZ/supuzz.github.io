import { copy, worldCopy } from './future-copy.js';
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';

// These are original, procedural collection-inspired sculptures, not product CAD models.
export function createWorldViewer(host, reducedMotion) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', copy.instructions);
  host.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 80);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.35, 0);
  controls.enablePan = false;
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = .075;
  controls.minDistance = 6;
  controls.maxDistance = 15;
  controls.minPolarAngle = .3;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.autoRotateSpeed = .38;
  controls.enableZoom = false; // Page scrolling stays available; buttons and pinch handle zoom.
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .65;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xecf4ff, 0x665047, 1.1));
  const key = new THREE.DirectionalLight(0xfff4df, 3);
  key.position.set(-3, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 5, bottom: -4, near: .5, far: 20 });
  key.shadow.normalBias = .025;
  key.shadow.bias = -.00015;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc0dfff, 1.6);
  rim.position.set(4, 4, -4);
  scene.add(rim);
  const materials = new Map();
  function material(color, roughness = .29) {
    const id = `${color}/${roughness}`;
    if (!materials.has(id)) materials.set(id, new THREE.MeshPhysicalMaterial({ color, roughness, metalness: .03, clearcoat: .55, clearcoatRoughness: .2 }));
    return materials.get(id);
  }
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const box = new RoundedBoxGeometry(1, 1, 1, 3, .12);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 40);
  function mesh(parent, geo, color, position, scale = [1, 1, 1]) {
    const obj = new THREE.Mesh(geo, material(color));
    obj.position.set(...position); obj.scale.set(...scale);
    obj.castShadow = true; obj.receiveShadow = true;
    parent.add(obj); return obj;
  }
  const ball = (p, c, pos, s) => mesh(p, sphere, c, pos, s);
  const block = (p, c, pos, s) => mesh(p, box, c, pos, s);
  const disc = (p, c, pos, r, h) => mesh(p, cylinder, c, pos, [r, h, r]);
  function rod(parent, color, from, to, radius = .065) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), delta = b.clone().sub(a);
    const obj = mesh(parent, cylinder, color, a.clone().add(b).multiplyScalar(.5).toArray(), [radius, delta.length(), radius]);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return obj;
  }
  const podium = new THREE.Group(); scene.add(podium);
  disc(podium, '#e4ddd2', [0, -.24, 0], 2.75, .35);
  disc(podium, '#faf7f0', [0, -.045, 0], 2.76, .055);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x392f29, opacity: .15 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.425; ground.receiveShadow = true; scene.add(ground);
  const worlds = new Map();
  let model, paused = reducedMotion, exploded = false, visible = true, alive = true;
  const palette = ['#f5a6c7', '#48c5d5', '#ab81d6', '#ffce57', '#fc8973'];
  function group(parent, pos = [0, 0, 0]) { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g; }
  function flower(parent, color, x, y, z, size = .5) {
    const g = group(parent, [x, y, z]);
    disc(g, color, [0, 0, 0], size * .66, .13);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      const petal = ball(g, color, [Math.cos(a) * size * .6, 0, Math.sin(a) * size * .6], [size * .49, .10, size * .27]);
      petal.rotation.y = -a;
    }
    disc(g, '#ffe9a1', [0, .095, 0], .115, .085);
    return g;
  }
  function eyes(parent, y, z, spacing = .17, size = .07) {
    for (const x of [-spacing, spacing]) {
      ball(parent, '#fffdf4', [x, y, z], [size * 1.65, size * 1.9, size]);
      ball(parent, '#242c36', [x, y + .01, z + size * .86], [size * .65, size, size * .6]);
      ball(parent, '#ffffff', [x - size * .2, y + size * .4, z + size * 1.35], [size * .22, size * .22, size * .18]);
    }
  }
  function silhouette(parent, color, points, depth = .08) {
    const shape = new THREE.Shape();
    shape.moveTo(...points[0]); points.slice(1).forEach(point => shape.lineTo(...point)); shape.closePath();
    return mesh(parent, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 2, steps: 1 }), color, [0, 0, -depth / 2]);
  }
  function clownfish(parent, position, angle = 0, size = 1) {
    const g = group(parent, position); g.name = '小丑魚'; g.rotation.y = angle; g.scale.setScalar(size);
    const body = group(g); body.scale.set(.64, .36, .25);
    ball(body, '#f77c26', [0, 0, 0], [1, 1, 1]);
    // Ellipsoid surface bands wrap around the fish, including its unseen side.
    for (const [start, width] of [[.64, .21], [1.4, .23], [2.23, .21]]) {
      mesh(body, new THREE.SphereGeometry(1.009, 32, 10, 0, Math.PI * 2, start - .045, width + .09), '#333438', [0,0,0]).rotation.z = -Math.PI / 2;
      mesh(body, new THREE.SphereGeometry(1.017, 32, 10, 0, Math.PI * 2, start, width), '#fffaf0', [0,0,0]).rotation.z = -Math.PI / 2;
    }
    silhouette(g, '#343438', [[-.5,.05],[-.96,.32],[-.96,-.32],[-.5,-.05]]);
    silhouette(g, '#fc8d36', [[-.55,.03],[-.89,.24],[-.89,-.24],[-.55,-.03]], .1);
    silhouette(g, '#d75d25', [[-.35,.25],[-.28,.49],[.22,.41],[.36,.25]], .08);
    for (const side of [-1, 1]) {
      ball(g, '#fffef5', [.4, .085, side * .19], [.1, .115, .04]);
      ball(g, '#182e37', [.425, .09, side * .225], [.05, .065, .025]);
      const fin = ball(g, '#fb9d42', [-.05,-.12,side*.27], [.21,.09,.07]); fin.rotation.y=side*.6;
    }
    ball(g, '#f77c26', [.61,-.035,0], [.07,.065,.1]);
    return g;
  }
  function branchingCoral(parent, position, color, size = 1) {
    const g = group(parent, position); g.name = '分枝珊瑚'; g.scale.setScalar(size);
    const branches = [
      [[0,0,0],[0,1.5,0],.115], [[0,.48,0],[-.48,.9,.04],.09], [[-.48,.9,.04],[-.62,1.42,.08],.075],
      [[-.48,.9,.04],[-.9,1.13,.02],.065], [[0,.8,0],[.5,1.12,-.03],.085], [[.5,1.12,-.03],[.65,1.72,-.03],.065],
      [[.5,1.12,-.03],[.93,1.37,.04],.065], [[0,1.12,0],[-.27,1.72,-.1],.07], [[0,.5,0],[.16,.94,.43],.07]
    ];
    for (const [a,b,r] of branches) { rod(g,color,a,b,r); ball(g,color,b,[r,r,r]); }
    return g;
  }
  function coral(root) {
    disc(root, '#478fae', [0,.1,0], 2.27,.23);
    for (const [x,z,h,index] of [[-1.4,-.65,1.45,0],[0,-1.25,2.2,1],[1.35,-.65,1.55,2]]) {
      const stem=group(root,[x,.25,z]); stem.name='珊瑚花盤';
      rod(stem,'#72bfc9',[0,0,0],[0,h,0],.08);
      for(let j=0;j<Math.floor(h/.42);j++) flower(stem,palette[(index+j)%palette.length],0,j*.42+.12,0,.45-j*.025);
    }
    branchingCoral(root,[-1.1,.23,.65],'#f17b86',1.05);
    branchingCoral(root,[1.25,.23,.25],'#aa8cd5',.85);
    branchingCoral(root,[.05,.23,-.05],'#ffc166',.8);
    clownfish(root,[.7,1.23,1.25],-.2,1.08);
    clownfish(root,[-.8,2.65,-.35],.2,.72);
    for(let i=0;i<6;i++) flower(root,palette[i%5],-1.6+i*.6,.28,1.65,.22);
  }
  function penguin(parent, position, size=1) {
    const g=group(parent,position);g.name='企鵝';g.scale.setScalar(size);
    ball(g,'#30435c',[0,.5,0],[.34,.5,.29]);
    ball(g,'#fff9eb',[0,.44,.21],[.26,.35,.11]);
    ball(g,'#30435c',[0,.92,0],[.3,.3,.26]);
    eyes(g,.94,.24,.105,.048);
    ball(g,'#f3b647',[0,.83,.3],[.09,.055,.14]);
    for(const x of [-.18,.18])ball(g,'#f3b647',[x,.06,.1],[.12,.06,.2]);
    for(const x of [-.35,.35]){const wing=ball(g,'#30435c',[x,.52,0],[.09,.32,.17]);wing.rotation.z=x;}
    return g;
  }
  function deer(parent, position) {
    const g=group(parent,position);g.name='鹿';g.rotation.y=-.35;
    ball(g,'#bf8d5c',[0,.94,0],[.34,.39,.6]);
    ball(g,'#efe1bd',[0,.89,.43],[.25,.26,.15]);
    for(const x of [-.23,.23])for(const z of [-.32,.32]){
      rod(g,'#bf8d5c',[x,.83,z],[x,.15,z],.075);
      block(g,'#605148',[x,.095,z+.025],[.17,.18,.22]);
    }
    rod(g,'#bf8d5c',[0,1.04,.32],[0,1.57,.49],.17);
    ball(g,'#cda274',[0,1.66,.5],[.3,.31,.29]);
    ball(g,'#f1dfb9',[0,1.52,.74],[.21,.15,.2]);
    ball(g,'#665347',[0,1.55,.91],[.085,.065,.04]);
    eyes(g,1.71,.73,.13,.05);
    for(const side of [-1,1]){
      const ear=ball(g,'#bf8d5c',[side*.34,1.83,.46],[.2,.095,.11]);ear.rotation.z=side*.35;
      ball(g,'#e5c49f',[side*.35,1.85,.54],[.12,.045,.035]);
      const a=[side*.17,1.91,.41],b=[side*.26,2.36,.34],c=[side*.42,2.67,.32];
      rod(g,'#8d6747',a,b,.048);rod(g,'#8d6747',b,c,.04);
      rod(g,'#8d6747',[side*.23,2.2,.37],[side*.52,2.4,.4],.035);
      rod(g,'#8d6747',b,[side*.12,2.57,.32],.032);
      ball(g,'#8d6747',c,[.045,.045,.045]);
    }
    ball(g,'#f4e5cd',[0,1.08,-.61],[.13,.17,.16]);
    for(const side of [-1,1])for(let i=0;i<3;i++)ball(g,'#f7e8c9',[side*.32,1.05,-.28+i*.2],[.022,.047,.05]);
    return g;
  }
  function ice(root) {
    disc(root,'#95cddd',[0,.1,0],2.27,.23);
    disc(root,'#e5f4ef',[0,.245,0],2.18,.075);
    for(const [x,z,h] of [[-1.35,-1,1.8],[.05,-1.55,2.4],[1.45,-.75,1.6]]){
      const g=group(root,[x,.27,z]);g.name='覆雪松樹';rod(g,'#99acbc',[0,0,0],[0,h*.82,0],.09);
      for(let i=0;i<3;i++){
        const r=.57-i*.13,y=h*.47+i*.35;
        mesh(g,new THREE.ConeGeometry(r,.85,12),'#86b7c9',[0,y,0]);
        mesh(g,new THREE.ConeGeometry(r*.89,.67,12),'#faf9ef',[0,y+.12,0]);
      }
    }
    penguin(root,[-.93,.29,.9],1.22);
    penguin(root,[-1.6,.29,.25],.65);
    deer(root,[.82,.29,.65]);
    for(let i=0;i<5;i++)ball(root,'#fafbf5',[-1.5+i*.7,.31,1.6],[.21,.09,.17]);
  }
  function tree(parent, x, z, height, color) {
    const g = group(parent, [x, .22, z]);
    rod(g, '#c59860', [0, 0, 0], [0, height, 0], .12);
    for (let i = 0; i < 3; i++) mesh(g, new THREE.ConeGeometry(.65 - i * .15, .95, 9), color, [0, height * .55 + i * .4, 0]);
  }
  function tyrannosaurus(parent, pos) {
    const color='#73ae7c', g=group(parent,pos);g.name='霸王龍';
    ball(g, color, [0, .85, 0], [.48, .6, .62]);
    ball(g, '#e8e7ad', [0, .8, .49], [.33, .4, .12]);
    rod(g, color, [0, 1.1, .12], [0, 1.52, .34], .28);
    block(g,color,[0,1.78,.55],[.85,.68,.98]);
    block(g,'#547d60',[0,1.53,.78],[.71,.045,.66]);
    block(g,color,[0,1.44,.76],[.73,.15,.72]);
    for(const side of [-1,1]){
      ball(g,'#fff9e9',[side*.43,1.96,.66],[.055,.12,.13]);
      ball(g,'#263d33',[side*.474,1.98,.7],[.027,.066,.068]);
      ball(g,'#487654',[side*.24,1.84,1.042],[.045,.035,.012]);
      for(let i=0;i<3;i++)mesh(g,new THREE.ConeGeometry(.045,.12,3),'#fff4d2',[side*.32,1.49,.57+i*.17]).rotation.z=Math.PI;
    }
    for (const x of [-.31, .31]) {
      ball(g,color,[x,.65,-.14],[.24,.36,.3]);
      rod(g, color, [x, .65, -.18], [x, .18, .05], .19);
      block(g, color, [x, .11, .18], [.38, .22, .55]);
      rod(g, color, [x * 1.4, 1.1, .23], [x * 1.55, .94, .45], .075);
      for(const dx of [-.035,.035])rod(g,'#e9dfaa',[x*1.55+dx,.94,.45],[x*1.55+dx,.93,.56],.023);
    }
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, .7, -.45),new THREE.Vector3(.2, .65, -1),new THREE.Vector3(.65, .9, -1.4)]);
    mesh(g, new THREE.TubeGeometry(curve, 18, .16, 12, false), color, [0, 0, 0]);
    ball(g, color, [.65, .9, -1.4], [.17, .17, .17]);
    return g;
  }
  function pterosaur(parent, position) {
    const g=group(parent,position);g.name='翼龍';g.rotation.set(.12,-.3,-.08);
    ball(g,'#b693ce',[0,0,0],[.19,.18,.4]);
    for(const side of [-1,1]){
      const wing=silhouette(g,'#d3b1df',[[side*.1,.12],[side*.57,.52],[side*1.55,.48],[side*1.83,-.38],[side*.86,-.12],[side*.28,-.46]],.065);
      wing.rotation.x=-Math.PI/2;
      rod(g,'#9573b2',[side*.12,0,-.12],[side*.57,0,-.52],.045);
      rod(g,'#9573b2',[side*.57,0,-.52],[side*1.55,0,-.48],.045);
      rod(g,'#9573b2',[side*1.55,0,-.48],[side*1.83,0,.38],.035);
      rod(g,'#b492cb',[side*.57,.01,-.52],[side*.86,.01,.12],.025);
      rod(g,'#b492cb',[side*.57,.01,-.52],[side*.28,.01,.46],.025);
      rod(g,'#a583bf',[side*.11,-.06,-.22],[side*.2,-.21,-.51],.04);
    }
    ball(g,'#b693ce',[0,.1,.44],[.22,.23,.27]);
    const beak=mesh(g,new THREE.ConeGeometry(.15,.65,4),'#e9af68',[0,.03,.92]);beak.rotation.x=Math.PI/2;
    const crest=mesh(g,new THREE.ConeGeometry(.13,.49,4),'#a281bd',[0,.33,.24]);crest.rotation.x=-.75;
    eyes(g,.2,.62,.11,.043);
    return g;
  }
  function dinosaurBaby(parent, position) {
    const g=group(parent,position);g.name='恐龍寶寶';g.rotation.y=-.25;
    const profile=[new THREE.Vector2(0,0),new THREE.Vector2(.24,.06),new THREE.Vector2(.44,.25),new THREE.Vector2(.47,.49),new THREE.Vector2(.42,.68)];
    mesh(g,new THREE.LatheGeometry(profile,32),'#f4e1b6',[0,0,0]);
    ball(g,'#e6b18e',[0,.68,0],[.29,.37,.26]);
    ball(g,'#e6b18e',[0,1.02,.05],[.35,.33,.31]);
    ball(g,'#f2c7a4',[0,.93,.3],[.26,.15,.2]);
    eyes(g,1.09,.31,.14,.059);
    for(const x of [-.36,.36])ball(g,'#e6b18e',[x,.68,.12],[.16,.09,.12]);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      mesh(g,new THREE.ConeGeometry(.095,.18,3),'#f4e1b6',[Math.cos(a)*.41,.69,Math.sin(a)*.41]);
    }
    for(let i=0;i<4;i++)ball(g,'#d6bc8c',[Math.sin(i*1.7)*.4,.28+(i%2)*.17,Math.cos(i*1.7)*.39],[.07,.09,.026]);
    return g;
  }
  function dino(root) {
    disc(root, '#afc870', [0, .1, 0], 2.25, .23);
    tree(root,-1.5,-.9,1.45,'#459b73');tree(root,1.5,-1,1.2,'#6bb779');
    const big=tyrannosaurus(root,[-.65,.23,.25]);big.rotation.y=.2;
    dinosaurBaby(root,[1.08,.23,.95]);
    pterosaur(root,[.12,3.02,-.3]);
    for (let i = 0; i < 5; i++) flower(root, ['#f8d576','#e79bb2'][i%2], -1.7 + i * .8, .35, 1.6, .21);
    for (let i = 0; i < 3; i++) ball(root, '#eee1be', [-1.6 + i * .2, .35, -.1], [.13, .22, .14]);
  }
  function waffle(parent, color, position, size = 1, rotation = [0, 0, 0]) {
    const g = group(parent, position); g.scale.setScalar(size); g.rotation.set(...rotation);
    g.name='井字形積木';
    // Two rails each way: one open central square and eight projecting ends.
    for (const offset of [-.25,.25]) {
      block(g,color,[offset,0,0],[.21,1.3,.22]);
      block(g,color,[0,offset,0],[1.3,.21,.22]);
    }
    return g;
  }
  function multi(root) {
    // The component itself is the hero, with upright, flat and perpendicular builds.
    waffle(root,'#eda640',[-.55,.16,-.4],1.4,[Math.PI/2,0,0]);
    waffle(root,'#58b7bd',[-.55,1.0,-.4],1.25,[0,0,0]);
    waffle(root,'#ef889e',[-.55,1.0,-.4],1.25,[0,Math.PI/2,0]);
    waffle(root,'#a3bd57',[-.55,1.87,-.4],1.4,[Math.PI/2,0,0]);
    waffle(root,'#9b87c9',[-.55,2.68,-.4],1.2,[0,0,0]);
    waffle(root,'#e8b342',[-.55,2.68,-.4],1.2,[0,Math.PI/2,0]);
    waffle(root,'#ed879f',[1.35,.89,.75],1.22,[0,.1,-.16]);
    waffle(root,'#65b7c9',[-1.35,.15,1.1],.85,[Math.PI/2,0,.35]);
    waffle(root,'#b7cc64',[.25,.14,1.55],.72,[Math.PI/2,0,-.2]);
  }
  function build(name) {
    const g = new THREE.Group();
    if (name === 'coral') coral(g);
    if (name === 'ice') ice(g);
    if (name === 'multi') multi(g);
    if (name === 'dino') dino(g);
    g.userData.parts ||= g.children;
    g.userData.parts.forEach((piece, i) => { piece.userData.home = piece.position.clone(); piece.userData.spread = new THREE.Vector3(piece.position.x * .4, .12 + piece.position.y * .18 + (i % 3) * .1, piece.position.z * .4); });
    scene.add(g); worlds.set(name, g); return g;
  }
  function reset() { camera.position.set(6.5, 4.9, 8.8); controls.target.set(0, 1.55, 0); controls.update(); }
  function select(name) {
    if (model) model.visible = false;
    model = worlds.get(name) || build(name); model.visible = true;
    exploded = false;
    host.dataset.world = name;
    canvas.setAttribute('aria-label', `${copy.scene(worldCopy[name].features)}. ${copy.instructions}`);
    reset();
  }
  function resize() {
    const {width,height} = host.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = width < 500 ? 43 : 36;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
  }
  function zoom(factor) { const offset = camera.position.clone().sub(controls.target); offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, 6, 15)); camera.position.copy(controls.target).add(offset); controls.update(); }
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') return reset();
    if (event.key === '+' || event.key === '=') return zoom(.9);
    if (event.key === '-') return zoom(1.1);
    const offset = camera.position.clone().sub(controls.target), spherical = new THREE.Spherical().setFromVector3(offset);
    if (event.key === 'ArrowLeft') spherical.theta -= .15;
    if (event.key === 'ArrowRight') spherical.theta += .15;
    if (event.key === 'ArrowUp') spherical.phi -= .12;
    if (event.key === 'ArrowDown') spherical.phi += .12;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update();
  });
  // Pinch changes camera distance without trapping the page's mouse wheel.
  const touches = new Map(); let pinchDistance = 0;
  canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') touches.set(e.pointerId, [e.clientX,e.clientY]); });
  canvas.addEventListener('pointermove', e => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, [e.clientX,e.clientY]);
    if (touches.size === 2) { const [a,b] = [...touches.values()], distance = Math.hypot(a[0]-b[0],a[1]-b[1]); if (pinchDistance) zoom(pinchDistance/distance); pinchDistance = distance; }
  });
  for (const event of ['pointerup','pointercancel']) canvas.addEventListener(event,e=>{touches.delete(e.pointerId);pinchDistance=0;});
  const observer = new ResizeObserver(resize); observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); intersection.observe(host);
  let previous = 0;
  renderer.setAnimationLoop(time => {
    if (!alive || !visible || document.hidden) { previous = time; return; }
    const dt = Math.min((time - previous) / 1000, .05); previous = time;
    controls.autoRotate = !paused && !reducedMotion && !exploded;
    controls.update(dt);
    if (model) for (const piece of model.userData.parts) {
      const target = piece.userData.home.clone();
      if (exploded) target.add(piece.userData.spread);
      if (reducedMotion) piece.position.copy(target); else piece.position.lerp(target, 1 - Math.exp(-dt * 7));
    }
    renderer.render(scene, camera);
  });
  select('coral'); resize(); renderer.render(scene,camera);
  host.classList.add('is-rendered');
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); host.classList.remove('is-rendered'); document.getElementById('scene-status').textContent = copy.lost; });
  return {
    select, reset, zoom,
    pause(value) { paused = value; },
    reducedMotion(value) { reducedMotion = value; controls.enableDamping = !value; },
    explode(value) { exploded = value; },
    dispose() { alive = false; renderer.setAnimationLoop(null); observer.disconnect(); intersection.disconnect(); controls.dispose(); const geometries = new Set(); scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); }); geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); ground.material.dispose(); environment.dispose(); renderer.dispose(); canvas.remove(); }
  };
}
