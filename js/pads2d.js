// Flat 2D drawings of the ocarina and controllers. No gradients or shading:
// flat fills and thin outlines, with proportions traced from reference photos.
// Each pressable part carries data-k (a, cd, cr, cl, cu, sharp, flat).

const FLAT = {
  n64Body: '#c3c4c6', n64Line: '#8f9194', n64Dark: '#6f7174', n64Plate: '#cfd0d2',
  dpad: '#4a4b4f', dpadMark: '#626368',
  yellow: '#f4cb1d', yellowMark: '#c99d06', yellowLine: '#b8900a',
  green: '#1f8f3f', greenMark: '#17702f', blue: '#2a3eae', blueMark: '#1f2f88', red: '#d6452a', redMark: '#a8321c',
  stickRing: '#58595d', stickGate: '#3a3b3e', stickCap: '#e2e2e2', stickLine: '#c4c4c4',
};

// ---------------------------------------------------------------- N64 (traced, 1280 x 1260 space)
export function n64SVG() {
  const F = FLAT;
  const cbtn = (k, x, y, rot) => `<g class="pk" data-k="${k}">
      <circle cx="${x}" cy="${y}" r="35" fill="${F.yellow}" stroke="${F.yellowLine}" stroke-width="4"/>
      <path d="M${x} ${y - 17} L${x + 15} ${y + 10} L${x - 15} ${y + 10} Z" transform="rotate(${rot} ${x} ${y})" fill="${F.yellowMark}"/>
    </g>`;
  return `<svg class="pad2d pad-n64" viewBox="0 0 1280 1260" role="img" aria-label="N64 controller">
    <!-- shoulder buttons peeking out behind the top edge -->
    <path d="M128 232 C150 170 250 138 330 132 L400 132 L400 190 L150 260 Z" fill="${F.n64Dark}"/>
    <g class="pk pk-sh" data-k="sharp"><path d="M1152 232 C1130 170 1030 138 950 132 L880 132 L880 190 L1130 260 Z" fill="${F.n64Dark}"/></g>
    <path class="pad-outline" d="M640 88 C760 88 868 90 884 138 C1000 140 1120 160 1180 222 C1250 292 1266 420 1256 520 C1244 650 1220 800 1184 930 C1164 1000 1100 1004 1082 952 C1050 878 1030 760 990 682 C960 630 870 622 832 682 C800 760 762 1000 722 1182 C702 1262 578 1262 558 1182 C518 1000 480 760 448 682 C410 622 320 630 290 682 C250 760 230 878 198 952 C180 1004 116 1000 96 930 C60 800 36 650 24 520 C14 420 30 292 100 222 C160 160 280 140 396 138 C412 90 520 88 640 88 Z"
      fill="${F.n64Body}" stroke="${F.n64Line}" stroke-width="5"/>
    <!-- raised centre panel seam -->
    <path d="M400 140 C420 230 430 300 470 330 L810 330 C850 300 860 230 880 140" fill="none" stroke="${F.n64Line}" stroke-width="3" opacity=".7"/>
    <rect x="512" y="160" width="256" height="62" rx="31" fill="none" stroke="${F.n64Line}" stroke-width="4"/>
    <!-- D-pad -->
    <circle cx="262" cy="420" r="128" fill="${F.n64Plate}"/>
    <path d="M227 316 h70 a6 6 0 0 1 6 6 v63 h63 a6 6 0 0 1 6 6 v70 a6 6 0 0 1 -6 6 h-63 v63 a6 6 0 0 1 -6 6 h-70 a6 6 0 0 1 -6 -6 v-63 h-63 a6 6 0 0 1 -6 -6 v-70 a6 6 0 0 1 6 -6 h63 v-63 a6 6 0 0 1 6 -6 Z" fill="${F.dpad}"/>
    <g fill="${F.dpadMark}"><path d="M262 336 l14 22 h-28 Z"/><path d="M262 504 l14 -22 h-28 Z"/><path d="M178 420 l22 -14 v28 Z"/><path d="M346 420 l-22 -14 v28 Z"/></g>
    <circle cx="262" cy="420" r="14" fill="${F.dpadMark}"/>
    <!-- Start -->
    <circle cx="645" cy="450" r="46" fill="${F.red}" stroke="${F.redMark}" stroke-width="4"/>
    <text x="645" y="452" class="pad-emb" fill="${F.redMark}" font-size="24">START</text>
    <!-- B / A -->
    <path d="M900 470 L940 505" stroke="${F.n64Line}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="876" cy="440" r="48" fill="${F.green}" stroke="${F.greenMark}" stroke-width="4"/>
    <text x="872" y="444" class="pad-emb" fill="${F.greenMark}" font-size="46">B</text>
    <g class="pk" data-k="a"><circle cx="965" cy="532" r="49" fill="${F.blue}" stroke="${F.blueMark}" stroke-width="4"/>
      <text x="961" y="536" class="pad-emb" fill="${F.blueMark}" font-size="46">A</text></g>
    <!-- C buttons -->
    <circle cx="1055" cy="370" r="112" fill="${F.n64Plate}" stroke="${F.n64Line}" stroke-width="3"/>
    <text x="1056" y="374" class="pad-emb" fill="${F.n64Line}" font-size="36">C</text>
    ${cbtn('cu', 1053, 300, 0)}${cbtn('cd', 1056, 440, 180)}${cbtn('cl', 984, 368, 270)}${cbtn('cr', 1128, 372, 90)}
    <!-- Control Stick -->
    <circle cx="648" cy="690" r="128" fill="${F.stickRing}"/>
    <path d="M613 607 H683 L731 655 V725 L683 773 H613 L565 725 V655 Z" fill="${F.stickGate}"/>
    <g class="stick" data-cx="648" data-cy="690">
      <circle cx="648" cy="690" r="54" fill="${F.stickCap}" stroke="${F.stickLine}" stroke-width="4"/>
      <circle cx="648" cy="690" r="40" fill="none" stroke="${F.stickLine}" stroke-width="3"/>
      <circle cx="648" cy="690" r="27" fill="none" stroke="${F.stickLine}" stroke-width="3"/>
      <circle cx="648" cy="690" r="5" fill="#3a3b3e"/>
    </g>
    <!-- Z trigger is underneath the centre prong -->
    <g class="pk pk-tag" data-k="flat"><rect x="580" y="1010" width="120" height="58" rx="14" fill="${F.n64Dark}"/><text x="640" y="1040" class="pad-tag">Z</text></g>
    <text x="640" y="1100" class="pad-note">trigger underneath</text>
    <g class="pk pk-tag" data-k="sharp"><rect x="955" y="40" width="120" height="58" rx="14" fill="${F.n64Dark}"/><text x="1015" y="70" class="pad-tag">R</text></g>
  </svg>`;
}

