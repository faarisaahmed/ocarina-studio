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

// ---------------------------------------------------------------- Pro controller (traced, 960 x 720 space)
const PRO = { body: '#2c2d31', line: '#141517', panel: '#303136', face: '#1e1f22', faceLine: '#101113', mark: '#ececec', well: '#1b1c1f', ring: '#d9d9d9', cap: '#2a2b2f', shoulder: '#3c3d42' };

export function proSVG(labels) {
  const P = PRO;
  const face = (k, x, y, t) => `<g class="pk" ${k ? `data-k="${k}"` : ''}><circle cx="${x}" cy="${y}" r="34" fill="${P.face}" stroke="${P.faceLine}" stroke-width="3"/><text x="${x}" y="${y + 1}" class="pad-letter" fill="${P.mark}">${t}</text></g>`;
  const stick = (cls, x, y) => `<circle cx="${x}" cy="${y}" r="66" fill="${P.well}"/><circle cx="${x}" cy="${y}" r="54" fill="${P.ring}"/>
    <g class="${cls}" data-cx="${x}" data-cy="${y}"><circle cx="${x}" cy="${y}" r="46" fill="${P.cap}" stroke="${P.line}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="33" fill="none" stroke="${P.line}" stroke-width="2" opacity=".6"/></g>`;
  return `<svg class="pad2d pad-pro" viewBox="0 0 960 720" role="img" aria-label="Pro Controller">
    <g class="pk pk-sh" data-k="a"><path d="M200 150 C220 122 262 110 330 106 L420 104 L420 126 L214 166 Z" fill="${P.shoulder}"/></g>
    <g class="pk pk-sh" data-k="cd"><path d="M834 150 C814 122 772 110 704 106 L614 104 L614 126 L820 166 Z" fill="${P.shoulder}"/></g>
    <path class="pad-outline" d="M517 110 C640 110 730 108 790 118 C850 130 878 180 890 250 C906 340 912 440 905 520 C898 600 872 652 828 664 C788 674 760 650 744 606 C726 556 712 500 684 474 C664 458 640 454 600 454 L434 454 C394 454 370 458 350 474 C322 500 308 556 290 606 C274 650 246 674 206 664 C162 652 136 600 129 520 C122 440 128 340 144 250 C156 180 184 130 244 118 C304 108 394 110 517 110 Z"
      fill="${P.body}" stroke="${P.line}" stroke-width="4"/>
    <path d="M215 180 C230 150 270 140 330 138 L700 138 C760 140 800 150 815 180 L868 330 C878 400 858 432 808 438 L226 438 C176 432 156 400 166 330 Z" fill="${P.panel}" stroke="${P.line}" stroke-width="2" opacity=".9"/>
    ${stick('stick', 283, 210)}
    <!-- D-pad -->
    <g transform="translate(397 327)">
      <path d="M-24 -72 h48 a5 5 0 0 1 5 5 v43 h43 a5 5 0 0 1 5 5 v38 a5 5 0 0 1 -5 5 h-43 v43 a5 5 0 0 1 -5 5 h-48 a5 5 0 0 1 -5 -5 v-43 h-43 a5 5 0 0 1 -5 -5 v-38 a5 5 0 0 1 5 -5 h43 v-43 a5 5 0 0 1 5 -5 Z" fill="${P.face}" stroke="${P.faceLine}" stroke-width="3"/>
      <g class="pk pk-dp" data-k="sharp"><path d="M-24 -72 h48 a5 5 0 0 1 5 5 v43 h-58 v-43 a5 5 0 0 1 5 -5 Z" fill="${P.face}"/><path d="M0 -58 l9 13 h-18 Z" fill="${P.mark}"/></g>
      <g class="pk pk-dp" data-k="flat"><path d="M-29 24 h58 v43 a5 5 0 0 1 -5 5 h-48 a5 5 0 0 1 -5 -5 Z" fill="${P.face}"/><path d="M0 58 l9 -13 h-18 Z" fill="${P.mark}"/></g>
      <path d="M-58 0 l13 -9 v18 Z M58 0 l-13 -9 v18 Z" fill="${P.mark}"/>
    </g>
    ${stick('', 645, 318)}
    <!-- small buttons -->
    <circle cx="418" cy="160" r="19" fill="${P.face}"/><rect x="408" y="158" width="20" height="4" rx="2" fill="${P.mark}"/>
    <circle cx="619" cy="158" r="19" fill="${P.face}"/><path d="M617 149 h4 v7 h7 v4 h-7 v7 h-4 v-7 h-7 v-4 h7 Z" fill="${P.mark}"/>
    <rect x="451" y="201" width="34" height="34" rx="7" fill="${P.face}"/><circle cx="468" cy="218" r="8" fill="none" stroke="${P.mark}" stroke-width="2"/>
    <circle cx="573" cy="216" r="20" fill="${P.face}"/><path d="M573 207 l9 8 v9 h-18 v-9 Z" fill="none" stroke="${P.mark}" stroke-width="2"/>
    <rect x="511" y="380" width="34" height="34" rx="7" fill="${P.face}"/><text x="528" y="398" class="pad-letter" fill="${P.mark}" font-size="16">C</text>
    <!-- face buttons -->
    ${face('cu', 735, 157, labels.cu)}${face('cl', 676, 211, labels.cl)}${face('cr', 815, 211, labels.cr)}${face('', 755, 266, labels.south)}
    <g class="pk pk-tag" data-k="a"><rect x="250" y="30" width="110" height="46" rx="12" fill="${P.shoulder}"/><text x="305" y="54" class="pad-tag">${labels.a}</text></g>
    <g class="pk pk-tag" data-k="cd"><rect x="600" y="30" width="110" height="46" rx="12" fill="${P.shoulder}"/><text x="655" y="54" class="pad-tag">${labels.cd}</text></g>
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
