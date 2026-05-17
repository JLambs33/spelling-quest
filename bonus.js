const bonus = (() => {
  // ── constants ────────────────────────────────────────────
  const CW       = 960;    // canvas internal width
  const CH       = 380;    // canvas internal height
  const GRAVITY_FULL = 1200;  // px/s² — normal fall / early release
  const GRAVITY_HELD = 360;   // px/s² — reduced while rising and holding
  const JUMP_VEL     = -430;  // px/s upward — tap gives short hop, hold gives tall arc
  const MAX_HOLD     = 0.30;  // seconds of reduced gravity boost
  const BASE_SPD = 200;    // px/s starting
  const MAX_SPD  = 480;    // px/s ceiling
  const SPD_STEP = 10;     // added every 5 seconds
  const BASE_GAP = 300;    // px gap at game start
  const MIN_GAP  = 130;    // px minimum gap
  const GROUND_H = 70;     // ground strip height
  const GRASS_H  = 9;      // grass cap thickness
  const GRASS_CAP = 3;     // darker detail stripe
  const P_W      = 28;     // player width
  const P_H      = 52;     // player height
  const HIT_IN   = 5;      // AABB forgiveness inset

  const GROUND_Y = CH - GROUND_H;
  const FLOOR    = GROUND_Y - P_H;

  // ── obstacle types ────────────────────────────────────────
  // Three heights: short / medium / tall
  const OBS_TYPES = [
    { w: 28, h: 30, kind: 'pig',      weight: 4 }, // pig
    { w: 26, h: 50, kind: 'creeper',  weight: 4 }, // standard creeper
    { w: 18, h: 76, kind: 'enderman', weight: 1 }, // tall enderman — rare
  ];

  // ── state ────────────────────────────────────────────────
  let canvas, ctx;
  let rafId = null, lastTs = 0, onDone = null;
  let dead, elapsed, distance, speed, nextSpawnAt;
  let jumpHeld, holdTime;
  let player, obstacles, clouds;

  // ── init ─────────────────────────────────────────────────
  function initState() {
    dead        = false;
    elapsed     = 0;
    distance    = 0;
    speed       = BASE_SPD;
    nextSpawnAt = 2.0;

    jumpHeld  = false;
    holdTime  = 0;
    player    = { x: 90, y: FLOOR, vy: 0, onGround: true };
    obstacles = [];
    clouds    = [
      { x: CW * 0.15, y: 40,  w: 110, h: 32 },
      { x: CW * 0.48, y: 62,  w: 78,  h: 24 },
      { x: CW * 0.78, y: 44,  w: 92,  h: 28 },
    ];
  }

  function pickObs() {
    const total = OBS_TYPES.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of OBS_TYPES) {
      r -= t.weight;
      if (r <= 0) return { x: CW + 20, y: GROUND_Y - t.h, w: t.w, h: t.h, kind: t.kind };
    }
    const t = OBS_TYPES[OBS_TYPES.length - 1];
    return { x: CW + 20, y: GROUND_Y - t.h, w: t.w, h: t.h, kind: t.kind };
  }

  // ── input ─────────────────────────────────────────────────
  function onDown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.type === 'keydown') e.preventDefault();
    jumpHeld = true;
    if (dead) return;
    if (player.onGround) {
      player.vy       = JUMP_VEL;
      player.onGround = false;
      holdTime        = 0;
    }
  }

  function onUp() {
    jumpHeld = false;
  }

  // ── update ────────────────────────────────────────────────
  function update(dt) {
    elapsed  += dt;
    speed     = Math.min(MAX_SPD, BASE_SPD + Math.floor(elapsed / 5) * SPD_STEP);
    distance += speed * dt;

    // player physics — reduced gravity while holding and still rising
    const rising = player.vy < 0 && !player.onGround;
    const grav   = (jumpHeld && rising && holdTime < MAX_HOLD)
      ? GRAVITY_HELD
      : GRAVITY_FULL;
    if (jumpHeld && rising) holdTime += dt;
    player.vy += grav * dt;
    player.y  += player.vy * dt;
    if (player.y >= FLOOR) {
      player.y        = FLOOR;
      player.vy       = 0;
      player.onGround = true;
      jumpHeld        = false;
    }

    // clouds drift
    clouds.forEach(c => {
      c.x -= 30 * dt;
      if (c.x + c.w < 0) c.x = CW + c.w + Math.random() * 60;
    });

    // obstacles scroll
    obstacles.forEach(o => { o.x -= speed * dt; });
    obstacles = obstacles.filter(o => o.x + o.w > -20);

    // spawn — 25% chance of long breathing gap
    if (elapsed >= nextSpawnAt) {
      obstacles.push(pickObs());
      const baseGap    = Math.max(MIN_GAP, BASE_GAP - (elapsed / 90) * (BASE_GAP - MIN_GAP));
      const randomExtra = Math.random() < 0.25
        ? 140 + Math.random() * 180
        : Math.random() * 90;
      nextSpawnAt = elapsed + (baseGap + randomExtra) / speed;
    }

    // AABB collision with forgiveness inset
    const px = player.x + HIT_IN, py = player.y + HIT_IN;
    const pw = P_W - HIT_IN * 2,  ph = P_H - HIT_IN * 2;
    for (const o of obstacles) {
      if (px < o.x + o.w - HIT_IN && px + pw > o.x + HIT_IN &&
          py < o.y + o.h - HIT_IN && py + ph > o.y + HIT_IN) {
        dead = true;
        break;
      }
    }
  }

  // ── drawing ───────────────────────────────────────────────
  function drawSteve(x, y) {
    // head — skin
    ctx.fillStyle = '#C68642';
    ctx.fillRect(x, y, P_W, 22);
    // hair
    ctx.fillStyle = '#6B3A1F';
    ctx.fillRect(x + 2, y, P_W - 4, 6);
    // eyes
    ctx.fillStyle = '#1A0A00';
    ctx.fillRect(x + 5,        y + 10, 6, 5);
    ctx.fillRect(x + P_W - 11, y + 10, 6, 5);
    // shirt
    ctx.fillStyle = '#5C9A27';
    ctx.fillRect(x, y + 22, P_W, 16);
    // pants
    ctx.fillStyle = '#2E4482';
    ctx.fillRect(x, y + 38, P_W, 14);
  }

  function drawPig(x, y, w, h) {
    // body — pink
    ctx.fillStyle = '#F4A4A4';
    ctx.fillRect(x, y, w, h);
    // belly highlight
    ctx.fillStyle = '#F9CACA';
    ctx.fillRect(x + 4, y + Math.floor(h * 0.3), w - 8, Math.floor(h * 0.35));
    // eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 4,      y + 5, 4, 4);
    ctx.fillRect(x + w - 8,  y + 5, 4, 4);
    // snout — centered, lower third
    const sy = y + Math.floor(h * 0.58);
    const sw = Math.floor(w * 0.55), sh = Math.floor(h * 0.22);
    const sx = x + Math.floor((w - sw) / 2);
    ctx.fillStyle = '#E07878';
    ctx.fillRect(sx, sy, sw, sh);
    // nostrils
    ctx.fillStyle = '#B84444';
    ctx.fillRect(sx + 3,          sy + 3, 3, 3);
    ctx.fillRect(sx + sw - 6,     sy + 3, 3, 3);
    // trotters
    ctx.fillStyle = '#C86060';
    ctx.fillRect(x + 2,      y + h - 6, 7, 6);
    ctx.fillRect(x + w - 9,  y + h - 6, 7, 6);
  }

  function drawCreeper(x, y, w, h) {
    const p = Math.max(2, Math.floor(w / 8));
    ctx.fillStyle = '#5DA832';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2E5C0E';
    ctx.fillRect(x + p,     y + p * 2, p * 2, p * 2); // left eye
    ctx.fillRect(x + p * 5, y + p * 2, p * 2, p * 2); // right eye
    ctx.fillRect(x + p * 2, y + p * 4, p * 4, p);     // mouth top
    ctx.fillRect(x + p,     y + p * 5, p,     p * 2); // mouth left leg
    ctx.fillRect(x + p * 2, y + p * 6, p * 2, p);
    ctx.fillRect(x + p * 4, y + p * 6, p * 2, p);
    ctx.fillRect(x + p * 6, y + p * 5, p,     p * 2); // mouth right leg
  }

  function drawEnderman(x, y, w, h) {
    // very dark body
    ctx.fillStyle = '#0D0D1A';
    ctx.fillRect(x, y, w, h);
    // narrow head region (top 20%)
    const headH = Math.floor(h * 0.2);
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(x - 2, y, w + 4, headH);
    // glowing teal eyes
    const ew = Math.max(2, Math.floor(w / 4));
    const ey = y + Math.floor(headH * 0.35);
    ctx.fillStyle = '#CC00FF';
    ctx.fillRect(x + 1,         ey, ew, 3);
    ctx.fillRect(x + w - ew - 1, ey, ew, 3);
    // subtle purple tint on body
    ctx.fillStyle = 'rgba(100,0,180,0.18)';
    ctx.fillRect(x, y + headH, w, h - headH);
  }

  function shadowed(fn) {
    ctx.shadowColor   = '#000';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    fn();
    ctx.shadowColor   = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function render() {
    // sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CW, CH);

    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    clouds.forEach(c => ctx.fillRect(c.x, c.y, c.w, c.h));

    // ground
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(0, GROUND_Y, CW, GROUND_H);
    ctx.fillStyle = '#5C9A27';
    ctx.fillRect(0, GROUND_Y, CW, GRASS_H);
    ctx.fillStyle = '#3A6B18';
    ctx.fillRect(0, GROUND_Y + GRASS_H, CW, GRASS_CAP);

    // obstacles
    obstacles.forEach(o => {
      if      (o.kind === 'pig')      drawPig(o.x, o.y, o.w, o.h);
      else if (o.kind === 'enderman') drawEnderman(o.x, o.y, o.w, o.h);
      else                            drawCreeper(o.x, o.y, o.w, o.h);
    });

    // player
    drawSteve(player.x, player.y);

    // score
    const blocks = Math.floor(distance / 10);
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';
    ctx.font = '10px "Press Start 2P", monospace';
    shadowed(() => {
      ctx.fillStyle = '#FFFFA5';
      ctx.fillText('BLOCKS: ' + blocks, 12, 12);
    });

    // jump hint (first 2 seconds)
    if (!dead && elapsed < 2.0) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(CW / 2 - 180, CH / 2 - 32, 360, 58);
      ctx.fillStyle    = '#FFFFA5';
      ctx.font         = '8px "Press Start 2P", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAP = JUMP', CW / 2, CH / 2 - 14);
      ctx.fillText('DOUBLE TAP = SUPER JUMP', CW / 2, CH / 2 + 10);
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
    }

    // game-over overlay
    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, CW, CH);
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      shadowed(() => {
        ctx.fillStyle = '#FFFFA5';
        ctx.font      = '22px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', CW / 2, CH / 2 - 36);
      });
      shadowed(() => {
        ctx.fillStyle = '#FFAA00';
        ctx.font      = '14px "Press Start 2P", monospace';
        ctx.fillText(blocks + ' BLOCKS', CW / 2, CH / 2 + 8);
      });
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
    }
  }

  // ── loop ──────────────────────────────────────────────────
  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    if (!dead) update(dt);
    render();

    if (!dead) {
      rafId = requestAnimationFrame(loop);
    } else {
      if (onDone) { const cb = onDone; onDone = null; cb(); }
    }
  }

  // ── touch handler — tap = jump, double-tap = super jump ─────
  let lastTapTime = 0;

  function onTouchStart(e) {
    if (e.target.id === 'bonus-home-btn') return;  // let the button handle itself
    e.preventDefault();
    if (dead) return;
    const now = Date.now();
    const doubleTap = (now - lastTapTime) < 350;
    lastTapTime = now;

    if (doubleTap && !player.onGround && player.vy < 0) {
      // Second tap while still rising: boost to super height
      player.vy = JUMP_VEL * 1.4;
    } else if (player.onGround) {
      player.vy       = doubleTap ? JUMP_VEL * 1.4 : JUMP_VEL;
      player.onGround = false;
      holdTime        = 0;
    }
  }

  // ── cleanup ───────────────────────────────────────────────
  function cleanup() {
    cancelAnimationFrame(rafId);
    document.removeEventListener('keydown',    onDown);
    document.removeEventListener('keyup',      onUp);
    document.removeEventListener('touchstart', onTouchStart);
  }

  // ── public API ────────────────────────────────────────────
  function startGame(callback) {
    onDone        = callback;
    canvas        = document.getElementById('bonus-canvas');
    canvas.width  = CW;
    canvas.height = CH;
    ctx = canvas.getContext('2d');

    initState();
    lastTapTime = 0;
    document.addEventListener('keydown',    onDown);
    document.addEventListener('keyup',      onUp);
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    lastTs = performance.now();
    rafId  = requestAnimationFrame(loop);
  }

  function stopGame() { cleanup(); }

  return { startGame, stopGame };
})();