// ---------------------------------------------------------------- Switch 2 Pro Controller (traced, 1920 x 1920 space, front view)
const PRO = { body: '#2b2c2f', line: '#141517', seam: '#1d1e21', face: '#2a2b2e', faceLine: '#18191b', mark: '#d4d4d4', well: '#252629', ring: '#3a3b3f', cap: '#2e2f33', capLine: '#202124', shoulder: '#d8d9db', shoulderLine: '#a9abae' };

export function proSVG(labels) {
  const P = PRO;
  const face = (k, x, y, t) => `<g class="pk" ${k ? `data-k="${k}"` : ''}><circle cx="${x}" cy="${y}" r="72" fill="${P.face}" stroke="${P.faceLine}" stroke-width="6"/><text x="${x}" y="${y + 2}" class="pad-letter" fill="${P.mark}" font-size="62">${t}</text></g>`;
  const stick = (cls, x, y) => `<circle cx="${x}" cy="${y}" r="160" fill="${P.well}" stroke="${P.seam}" stroke-width="5"/>
    <g class="${cls}" data-cx="${x}" data-cy="${y}"><circle cx="${x}" cy="${y}" r="122" fill="${P.ring}" stroke="${P.capLine}" stroke-width="6"/><circle cx="${x}" cy="${y}" r="92" fill="${P.cap}" stroke="${P.capLine}" stroke-width="5"/></g>`;
  return `<svg class="pad2d pad-pro" viewBox="0 170 1920 1490" role="img" aria-label="Switch 2 Pro Controller">
    <g class="pk pk-sh" data-k="a"><path d="M248 470 C262 380 320 330 420 318 C500 310 560 312 600 322 L600 360 L248 470 Z" fill="${P.shoulder}" stroke="${P.shoulderLine}" stroke-width="4"/></g>
    <g class="pk pk-sh" data-k="cd"><path d="M1672 470 C1658 380 1600 330 1500 318 C1420 310 1360 312 1320 322 L1320 360 L1672 470 Z" fill="${P.shoulder}" stroke="${P.shoulderLine}" stroke-width="4"/></g>
    <path class="pad-outline" d="M960 340 C1150 340 1330 342 1470 360 C1600 378 1672 430 1702 560 C1740 720 1790 960 1838 1220 C1870 1370 1872 1475 1835 1545 C1795 1615 1695 1635 1630 1600 C1575 1570 1520 1470 1480 1375 C1450 1310 1405 1250 1340 1236 C1260 1222 1100 1222 960 1222 C820 1222 660 1222 580 1236 C515 1250 470 1310 440 1375 C400 1470 345 1570 290 1600 C225 1635 125 1615 85 1545 C48 1475 52 1370 82 1220 C130 960 180 720 218 560 C248 430 320 378 450 360 C590 342 770 340 960 340 Z"
      fill="${P.body}" stroke="${P.line}" stroke-width="7"/>
    <path d="M240 560 C260 470 320 420 450 408 L1470 408 C1600 420 1660 470 1680 560 C1700 700 1720 880 1700 1010 C1680 1120 1600 1176 1460 1184 L460 1184 C320 1176 240 1120 220 1010 C200 880 220 700 240 560 Z" fill="none" stroke="${P.seam}" stroke-width="5"/>
    ${stick('stick', 470, 700)}
    <!-- D-pad -->
    <g transform="translate(697 960)">
      <path d="M-52 -146 h104 a10 10 0 0 1 10 10 v84 h84 a10 10 0 0 1 10 10 v84 a10 10 0 0 1 -10 10 h-84 v84 a10 10 0 0 1 -10 10 h-104 a10 10 0 0 1 -10 -10 v-84 h-84 a10 10 0 0 1 -10 -10 v-84 a10 10 0 0 1 10 -10 h84 v-84 a10 10 0 0 1 10 -10 Z" fill="${P.face}" stroke="${P.faceLine}" stroke-width="7"/>
      <g class="pk pk-dp" data-k="sharp"><path d="M-52 -146 h104 a10 10 0 0 1 10 10 v84 h-124 v-84 a10 10 0 0 1 10 -10 Z" fill="${P.face}"/><path d="M0 -102 l14 20 h-28 Z" fill="${P.mark}"/></g>
      <g class="pk pk-dp" data-k="flat"><path d="M-62 52 h124 v84 a10 10 0 0 1 -10 10 h-104 a10 10 0 0 1 -10 -10 Z" fill="${P.face}"/><path d="M0 102 l14 -20 h-28 Z" fill="${P.mark}"/></g>
      <path d="M-102 0 l20 -14 v28 Z M102 0 l-20 -14 v28 Z" fill="${P.mark}"/>
    </g>
    ${stick('', 1185, 945)}
    <!-- small buttons -->
    <circle cx="742" cy="560" r="46" fill="${P.face}" stroke="${P.faceLine}" stroke-width="5"/><rect x="718" y="555" width="48" height="10" rx="5" fill="${P.mark}"/>
    <circle cx="1180" cy="560" r="46" fill="${P.face}" stroke="${P.faceLine}" stroke-width="5"/><path d="M1175 536 h10 v19 h19 v10 h-19 v19 h-10 v-19 h-19 v-10 h19 Z" fill="${P.mark}"/>
    <rect x="811" y="665" width="76" height="76" rx="12" fill="${P.face}" stroke="${P.faceLine}" stroke-width="5"/><circle cx="849" cy="703" r="20" fill="none" stroke="${P.mark}" stroke-width="5"/>
    <circle cx="1072" cy="703" r="45" fill="${P.face}" stroke="${P.faceLine}" stroke-width="5"/><path d="M1072 684 l20 18 v20 h-40 v-20 Z" fill="${P.mark}"/>
    <rect x="922" y="1062" width="76" height="76" rx="12" fill="${P.face}" stroke="${P.faceLine}" stroke-width="5"/><text x="960" y="1102" class="pad-letter" fill="${P.mark}" font-size="44">C</text>
    <!-- face buttons -->
    ${face('cu', 1432, 578, labels.cu)}${face('cl', 1284, 705, labels.cl)}${face('cr', 1580, 705, labels.cr)}${face('', 1432, 832, labels.south)}
    <g class="pk pk-tag" data-k="a"><rect x="300" y="186" width="220" height="96" rx="24" fill="#3c3d42"/><text x="410" y="236" class="pad-tag" font-size="56">${labels.a}</text></g>
    <g class="pk pk-tag" data-k="cd"><rect x="1400" y="186" width="220" height="96" rx="24" fill="#3c3d42"/><text x="1510" y="236" class="pad-tag" font-size="56">${labels.cd}</text></g>
  </svg>`;
}

