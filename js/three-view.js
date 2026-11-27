// Real-time 3D renders of the ocarina and the two controllers.
// Physically based materials + an environment map give real glaze/plastic
// reflections; buttons physically press down and the stick tilts.
import * as THREE from '../assets/vendor/three.module.min.js';
import { RoomEnvironment } from '../assets/vendor/RoomEnvironment.js';

const GOLD = new THREE.Color('#ffd77a');

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

// ---------------------------------------------------------------- helpers
function canvasTex(size, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

let glowTex = null;
function glow() {
  if (glowTex) return glowTex;
  glowTex = canvasTex(128, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,246,210,1)');
    gr.addColorStop(0.25, 'rgba(255,220,130,0.75)');
    gr.addColorStop(0.6, 'rgba(255,200,90,0.18)');
    gr.addColorStop(1, 'rgba(255,200,90,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
  return glowTex;
}
function glowSprite(scale) {
  const m = new THREE.SpriteMaterial({ map: glow(), color: '#ffc04a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
  const sp = new THREE.Sprite(m);
  sp.scale.setScalar(scale);
  sp.renderOrder = 10;
  return sp;
}

const plastic = (color, o = {}) => new THREE.MeshPhysicalMaterial({
  color, roughness: o.rough ?? 0.42, metalness: 0, clearcoat: o.coat ?? 0.35, clearcoatRoughness: o.coatRough ?? 0.35, envMapIntensity: o.env ?? 0.75, ...(o.map ? { map: o.map } : {}),
});

function labelTex(bg, text, fg, kind) {
  return canvasTex(256, (g, s) => {
    g.fillStyle = bg; g.fillRect(0, 0, s, s);
    g.save(); g.translate(s / 2, s / 2);
    if (kind === 'tri') {
      g.rotate(text);
      g.fillStyle = fg;
      g.beginPath(); g.moveTo(0, -58); g.lineTo(52, 34); g.lineTo(-52, 34); g.closePath(); g.fill();
    } else if (kind === 'rings') {
      g.strokeStyle = fg; g.lineWidth = 5;
      for (let r = 18; r < 128; r += 18) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = '#333'; g.beginPath(); g.arc(0, 0, 7, 0, Math.PI * 2); g.fill();
    } else if (text) {
      g.fillStyle = fg;
      g.font = `900 ${text.length > 2 ? 64 : text.length > 1 ? 104 : 140}px Nunito, Arial, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, 0, 8);
    }
    g.restore();
  });
}

/** A round plastic button with a textured top and a rounded top edge. */
function makeButton({ r, h = 0.11, color, top }) {
  const g = new THREE.Group();
  const side = plastic(color);
  const cap = top ? plastic('#ffffff', { map: top }) : plastic(color);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, 56, 1), [side, cap, side]);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.9, r * 0.1, 12, 56), side);
  rim.rotation.x = Math.PI / 2; rim.position.y = h - r * 0.02; rim.castShadow = true;
  // Rotate the cap texture so text reads upright from the camera.
  if (top) { top.center.set(0.5, 0.5); top.rotation = Math.PI / 2; }
  g.add(body, rim);
  const sp = glowSprite(r * 3.6); sp.position.y = h + 0.05; g.add(sp);
  return { group: g, mats: [side, cap], sprite: sp, depth: 0.045 };
}

function setLit(part, on, t) {
  const target = on ? 1 : 0;
  part.lit = (part.lit ?? 0) + (target - (part.lit ?? 0)) * Math.min(1, t * 22);
  const v = part.lit;
  for (const m of part.mats) { m.emissive.copy(GOLD); m.emissiveIntensity = v * (part.emi ?? 0.55); }
  if (part.sprite) part.sprite.material.opacity = v * (part.glowMax ?? 0.7);
  if (part.depth) part.group.position.y = (part.baseY ?? 0) - v * part.depth;
}

// ---------------------------------------------------------------- stage
class Stage {
  constructor(container, aspect, cam, look, fov) {
    this.el = document.createElement('div');
    this.el.className = 'stage3d';
    this.el.style.aspectRatio = aspect;
    container.appendChild(this.el);
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.92;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.el.appendChild(r.domElement);
    this.labels = document.createElement('div');
    this.labels.className = 'stage-labels';
    this.el.appendChild(this.labels);

    const sc = (this.scene = new THREE.Scene());
    const pm = new THREE.PMREMGenerator(r);
    this.envTex = pm.fromScene(new RoomEnvironment(r), 0.03).texture;
    sc.environment = this.envTex;
    pm.dispose();

    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
    this.camera.position.set(...cam);
    this.camera.lookAt(...look);

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(-3, 9, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
    key.shadow.radius = 8;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    sc.add(key);
    sc.add(new THREE.HemisphereLight(0xe8fff0, 0x0b2416, 0.35));

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.38 }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    sc.add(this.ground);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
    this.tmp = new THREE.Vector3();
  }

  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.w = w;
  }

  /** world position -> % within the stage */
  project(obj, offset) {
    const v = this.tmp;
    obj.getWorldPosition(v);
    if (offset) v.add(offset);
    v.project(this.camera);
    return [((v.x + 1) / 2) * 100, ((1 - v.y) / 2) * 100];
  }

  addLabel(html, cls = '') {
    const d = document.createElement('div');
    d.className = `s-lab ${cls}`;
    d.innerHTML = html;
    this.labels.appendChild(d);
    return d;
  }

  place(label, obj, offset) {
    const [x, y] = this.project(obj, offset);
    label.style.left = `${x}%`; label.style.top = `${y}%`;
  }

  render() {
    if (!this.w) this.resize();
    if (this.w) this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.ro.disconnect();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material; if (!m) return;
      (Array.isArray(m) ? m : [m]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); });
    });
    this.envTex.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.el.remove();
  }
}

// ---------------------------------------------------------------- ocarina
const GLAZES = {
  blue: { color: '#2350b8', mottle: ['#3466cf', '#183f93'], rough: 0.32 },
  turquoise: { color: '#2aa7a8', mottle: ['#40c2c0', '#1c8183'], rough: 0.22 },
  clay: { color: '#9a4f2c', mottle: ['#b4663d', '#7a3a1e'], rough: 0.55 },
};

export function createOcarinaView(container, { icons, skin = 'blue' }) {
  const st = new Stage(container, '16 / 10', [0.2, 6.6, 4.9], [0.1, -0.1, 0.15], 30);
  const glaze = GLAZES[skin] || GLAZES.blue;

  // Subtle glaze mottling so the ceramic doesn't look like flat plastic.
  const mottle = canvasTex(512, (g, s) => {
    g.fillStyle = glaze.color; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * s, y = Math.random() * s, r = 6 + Math.random() * 40;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const c = glaze.mottle[i % 2];
      gr.addColorStop(0, c + '55'); gr.addColorStop(1, c + '00');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  const glazeMat = new THREE.MeshPhysicalMaterial({
    map: mottle, roughness: glaze.rough, metalness: 0, clearcoat: skin === 'clay' ? 0.15 : 0.7, clearcoatRoughness: 0.12, envMapIntensity: 0.8,
  });
  const silver = new THREE.MeshPhysicalMaterial({ color: '#e2e6ea', metalness: 1, roughness: 0.18, clearcoat: 0.6 });

  const rig = new THREE.Group();
  st.scene.add(rig);

  // Sweet-potato body: a deformed sphere, fat near the mouthpiece, tapering to a rounded point.
  const geo = new THREE.SphereGeometry(1, 160, 110);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const taper = 1 - 0.3 * x;
    let ny = y * 0.86 * taper;
    if (ny < 0) ny *= 0.8;
    ny += 0.06 - 0.16 * x * x;
    const nx = x * 2.25 + 0.12 * x * x * x;
    p.setXYZ(i, nx, ny, z * 1.02 * taper);
  }
  geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, glazeMat);
  body.castShadow = true; body.receiveShadow = true;
  rig.add(body);

  // Mouthpiece: a flattened, tapered tube sticking out toward the player.
  const mdir = new THREE.Vector3(-0.5, 0.06, 0.86).normalize();
  const mstart = new THREE.Vector3(-1.45, 0.06, 0.62);
  const mlen = 1.15;
  const mgeo = new THREE.CylinderGeometry(0.2, 0.32, mlen, 64, 1, false);
  mgeo.scale(1, 1, 0.55);
  const mouth = new THREE.Mesh(mgeo, silver);
  mouth.castShadow = true;
  mouth.position.copy(mstart).addScaledVector(mdir, mlen / 2);
  mouth.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mdir);
  // keep the flat side of the oval horizontal
  mouth.rotateY(Math.PI / 2);
  rig.add(mouth);
  const lip = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), silver);
  lip.scale.set(0.2, 0.11, 0.2);
  lip.position.copy(mstart).addScaledVector(mdir, mlen);
  lip.quaternion.copy(mouth.quaternion);
  lip.castShadow = true;
  rig.add(lip);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.05), new THREE.MeshBasicMaterial({ color: '#050505' }));
  slot.position.copy(mstart).addScaledVector(mdir, mlen + 0.17);
  slot.quaternion.copy(mouth.quaternion);
  slot.rotateX(Math.PI / 2);
  rig.add(slot);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.045, 16, 64), silver);
  band.position.copy(mstart).addScaledVector(mdir, 0.08);
  band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), mdir);
  band.scale.set(1, 0.6, 1);
  rig.add(band);

  // Holes: found by ray-casting onto the glazed surface.
  const ray = new THREE.Raycaster();
  const pitTex = canvasTex(128, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2 - 6, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, '#000'); gr.addColorStop(0.7, '#05070c'); gr.addColorStop(0.9, '#20140c'); gr.addColorStop(1, '#3a2615');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
  const pitMat = new THREE.MeshBasicMaterial({ map: pitTex });
  function surface(x, z) {
    ray.set(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(body)[0];
    const n = hit.face.normal.clone().transformDirection(body.matrixWorld);
    return { point: hit.point, normal: n };
  }
  const HOLES = {
    cu: [-1.3, -0.18, 0.19], cl: [-0.58, -0.34, 0.2], cr: [0.16, -0.3, 0.19], cd: [0.86, -0.18, 0.17], a: [1.5, -0.05, 0.14],
    sharp: [-0.22, 0.34, 0.09], flat: [0.44, 0.3, 0.09],
  };
  const parts = {};
  rig.updateMatrixWorld(true);
  for (const [k, [x, z, r]] of Object.entries(HOLES)) {
    const { point, normal } = surface(x, z);
    const g = new THREE.Group();
    g.position.copy(point);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    const pit = new THREE.Mesh(new THREE.CircleGeometry(r, 48), pitMat);
    pit.position.z = 0.002;
    const rimMat = glazeMat.clone();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * 0.2, 16, 56), rimMat);
    rim.scale.z = 0.55;
    rim.castShadow = true;
    const sp = glowSprite(r * 6.5); sp.position.z = 0.08;
    g.add(pit, rim, sp);
    rig.add(g);
    const lab = st.addLabel(icons[k], k === 'sharp' || k === 'flat' ? 's-mod' : '');
    parts[k] = { group: g, mats: [rimMat], sprite: sp, label: lab, anchor: g, off: normal.clone().multiplyScalar(k === 'sharp' || k === 'flat' ? 0.32 : 0.5) };
  }
  const box = new THREE.Box3().setFromObject(rig);
  st.ground.position.y = box.min.y - 0.28;
  rig.rotation.y = -0.12;

  const air = st.addLabel('<span class="air"><i></i><i></i><i></i></span>', 's-air');
  const airAnchor = new THREE.Object3D();
  airAnchor.position.copy(mstart).addScaledVector(mdir, mlen + 0.3);
  rig.add(airAnchor);

  let t = 0;
  return {
    el: st.el,
    update(f, s, dt) {
      t += dt;
      const wob = f.active ? Math.sin(t * Math.PI * 2 * 5.8) * f.vib * 0.025 : 0;
      const tilt = f.active ? f.bend * 0.05 : 0;
      rig.rotation.z += (tilt + wob - rig.rotation.z) * Math.min(1, dt * 14);
      for (const [k, part] of Object.entries(parts)) {
        const on = k === 'sharp' ? s.sharp : k === 'flat' ? s.flat : k === f.active;
        setLit(part, on, dt);
        part.label.classList.toggle('on', !!on);
        st.place(part.label, part.anchor, part.off);
      }
      st.place(air, airAnchor);
      air.classList.toggle('on', !!f.active);
      st.render();
    },
    dispose: () => st.dispose(),
  };
}

// ---------------------------------------------------------------- controllers
const P = (x, y) => [(x - 640) / 200, (600 - y) / 200]; // photo-style pixel coords -> shape coords
const W = (x, y) => [(x - 640) / 200, (y - 600) / 200]; // -> world X/Z

function outline(cmds) {
  const s = new THREE.Shape();
  for (const c of cmds) {
    if (c[0] === 'M') s.moveTo(...P(c[1], c[2]));
    else s.bezierCurveTo(...P(c[1], c[2]), ...P(c[3], c[4]), ...P(c[5], c[6]));
  }
  return s;
}

const N64_OUTLINE = [
  ['M', 640, 92], ['C', 760, 92, 870, 95, 885, 140], ['C', 1000, 140, 1120, 160, 1180, 220], ['C', 1250, 290, 1265, 420, 1255, 520],
  ['C', 1245, 650, 1225, 800, 1190, 930], ['C', 1170, 1010, 1100, 1015, 1080, 960], ['C', 1050, 880, 1030, 760, 990, 680],
  ['C', 960, 630, 870, 620, 830, 680], ['C', 800, 760, 760, 1000, 720, 1180], ['C', 700, 1262, 580, 1262, 560, 1180],
  ['C', 520, 1000, 480, 760, 450, 680], ['C', 410, 620, 320, 630, 290, 680], ['C', 250, 760, 230, 880, 200, 960],
  ['C', 180, 1015, 110, 1010, 90, 930], ['C', 55, 800, 35, 650, 25, 520], ['C', 15, 420, 30, 290, 100, 220],
  ['C', 160, 160, 280, 140, 395, 140], ['C', 410, 95, 520, 92, 640, 92],
];
const PRO_OUTLINE = [
  ['M', 640, 250], ['C', 820, 250, 960, 228, 1050, 244], ['C', 1170, 265, 1232, 330, 1250, 450], ['C', 1272, 600, 1266, 800, 1222, 940],
  ['C', 1192, 1035, 1090, 1045, 1058, 962], ['C', 1030, 880, 990, 790, 930, 762], ['C', 860, 732, 420, 732, 350, 762],
  ['C', 290, 790, 250, 880, 222, 962], ['C', 190, 1045, 88, 1035, 58, 940], ['C', 14, 800, 8, 600, 30, 450],
  ['C', 48, 330, 110, 265, 230, 244], ['C', 320, 228, 460, 250, 640, 250],
];

function cross(arm, width, round) {
  const a = arm / 2, w = width / 2, r = round;
  const s = new THREE.Shape();
  s.moveTo(-w, a - r); s.quadraticCurveTo(-w, a, -w + r, a); s.lineTo(w - r, a); s.quadraticCurveTo(w, a, w, a - r);
  s.lineTo(w, w); s.lineTo(a - r, w); s.quadraticCurveTo(a, w, a, w - r); s.lineTo(a, -w + r); s.quadraticCurveTo(a, -w, a - r, -w);
  s.lineTo(w, -w); s.lineTo(w, -a + r); s.quadraticCurveTo(w, -a, w - r, -a); s.lineTo(-w + r, -a); s.quadraticCurveTo(-w, -a, -w, -a + r);
  s.lineTo(-w, -w); s.lineTo(-a + r, -w); s.quadraticCurveTo(-a, -w, -a, -w + r); s.lineTo(-a, w - r); s.quadraticCurveTo(-a, w, -a + r, w);
  s.lineTo(-w, w); s.closePath();
  return s;
}

export function createPadView(container, kind, { style = 'nintendo', faces }) {
  const n64 = kind === 'n64';
  const st = new Stage(container, n64 ? '10 / 9' : '4 / 3', n64 ? [0, 9.2, 5.6] : [0, 8.8, 5.2], n64 ? [0, 0, 0.65] : [0, 0, 0.35], 32);
  const rig = new THREE.Group();
  st.scene.add(rig);
  const TOP = 0.7;
  const shellMat = n64 ? plastic('#8f9296', { rough: 0.62, coat: 0.12, env: 0.55 }) : plastic('#2c2e33', { rough: 0.6, coat: 0.25 });
  const shellGeo = new THREE.ExtrudeGeometry(outline(n64 ? N64_OUTLINE : PRO_OUTLINE), {
    depth: 0.42, bevelEnabled: true, bevelThickness: 0.24, bevelSize: 0.2, bevelSegments: 10, curveSegments: 64,
  });
  shellGeo.rotateX(-Math.PI / 2);
  shellGeo.translate(0, 0.04, 0);
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.castShadow = true; shell.receiveShadow = true;
  rig.add(shell);

  const parts = {};
  const put = (part, x, y, k) => {
    const [X, Z] = W(x, y);
    part.group.position.set(X, TOP, Z);
    part.baseY = TOP;
    rig.add(part.group);
    if (k) parts[k] = part;
    return part;
  };

  // Stick (shared): octagonal gate + tilting stick
  const stickGroup = new THREE.Group();
  const [sx, sy] = n64 ? [650, 680] : [330, 430];
  {
    const [X, Z] = W(sx, sy);
    stickGroup.position.set(X, TOP, Z);
    const well = new THREE.Mesh(new THREE.CylinderGeometry(n64 ? 0.62 : 0.4, n64 ? 0.62 : 0.4, 0.04, n64 ? 64 : 64), plastic(n64 ? '#46494e' : '#1c1d21', { rough: 0.6 }));
    well.position.y = 0.0; well.receiveShadow = true;
    stickGroup.add(well);
    if (n64) {
      const gate = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8), plastic('#2e3034', { rough: 0.7 }));
      gate.position.y = 0.012; gate.rotation.y = Math.PI / 8;
      stickGroup.add(gate);
    }
    const pivot = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.34, 24), plastic(n64 ? '#3a3c40' : '#1b1c20'));
    shaft.position.y = 0.17;
    const capTop = n64 ? labelTex('#d6d7d8', null, '#b9babb', 'rings') : labelTex('#2a2c31', null, '#34363c', 'rings');
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(n64 ? 0.3 : 0.3, n64 ? 0.31 : 0.33, 0.12, 48), [plastic(n64 ? '#cfd0d1' : '#26282d'), plastic('#fff', { map: capTop, rough: 0.6 }), plastic('#999')]);
    cap.position.y = 0.38; cap.castShadow = true;
    pivot.add(shaft, cap);
    stickGroup.add(pivot);
    rig.add(stickGroup);
    parts.stick = { pivot, mats: [cap.material[0], cap.material[1]], emi: 0.22 };
  }

  const labels = [];
  if (n64) {
    // D-pad (decorative on N64)
    const dgeo = new THREE.ExtrudeGeometry(cross(1.0, 0.33, 0.06), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4 });
    dgeo.rotateX(-Math.PI / 2);
    const dpad = new THREE.Mesh(dgeo, plastic('#45484d', { rough: 0.5 }));
    const [dx, dz] = W(262, 420);
    dpad.position.set(dx, TOP, dz); dpad.castShadow = true;
    rig.add(dpad);
    const yellow = '#f3c52d', yDark = '#c99a10';
    const tri = (a) => labelTex(yellow, a, yDark, 'tri');
    put(makeButton({ r: 0.165, color: yellow, top: tri(0) }), 1052, 302, 'cu');
    put(makeButton({ r: 0.165, color: yellow, top: tri(Math.PI) }), 1055, 438, 'cd');
    put(makeButton({ r: 0.165, color: yellow, top: tri(-Math.PI / 2) }), 983, 368, 'cl');
    put(makeButton({ r: 0.165, color: yellow, top: tri(Math.PI / 2) }), 1128, 372, 'cr');
    put(makeButton({ r: 0.235, color: '#1f3fae', top: labelTex('#1f3fae', 'A', '#16308a') }), 965, 530, 'a');
    put(makeButton({ r: 0.23, color: '#1d7f3b', top: labelTex('#1d7f3b', 'B', '#15652e') }), 876, 440);
    put(makeButton({ r: 0.2, h: 0.08, color: '#c8432c', top: labelTex('#c8432c', 'START', '#a5321f') }), 645, 445);
    // Shoulders behind the top edge
    const sh = (x) => {
      const g = new THREE.Group();
      const m = plastic('#5f6267', { rough: 0.55 });
      const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 1.0, 8, 24), m);
      cap.rotation.z = Math.PI / 2; cap.castShadow = true;
      g.add(cap);
      const sp = glowSprite(1.4); g.add(sp);
      const [X, Z] = W(x, 168);
      g.position.set(X, TOP - 0.18, Z);
      rig.add(g);
      return { group: g, mats: [m], sprite: sp, baseY: TOP - 0.18, depth: 0.06 };
    };
    sh(262);
    parts.sharp = sh(1018);
    // Z sits underneath the center prong: show it as a chip.
    const zAnchor = new THREE.Object3D(); zAnchor.position.set(...(() => { const [X, Z] = W(640, 1040); return [X, 0.2, Z]; })());
    rig.add(zAnchor);
    parts.flat = { mats: [], chip: st.addLabel('Z <span class="sym">♭</span><small>trigger underneath</small>', 's-chip'), anchor: zAnchor };
    parts.sharp.chip = st.addLabel('R <span class="sym">♯</span>', 's-chip');
    parts.sharp.anchor = parts.sharp.group;
    parts.sharp.chipOff = new THREE.Vector3(0, 0.25, -0.35);
  } else {
    const F = faces;
    const faceColor = '#1d1e22';
    put(makeButton({ r: 0.19, color: faceColor, top: labelTex(faceColor, F.cu, '#f2f2f2') }), 950, 358, 'cu');
    put(makeButton({ r: 0.19, color: faceColor, top: labelTex(faceColor, F.cr, '#f2f2f2') }), 1022, 430, 'cr');
    put(makeButton({ r: 0.19, color: faceColor, top: labelTex(faceColor, F.cl, '#f2f2f2') }), 878, 430, 'cl');
    put(makeButton({ r: 0.19, color: faceColor, top: labelTex(faceColor, F.south, '#f2f2f2') }), 950, 502);
    // right stick (decorative)
    const rs = new THREE.Group();
    const [rx, rz] = W(810, 620);
    rs.position.set(rx, TOP, rz);
    const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 48), plastic('#1c1d21'));
    const rc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.12, 48), [plastic('#26282d'), plastic('#fff', { map: labelTex('#2a2c31', null, '#34363c', 'rings'), rough: 0.6 }), plastic('#999')]);
    rc.position.y = 0.38; rc.castShadow = true;
    const rsh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.34, 24), plastic('#1b1c20')); rsh.position.y = 0.17;
    rs.add(rw, rsh, rc); rig.add(rs);
    // D-pad as four separate arms so up/down can press individually
    const [dx, dz] = W(470, 620);
    const dmat = () => plastic('#23252a', { rough: 0.5 });
    const arm = (ax, az) => {
      const g = new THREE.Group();
      const m = dmat();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.26), m);
      mesh.position.y = 0.05; mesh.castShadow = true;
      g.add(mesh);
      const sp = glowSprite(0.9); sp.position.y = 0.15; g.add(sp);
      g.position.set(dx + ax, TOP, dz + az);
      rig.add(g);
      return { group: g, mats: [m], sprite: sp, baseY: TOP, depth: 0.04 };
    };
    parts.sharp = arm(0, -0.25);
    parts.flat = arm(0, 0.25);
    arm(-0.25, 0); arm(0.25, 0);
    const center = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.26), dmat());
    center.position.set(dx, TOP + 0.05, dz); rig.add(center);
    // Small +/- and home buttons
    for (const [x, y, c] of [[540, 330, '#3a3c42'], [740, 330, '#3a3c42'], [700, 430, '#3a3c42'], [580, 430, '#3a3c42']]) put(makeButton({ r: 0.08, h: 0.05, color: c }), x, y);
    // Shoulders: L / R along the top edge, ZL / ZR behind
    const sh = (x, label, back) => {
      const g = new THREE.Group();
      const m = plastic(back ? '#1f2024' : '#33353b', { rough: 0.5 });
      const cap = new THREE.Mesh(new THREE.CapsuleGeometry(back ? 0.12 : 0.14, 1.05, 8, 24), m);
      cap.rotation.z = Math.PI / 2; cap.castShadow = true;
      g.add(cap);
      const sp = glowSprite(1.4); g.add(sp);
      const [X, Z] = W(x, back ? 200 : 232);
      g.position.set(X, TOP - (back ? 0.05 : 0.2), Z);
      rig.add(g);
      const part = { group: g, mats: [m], sprite: sp, baseY: g.position.y, depth: 0.06 };
      if (label) { part.chip = st.addLabel(label, 's-chip'); part.anchor = g; part.chipOff = new THREE.Vector3(0, 0.3, -0.3); }
      return part;
    };
    sh(330, null, true); sh(950, null, true);
    parts.a = sh(345, F.a);
    parts.cd = sh(935, F.cd);
  }

  const box = new THREE.Box3().setFromObject(rig);
  st.ground.position.y = box.min.y - 0.02;
  rig.rotation.x = 0.0;

  return {
    el: st.el,
    update(f, s, dt) {
      for (const k of ['a', 'cd', 'cr', 'cl', 'cu', 'sharp', 'flat']) {
        const part = parts[k]; if (!part) continue;
        const on = k === 'sharp' ? s.sharp : k === 'flat' ? s.flat : !!s.notes[k];
        setLit(part, on, dt);
        if (part.chip) { part.chip.classList.toggle('on', !!on); st.place(part.chip, part.anchor, part.chipOff); }
      }
      const pv = parts.stick.pivot;
      const tx = -s.bendY * 0.38, tz = -s.vibX * 0.38;
      pv.rotation.x += (tx - pv.rotation.x) * Math.min(1, dt * 30);
      pv.rotation.z += (tz - pv.rotation.z) * Math.min(1, dt * 30);
      setLit(parts.stick, Math.abs(s.bendY) > 0.05 || Math.abs(s.vibX) > 0.05, dt);
      st.render();
    },
    dispose: () => st.dispose(),
  };
}
