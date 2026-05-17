const sceneBg = (() => {
  // ── Canvas ──────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W, H, BS;

  // ── Day/night cycle ─────────────────────────────────────────
  // t=0 midnight · t=0.25 dawn · t=0.5 noon · t=0.75 dusk · t=1 midnight
  const CYCLE      = 180000; // 3-minute full day
  const CYCLE_START = 0.35;  // begin at mid-morning
  let lastTs = 0;

  function cycleTime(ts) { return (CYCLE_START + ts / CYCLE) % 1; }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v)    { return Math.max(0, Math.min(1, v)); }
  function fadeIn(t, start, end)  { return clamp01((t - start) / (end - start)); }
  function fadeOut(t, start, end) { return clamp01(1 - (t - start) / (end - start)); }

  // Sky top/horizon [r,g,b] at key moments
  const SKY = {
    night: { top: [8,8,40],    hor: [15,15,70]    },
    dawn:  { top: [180,80,40], hor: [255,160,80]  },
    day:   { top: [58,123,173],hor: [135,206,235] },
    dusk:  { top: [150,60,30], hor: [240,130,60]  },
  };

  function lerpRgb(a, b, t) { return a.map((v, i) => lerp(v, b[i], t)); }
  function rgb(c)            { return `rgb(${c.map(Math.round).join(',')})`; }

  function getSkyColors(t) {
    if (t < 0.20) return SKY.night;
    if (t < 0.28) { const p = fadeIn(t, 0.20, 0.28); return { top: lerpRgb(SKY.night.top, SKY.dawn.top, p),  hor: lerpRgb(SKY.night.hor, SKY.dawn.hor, p)  }; }
    if (t < 0.36) { const p = fadeIn(t, 0.28, 0.36); return { top: lerpRgb(SKY.dawn.top,  SKY.day.top,  p),  hor: lerpRgb(SKY.dawn.hor,  SKY.day.hor,  p)  }; }
    if (t < 0.64) return SKY.day;
    if (t < 0.72) { const p = fadeIn(t, 0.64, 0.72); return { top: lerpRgb(SKY.day.top,   SKY.dusk.top, p),  hor: lerpRgb(SKY.day.hor,   SKY.dusk.hor, p)  }; }
    if (t < 0.80) { const p = fadeIn(t, 0.72, 0.80); return { top: lerpRgb(SKY.dusk.top,  SKY.night.top,p),  hor: lerpRgb(SKY.dusk.hor,  SKY.night.hor,p)  }; }
    return SKY.night;
  }

  function nightAlpha(t) {
    if (t < 0.20) return 1;
    if (t < 0.36) return fadeOut(t, 0.20, 0.36);
    if (t < 0.64) return 0;
    if (t < 0.80) return fadeIn(t, 0.64, 0.80);
    return 1;
  }

  // ── Sky & stars ─────────────────────────────────────────────
  const STARS = Array.from({ length: 45 }, () => ({
    xf: Math.random(), yf: Math.random() * 0.38,
    r: Math.random() > 0.7 ? 2 : 1,
    phase: Math.random() * Math.PI * 2,
  }));

  function drawSky(t, ts) {
    const sc = getSkyColors(t);
    const grad = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    grad.addColorStop(0, rgb(sc.top));
    grad.addColorStop(1, rgb(sc.hor));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H * 0.45);

    const na = nightAlpha(t);
    if (na > 0) {
      const now = ts / 1000;
      STARS.forEach(s => {
        const twinkle = 0.5 + 0.5 * Math.sin(now * 1.8 + s.phase);
        ctx.fillStyle = `rgba(255,255,220,${na * (0.5 + 0.5 * twinkle)})`;
        ctx.fillRect(s.xf * W, s.yf * H, s.r, s.r);
      });
    }
  }

  // ── Sun ──────────────────────────────────────────────────────
  function sunXY(t) {
    if (t < 0.25 || t > 0.75) return null;
    const p = (t - 0.25) / 0.5;
    return {
      x: W * (0.06 + p * 0.88),
      y: H * (0.36 - 0.29 * Math.sin(p * Math.PI)),
    };
  }

  function drawSun(t) {
    const pos = sunXY(t);
    if (!pos) return;
    const { x, y } = pos;
    const S  = BS * 2;
    const rw = Math.max(3, Math.round(BS / 5));
    const rl = Math.round(BS * 0.75);
    const dr = Math.round(rl * 0.55);

    ctx.fillStyle = '#FFDD33';
    ctx.fillRect(x - rw / 2, y - S / 2 - rl, rw, rl);           // top
    ctx.fillRect(x - rw / 2, y + S / 2 + 1,  rw, rl);           // bottom
    ctx.fillRect(x - S / 2 - rl, y - rw / 2, rl, rw);           // left
    ctx.fillRect(x + S / 2 + 1,  y - rw / 2, rl, rw);           // right
    ctx.fillRect(x - S / 2 - dr, y - S / 2 - dr, rw, rw);       // diag TL
    ctx.fillRect(x + S / 2 + dr - rw, y - S / 2 - dr, rw, rw);  // diag TR
    ctx.fillRect(x - S / 2 - dr, y + S / 2 + dr - rw, rw, rw);  // diag BL
    ctx.fillRect(x + S / 2 + dr - rw, y + S / 2 + dr - rw, rw, rw); // diag BR

    ctx.fillStyle = '#FFEE00';
    ctx.fillRect(x - S / 2, y - S / 2, S, S);
    ctx.fillStyle = '#FFFF88';
    ctx.fillRect(x - S / 2 + 3, y - S / 2 + 3, Math.round(S * 0.35), Math.round(S * 0.35));
  }

  // ── Moon ─────────────────────────────────────────────────────
  function moonXY(t) {
    let p;
    if (t < 0.25)      p = (t + 0.25) / 0.5;
    else if (t > 0.75) p = (t - 0.75) / 0.5;
    else               return null;
    return {
      x: W * (0.06 + p * 0.88),
      y: H * (0.36 - 0.29 * Math.sin(p * Math.PI)),
      a: nightAlpha(t),
    };
  }

  function drawMoon(t) {
    const pos = moonXY(t);
    if (!pos || pos.a <= 0) return;
    const { x, y, a } = pos;
    const S = Math.round(BS * 1.6);
    ctx.fillStyle = `rgba(220,220,200,${a})`;
    ctx.fillRect(x - S / 2, y - S / 2, S, S);
    ctx.fillStyle = `rgba(170,170,150,${a})`;
    ctx.fillRect(x - S / 2 + 3, y - S / 2 + 3, Math.round(S * 0.3), Math.round(S * 0.3));
    ctx.fillRect(x + Math.round(S * 0.2), y + Math.round(S * 0.3), Math.round(S * 0.25), Math.round(S * 0.2));
  }

  // ── Clouds ───────────────────────────────────────────────────
  const CLOUDS = [
    { xf: 0.08, yf: 0.10, w: 5, speed: 0.000030 },
    { xf: 0.46, yf: 0.06, w: 4, speed: 0.000018 },
    { xf: 0.74, yf: 0.15, w: 6, speed: 0.000024 },
  ];

  function drawCloud(xPx, yFrac, numBlocks, t) {
    const by  = H * yFrac;
    const bw  = Math.round(BS * 1.1);
    const bh  = Math.round(BS * 0.65);
    const tw  = bw * numBlocks;
    const na  = nightAlpha(t);
    const lit = na > 0 ? `rgba(200,200,210,${1 - na * 0.5})` : '#F8F8F8';
    const brg = na > 0 ? `rgba(240,240,255,${1 - na * 0.4})` : '#FFFFFF';
    const shd = na > 0 ? `rgba(130,130,150,${1 - na * 0.3})` : '#D8D8D8';

    ctx.fillStyle = lit;
    ctx.fillRect(xPx, by + bh, tw, bh);
    ctx.fillStyle = brg;
    ctx.fillRect(xPx + bw, by, tw - bw * 2, bh);
    ctx.fillRect(xPx + bw, by + bh, tw - bw * 2, bh);
    ctx.fillStyle = shd;
    ctx.fillRect(xPx, by + bh * 2 - 3, tw, 3);
  }

  // ── Ground blocks ─────────────────────────────────────────────
  function drawGround(t) {
    const gy   = Math.floor(H * 0.45);
    const cols = Math.ceil(W / BS) + 1;
    const na   = nightAlpha(t);
    const dim  = na > 0.5;

    for (let i = 0; i < cols; i++) {
      const bx = i * BS;
      // Grass top
      ctx.fillStyle = dim ? '#3A6B18' : '#5C9A27';
      ctx.fillRect(bx, gy, BS, Math.round(BS * 0.22));
      ctx.fillStyle = dim ? '#4A8020' : '#7BC832';
      ctx.fillRect(bx + 2, gy + 1, Math.round(BS * 0.18), 2);
      ctx.fillRect(bx + Math.round(BS * 0.55), gy + 2, Math.round(BS * 0.2), 2);
      // Dirt body
      ctx.fillStyle = dim ? '#5C3E28' : '#8B5E3C';
      ctx.fillRect(bx, gy + Math.round(BS * 0.22), BS, Math.round(BS * 0.78));
      ctx.fillStyle = '#5A3822';
      ctx.fillRect(bx + 3, gy + Math.round(BS * 0.42), 3, 3);
      ctx.fillRect(bx + Math.round(BS * 0.6), gy + Math.round(BS * 0.65), 4, 3);
      ctx.fillStyle = '#000';
      ctx.fillRect(bx, gy, 1, BS);
      ctx.fillRect(bx, gy, BS, 1);
    }

    for (let i = 0; i < cols; i++) {
      const bx = i * BS;
      const by = gy + BS;
      ctx.fillStyle = dim ? '#5C3D22' : '#7A5230';
      ctx.fillRect(bx, by, BS, BS);
      ctx.fillStyle = '#4A2E16';
      ctx.fillRect(bx + 4, by + 5, 4, 4);
      ctx.fillRect(bx + Math.round(BS * 0.55), by + Math.round(BS * 0.6), 3, 3);
      ctx.fillStyle = '#000';
      ctx.fillRect(bx, by, 1, BS);
      ctx.fillRect(bx, by, BS, 1);
    }

    for (let i = 0; i < cols; i++) {
      const bx = i * BS;
      const by = gy + BS * 2;
      ctx.fillStyle = dim ? '#505050' : '#7F7F7F';
      ctx.fillRect(bx, by, BS, BS);
      ctx.fillStyle = dim ? '#3A3A3A' : '#5A5A5A';
      ctx.fillRect(bx + 3, by + 4, 4, 4);
      ctx.fillRect(bx + Math.round(BS * 0.55), by + Math.round(BS * 0.55), 5, 4);
      ctx.fillStyle = dim ? '#606060' : '#A0A0A0';
      ctx.fillRect(bx + 2, by + 2, 2, 2);
      ctx.fillStyle = '#000';
      ctx.fillRect(bx, by, 1, BS);
      ctx.fillRect(bx, by, BS, 1);
    }

    ctx.fillStyle = dim ? '#3A3A3A' : '#5A5A5A';
    ctx.fillRect(0, gy + BS * 3, W, H);
  }

  // ── Trees ────────────────────────────────────────────────────
  const TREE_XF = [0.13, 0.36, 0.62, 0.85];

  function drawTree(txPx, t) {
    const gy  = Math.floor(H * 0.45);
    const dim = nightAlpha(t) > 0.5;
    const L1  = dim ? '#235010' : '#3A7A1E';
    const L2  = dim ? '#2E6B18' : '#5C9A27';
    const L3  = dim ? '#3A6015' : '#7BC832';
    const T1  = dim ? '#3A2210' : '#6B4423';
    const T2  = dim ? '#221508' : '#4A2E15';
    const T3  = dim ? '#5C3820' : '#8B6040';

    const lx = txPx - BS * 2;
    const ly = gy - BS * 6;
    const leafMap = [
      [0,1,1,1,0],
      [1,1,1,1,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
    ];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        if (!leafMap[row][col]) continue;
        ctx.fillStyle = (row + col) % 3 === 0 ? L1 : L2;
        ctx.fillRect(lx + col * BS, ly + row * BS, BS - 1, BS - 1);
      }
    }
    ctx.fillStyle = L3;
    ctx.fillRect(lx + BS * 2 + 2, ly + 2, 4, 4);

    const tx2 = txPx - Math.round(BS / 2);
    ctx.fillStyle = T1;
    ctx.fillRect(tx2, gy - BS * 3, BS, BS * 3);
    ctx.fillStyle = T2;
    ctx.fillRect(tx2 + 2, gy - BS * 3 + 3, 2, BS * 3 - 6);
    ctx.fillStyle = T3;
    ctx.fillRect(tx2 + Math.round(BS * 0.6), gy - BS * 3 + 4, 2, BS * 3 - 8);
  }

  // ── Birds ─────────────────────────────────────────────────────
  const BIRDS = Array.from({ length: 3 }, (_, i) => ({
    x: -200,
    y: 0,
    speed: 0,
    wingUp: false,
    wingTimer: 0,
    active: false,
    waitTime: i * 6000 + 2000,
    waited: 0,
  }));

  function drawBirdShape(x, y, wingUp) {
    const s = Math.max(2, Math.round(BS / 11));
    ctx.fillStyle = '#222233';
    ctx.fillRect(x, y, s * 2, s);              // body
    if (wingUp) {
      ctx.fillRect(x - s * 3, y - s, s * 3, s);
      ctx.fillRect(x + s * 2, y - s, s * 3, s);
    } else {
      ctx.fillRect(x - s * 3, y + s, s * 3, s);
      ctx.fillRect(x + s * 2, y + s, s * 3, s);
    }
  }

  function updateBirds(dt, t) {
    const isNight = nightAlpha(t) > 0.5;
    BIRDS.forEach(b => {
      if (!b.active) {
        b.waited += dt;
        if (b.waited >= b.waitTime) {
          b.active    = true;
          b.x         = -60;
          b.y         = H * (0.06 + Math.random() * 0.26);
          b.speed     = 50 + Math.random() * 70;
          b.waited    = 0;
          b.waitTime  = 7000 + Math.random() * 14000;
        }
        return;
      }
      b.x += b.speed * dt / 1000;
      b.wingTimer += dt;
      if (b.wingTimer > 280) { b.wingUp = !b.wingUp; b.wingTimer = 0; }
      if (b.x > W + 80) { b.active = false; b.waited = 0; }
      if (!isNight) drawBirdShape(b.x, b.y, b.wingUp);
    });
  }

  // ── Falling leaves ────────────────────────────────────────────
  const LEAF_COLORS = ['#5C9A27','#7BC832','#3A7A1E','#AACC44','#8BBB33'];
  let leaves = [];

  function spawnLeaf() {
    const tf = TREE_XF[Math.floor(Math.random() * TREE_XF.length)];
    return {
      x:     tf * W + (Math.random() - 0.5) * BS * 4,
      y:     H * 0.10 + Math.random() * H * 0.12,
      vy:    18 + Math.random() * 28,
      vx:    (Math.random() - 0.5) * 18,
      size:  Math.max(3, Math.round(BS / 7)),
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      wobble: Math.random() * Math.PI * 2,
      wSpeed: 1.5 + Math.random() * 2,
      alpha:  1,
    };
  }

  function initLeaves() {
    leaves = Array.from({ length: 18 }, () => {
      const l = spawnLeaf();
      l.y = H * (0.10 + Math.random() * 0.35); // spread initial y
      return l;
    });
  }

  function updateLeaves(dt, t) {
    const groundY = H * 0.45;
    const na = nightAlpha(t);
    leaves.forEach((l, i) => {
      l.wobble += l.wSpeed * dt / 1000;
      l.x += (l.vx + Math.sin(l.wobble) * 12) * dt / 1000;
      l.y += l.vy * dt / 1000;
      if (l.y > groundY - BS * 0.5) l.alpha -= dt / 800;
      if (l.alpha <= 0 || l.y > groundY + 10) {
        leaves[i] = spawnLeaf();
        return;
      }
      ctx.fillStyle = l.color;
      ctx.globalAlpha = l.alpha * (na > 0 ? 0.5 : 1);
      ctx.fillRect(l.x, l.y, l.size, l.size);
    });
    ctx.globalAlpha = 1;
  }

  // ── Fireflies ─────────────────────────────────────────────────
  const FIREFLIES = Array.from({ length: 14 }, () => ({
    xf:    Math.random(),
    yf:    0.28 + Math.random() * 0.16,
    phase: Math.random() * Math.PI * 2,
    drift: (Math.random() - 0.5) * 0.0015,
    freq:  0.6 + Math.random() * 1.2,
  }));

  function drawFireflies(t, ts) {
    const na = nightAlpha(t);
    // Fireflies appear from dusk through night into dawn
    let alpha = 0;
    if (t < 0.20) alpha = na;
    else if (t < 0.36) alpha = na;
    else if (t > 0.60) alpha = na;
    if (alpha <= 0) return;

    const now = ts / 1000;
    FIREFLIES.forEach(f => {
      f.xf = ((f.xf + f.drift) + 1) % 1;
      const glow = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * f.freq * 6 + f.phase));
      const fx   = f.xf * W;
      const fy   = f.yf * H + Math.sin(now * f.freq + f.phase) * 18;
      ctx.fillStyle = `rgba(180,255,100,${alpha * glow})`;
      ctx.fillRect(fx, fy, 3, 3);
      ctx.fillStyle = `rgba(180,255,100,${alpha * glow * 0.18})`;
      ctx.fillRect(fx - 3, fy - 3, 9, 9);
    });
  }

  // ── Resize ───────────────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    BS = Math.min(40, Math.max(16, Math.floor(W / 18)));
  }

  // ── Main loop ────────────────────────────────────────────────
  let rafId = null;

  function frame(ts) {
    const dt = Math.min(ts - lastTs, 80);
    lastTs   = ts;
    const t  = cycleTime(ts);

    // Drift clouds
    CLOUDS.forEach(c => {
      c.xf += c.speed * dt;
      if (c.xf > 1.15) c.xf = -0.18;
    });

    ctx.clearRect(0, 0, W, H);

    drawSky(t, ts);
    drawMoon(t);
    drawSun(t);
    CLOUDS.forEach(c => drawCloud(c.xf * W, c.yf, c.w, t));
    updateBirds(dt, t);
    drawGround(t);
    TREE_XF.forEach(f => drawTree(Math.round(f * W), t));
    updateLeaves(dt, t);
    drawFireflies(t, ts);

    rafId = requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', () => {
    resize();
    initLeaves();
    window.addEventListener('resize', () => { resize(); initLeaves(); });
    lastTs = performance.now();
    rafId  = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId); rafId = null;
      } else {
        lastTs = performance.now();
        rafId  = requestAnimationFrame(frame);
      }
    });
  });
})();
