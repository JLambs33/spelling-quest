// ============================================================
//  Pixel-art mob grid builder
//  Single-char tokens map to hex colors; '.' = transparent
// ============================================================
function parseGrid(rows, palette) {
  return rows.map(row => row.map(t => palette[t] || null));
}

const T = '.';

const MOBS = [
  // 0 — CREEPER
  {
    name: 'Creeper',
    scale: 10,
    grid: parseGrid([
      [T,  'G','G','G','G','G','G', T ],
      ['G','G','G','G','G','G','G','G'],
      ['G','B','B','G','G','B','B','G'],
      ['G','B','B','G','G','B','B','G'],
      ['G','G','G','G','G','G','G','G'],
      ['G','G','B','B','B','B','G','G'],
      ['G','G','B','G','G','B','G','G'],
      ['G','G','G','G','G','G','G','G'],
    ], { G: '#5DA832', B: '#1A1A1A' }),
  },

  // 1 — PIG
  {
    name: 'Pig',
    scale: 10,
    grid: parseGrid([
      [T,  'P','P','P','P','P','P', T ],
      ['P','P','P','P','P','P','P','P'],
      ['P','B','B','P','P','B','B','P'],
      ['P','P','P','P','P','P','P','P'],
      ['P','S','S','S','S','S','S','P'],
      ['P','S','B','S','S','B','S','P'],
      ['P','S','S','S','S','S','S','P'],
      [T,  'P','P','P','P','P','P', T ],
    ], { P: '#F7A7B5', S: '#E86090', B: '#1A1A1A' }),
  },

  // 2 — COW
  {
    name: 'Cow',
    scale: 10,
    grid: parseGrid([
      ['H','H','N','N','N','N','H','H'],
      ['N','N','N','N','N','N','N','N'],
      ['N','L','L','N','N','L','L','N'],
      ['N','L','B','L','L','B','L','N'],
      ['N','N','N','N','N','N','N','N'],
      ['N','P','P','P','P','P','P','N'],
      ['N','P','B','P','P','B','P','N'],
      ['N','N','N','N','N','N','N','N'],
    ], { N: '#6B3E26', L: '#C4843B', B: '#1A1A1A', P: '#F7A7B5', H: '#D4A843' }),
  },

  // 3 — CHICKEN
  {
    name: 'Chicken',
    scale: 10,
    grid: parseGrid([
      [T,  T,  'R','R', T,  T,  T,  T ],
      [T,  'W','W','W','W','W', T,  T ],
      ['W','W','B','W','W','B','W', T ],
      ['D','W','W','Y','Y','W','W', T ],
      [T,  'W','W','W','W','W','W', T ],
      [T,  T,  'W','W','W','W', T,  T ],
      [T,  T,  'O', T,  T,  'O', T,  T ],
      [T,  T,  'O', T,  T,  'O', T,  T ],
    ], { W: '#FFFFFF', R: '#CC0000', B: '#1A1A1A', D: '#CC3333', Y: '#FFDD00', O: '#FF8800' }),
  },

  // 4 — ENDERMAN (taller: 12 rows)
  {
    name: 'Enderman',
    scale: 8,
    grid: parseGrid([
      [T,  'E','E','E','E','E','E', T ],
      ['E','E','E','E','E','E','E','E'],
      ['E','U','U','E','E','U','U','E'],
      ['E','U','U','E','E','U','U','E'],
      ['E','E','E','E','E','E','E','E'],
      [T,  'E','E','E','E','E','E', T ],
      [T,  'E','E','E','E','E','E', T ],
      [T,  'E','E','E','E','E','E', T ],
      [T,  T,  'E', T,  T,  'E', T,  T ],
      [T,  T,  'E', T,  T,  'E', T,  T ],
      [T,  T,  'E', T,  T,  'E', T,  T ],
      [T,  T,  'E', T,  T,  'E', T,  T ],
    ], { E: '#1A1A2E', U: '#9400D3' }),
  },

  // 5 — SHEEP
  {
    name: 'Sheep',
    scale: 10,
    grid: parseGrid([
      ['W','W','W','W','W','W','W','W'],
      ['W','W','W','W','W','W','W','W'],
      ['W','W','F','F','F','F','W','W'],
      ['W','F','B','F','F','B','F','W'],
      ['W','F','F','F','F','F','F','W'],
      ['W','F','M','M','M','M','F','W'],
      ['W','W','W','W','W','W','W','W'],
      ['W','W','W','W','W','W','W','W'],
    ], { W: '#E8E8E8', F: '#888888', B: '#1A1A1A', M: '#AAAAAA' }),
  },
];

// ============================================================
//  Canvas renderer
// ============================================================
function drawMob(canvas, mob) {
  const { scale, grid } = mob;
  const cols = grid[0].length;
  const rows = grid.length;
  canvas.width  = cols * scale;
  canvas.height = rows * scale;
  canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.forEach((row, r) => {
    row.forEach((color, c) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(c * scale, r * scale, scale, scale);
    });
  });
}

// ============================================================
//  revealMob — insert canvas + name into #champion-mob
// ============================================================
function revealMob(mobIndex) {
  const mob = MOBS[mobIndex % MOBS.length];
  const container = document.getElementById('champion-mob');
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;margin:0 auto;image-rendering:pixelated;';
  drawMob(canvas, mob);

  // Pop-in animation via wrapper
  const wrap = document.createElement('div');
  wrap.style.cssText = 'animation:pop-in 500ms ease-out forwards;';
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  const label = document.createElement('p');
  label.style.cssText = 'font-family:var(--font-main);font-size:12px;color:var(--mc-gold);text-shadow:2px 2px 0 #000;margin-top:12px;text-align:center;';
  label.textContent = mob.name + '!';
  container.appendChild(label);
}

// ============================================================
//  triggerBlockBurst — particles fly out on correct answer
// ============================================================
const BURST_COLORS = [
  '#5C9A27','#8B5E3C','#7F7F7F',
  '#FFAA00','#4FC3F7','#FF5722','#E91E63',
];

function triggerBlockBurst() {
  const count = 20;
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight * 0.42;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'block-particle';
    const color = BURST_COLORS[i % BURST_COLORS.length];
    el.style.cssText =
      `left:${cx}px;top:${cy}px;background:${color};` +
      `transform:translate(-50%,-50%);opacity:1;`;
    document.body.appendChild(el);

    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist  = 50 + Math.random() * 160;
    const dx    = Math.cos(angle) * dist;
    const dy    = Math.sin(angle) * dist - 40; // bias upward

    // Double rAF: let browser paint the initial position before transitioning
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'transform 680ms ease-out, opacity 680ms ease-in';
      el.style.transform  = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      el.style.opacity    = '0';
    }));

    setTimeout(() => el.remove(), 750);
  }
}

// ============================================================
//  Exports
// ============================================================
const rewards = { triggerBlockBurst, revealMob };