// ---------------------------------------------------------------- Ocarina (top view, 1000 x 520 space)
const OC = { blue: '#2c5fc9', line: '#173d8c', hole: '#0b1222', rim: '#1d48a6', silver: '#c5cbd3', silverLine: '#7f8792', silverDark: '#9aa2ad' };
export const OC_HOLES = {
  cu: [335, 190, 24], cl: [450, 166, 25], cr: [570, 164, 25], cd: [690, 180, 23], a: [800, 214, 20],
  sharp: [510, 300, 13], flat: [630, 296, 13],
};

export function ocarinaSVG(icons) {
  const holes = Object.entries(OC_HOLES).map(([k, [x, y, r]]) => {
    const mod = k === 'sharp' || k === 'flat';
    const ly = mod ? y + r + 40 : y - r - 42;
    return `<g class="pk hole" data-k="${k}"><circle cx="${x}" cy="${y}" r="${r + 7}" fill="${OC.rim}"/><circle class="pit" cx="${x}" cy="${y}" r="${r}" fill="${OC.hole}"/></g>
      <foreignObject x="${x - 30}" y="${ly - 30}" width="60" height="60" class="oc-lab" data-l="${k}"><div xmlns="http://www.w3.org/1999/xhtml">${icons[k]}</div></foreignObject>`;
  }).join('');
  return `<svg class="pad2d ocarina2d" viewBox="0 0 1000 520" role="img" aria-label="Ocarina">
    <g class="oc-rig">
      <!-- mouthpiece -->
      <path d="M246 296 L148 366 C122 384 120 418 138 434 C156 450 182 448 204 432 L304 362 Z" fill="${OC.silver}" stroke="${OC.silverLine}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M146 404 L176 428" stroke="${OC.hole}" stroke-width="9" stroke-linecap="round"/>
      <path d="M236 306 L312 356" stroke="${OC.silverLine}" stroke-width="5"/>
      <!-- body -->
      <path d="M205 250 C200 160 310 108 455 104 C610 100 770 140 890 205 C935 230 955 262 940 285 C925 306 880 318 840 328 C730 356 590 384 450 388 C300 392 210 340 205 250 Z" fill="${OC.blue}" stroke="${OC.line}" stroke-width="6"/>
      <!-- labium window -->
      <path d="M268 300 L300 282 L312 300 L282 318 Z" fill="${OC.hole}"/>
      ${holes}
      <g class="oc-air"><path d="M118 452 q-26 8 -34 34"/><path d="M100 436 q-40 12 -52 52"/></g>
    </g>
    <text x="565" y="430" class="pad-note oc-note">♯ and ♭ are the two small sub-holes</text>
  </svg>`;
}
