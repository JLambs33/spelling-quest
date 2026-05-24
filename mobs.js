const ambientMobs = (() => {
  // ── constants ────────────────────────────────────────────────
  const MAX_ON_SCREEN   = 10;
  const SPAWN_MIN       = 1.8;
  const SPAWN_MAX       = 4.5;
  const TURN_MIN        = 2.5;
  const TURN_MAX        = 6;
  const LEAVE_CHANCE    = 0.18;
  const PAUSE_CHANCE    = 0.20;
  const PAUSE_MIN       = 0.6;
  const PAUSE_MAX       = 2.2;
  const SPD_MIN         = 18;
  const SPD_MAX         = 72;
  const VY_MAX          = 18;
  const BURN_DURATION   = 2.5;    // seconds undead burn before disappearing
  const TELEPORT_CHANCE = 0.45;   // probability enderman teleports on turn

  const TYPES = [
    { kind: 'zombie',   w: 20, h: 36, weight: 4 },
    { kind: 'skeleton', w: 20, h: 36, weight: 4 },
    { kind: 'spider',   w: 30, h: 14, weight: 3 },
    { kind: 'cow',      w: 28, h: 24, weight: 3 },
    { kind: 'pig',      w: 24, h: 20, weight: 3 },
    { kind: 'chicken',  w: 16, h: 18, weight: 3 },
    { kind: 'enderman', w: 12, h: 52, weight: 1 },
  ];

  const UNDEAD       = new Set(['zombie', 'skeleton']);
  const FLAME_COLORS = ['#FF4400', '#FF6600', '#FFAA00', '#FF2200', '#FFCC00'];

  // ── state ─────────────────────────────────────────────────────
  let canvas, ctx, rafId, lastTs, running;
  let mobs      = [];
  let particles = [];
  let elapsed   = 0;
  let nextSpawn = 1.5;
  let wasDay    = false;

  // ── helpers ───────────────────────────────────────────────────

  // Returns the y-coordinate of the top of the bottom grass area,
  // matching bg.js's ground layout (3 block rows below H*0.45).
  function groundY() {
    const bs = Math.min(40, Math.max(16, Math.floor(canvas.width / 18)));
    return canvas.height * 0.45 + bs * 3;
  }

  function pickTypeFrom(pool) {
    const total = pool.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of pool) { r -= t.weight; if (r <= 0) return t; }
    return pool[0];
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pickSpd()      { return rand(SPD_MIN, SPD_MAX); }

  function spawnMob() {
    const day  = sceneBg.isDaytime();
    const pool = day ? TYPES.filter(t => !UNDEAD.has(t.kind)) : TYPES;
    const t    = pickTypeFrom(pool);
    const fromLeft = Math.random() < 0.5;
    const gY   = groundY();
    const x    = fromLeft ? -t.w - 10 : canvas.width + 10;
    const y    = gY + Math.random() * (canvas.height * 0.35);
    const spd  = pickSpd();
    return {
      kind: t.kind, w: t.w, h: t.h,
      x, y,
      vx: fromLeft ? spd : -spd,
      vy: rand(-VY_MAX * 0.5, VY_MAX * 0.5),
      facing: fromLeft ? 1 : -1,
      paused: false, pauseTimer: 0,
      entered: false, leaving: false,
      burning: false, burnTimer: 0,
      turnTimer: rand(TURN_MIN, TURN_MAX),
    };
  }

  // ── teleport particles ────────────────────────────────────────
  function spawnTeleportParticles(cx, cy, count = 14) {
    for (let i = 0; i < count; i++) {
      const life = rand(0.35, 0.70);
      particles.push({
        x: cx + rand(-8, 8), y: cy + rand(-26, 26),
        vx: rand(-70, 70),   vy: rand(-70, 70),
        life, maxLife: life,
        size: 2 + Math.floor(Math.random() * 3),
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const a = (p.life / p.maxLife).toFixed(2);
      ctx.fillStyle = `rgba(140,0,255,${a})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
  }

  // ── update ────────────────────────────────────────────────────
  function update(dt) {
    elapsed += dt;

    // Day/night transition — ignite all on-screen undead when day breaks
    const day = sceneBg.isDaytime();
    if (day && !wasDay) {
      for (const m of mobs) {
        if (UNDEAD.has(m.kind) && !m.burning) {
          m.burning   = true;
          m.burnTimer = BURN_DURATION;
        }
      }
    }
    wasDay = day;

    if (mobs.length < MAX_ON_SCREEN && elapsed >= nextSpawn) {
      mobs.push(spawnMob());
      nextSpawn = elapsed + rand(SPAWN_MIN, SPAWN_MAX);
    }

    updateParticles(dt);

    const yMin = groundY();
    const yMax = canvas.height * 0.88;

    for (const m of mobs) {
      // Burning mobs freeze in place and count down
      if (m.burning) {
        m.burnTimer -= dt;
        continue;
      }

      if (m.paused) {
        m.pauseTimer -= dt;
        if (m.pauseTimer <= 0) {
          m.paused = false;
          m.vx = (Math.random() < 0.5 ? 1 : -1) * pickSpd();
          m.vy = rand(-VY_MAX, VY_MAX);
          m.turnTimer = rand(TURN_MIN, TURN_MAX);
        }
        continue;
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.vx !== 0) m.facing = m.vx > 0 ? 1 : -1;

      if (m.y < yMin)          { m.y = yMin;          m.vy =  Math.abs(m.vy); }
      if (m.y + m.h > yMax)   { m.y = yMax - m.h;    m.vy = -Math.abs(m.vy); }

      if (!m.entered && m.x > 0 && m.x + m.w < canvas.width) m.entered = true;

      if (m.entered && !m.leaving) {
        m.turnTimer -= dt;
        if (m.turnTimer <= 0) {
          if (m.kind === 'enderman' && Math.random() < TELEPORT_CHANCE) {
            // Enderman teleport — particles at origin, snap, particles at destination
            spawnTeleportParticles(m.x + m.w / 2, m.y + m.h / 2);
            m.x = rand(40, canvas.width - m.w - 40);
            m.y = rand(yMin, Math.min(yMin + canvas.height * 0.30, yMax - m.h));
            m.vx = (Math.random() < 0.5 ? 1 : -1) * pickSpd();
            m.vy = rand(-VY_MAX, VY_MAX);
            m.facing = m.vx > 0 ? 1 : -1;
            spawnTeleportParticles(m.x + m.w / 2, m.y + m.h / 2, 8);
          } else {
            const roll = Math.random();
            if (roll < LEAVE_CHANCE) {
              m.leaving = true;
            } else if (roll < LEAVE_CHANCE + PAUSE_CHANCE) {
              m.paused = true; m.vx = 0; m.vy = 0;
              m.pauseTimer = rand(PAUSE_MIN, PAUSE_MAX);
            } else {
              m.vx = (Math.random() < 0.5 ? 1 : -1) * pickSpd();
              m.vy = rand(-VY_MAX, VY_MAX);
            }
          }
          m.turnTimer = rand(TURN_MIN, TURN_MAX);
        }
        if (m.x < 30 && m.vx < 0)                     m.vx =  Math.abs(m.vx);
        if (m.x + m.w > canvas.width - 30 && m.vx > 0) m.vx = -Math.abs(m.vx);
      }
    }

    mobs = mobs.filter(m => {
      if (m.burning && m.burnTimer <= 0) return false;
      return m.x > -m.w - 30 && m.x < canvas.width + m.w + 30;
    });
  }

  // ── drawing ───────────────────────────────────────────────────

  function drawFlames(x, y, w, h) {
    ctx.save();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 10; i++) {
      const fx = x + Math.random() * (w + 4) - 2;
      const fy = y + Math.random() * h * 1.1 - h * 0.15;
      const fs = 2 + Math.floor(Math.random() * 4);
      ctx.fillStyle = FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)];
      ctx.fillRect(Math.round(fx), Math.round(fy), fs, fs);
    }
    ctx.restore();
  }

  function drawMob(m) {
    ctx.save();
    if (m.burning) ctx.globalAlpha = Math.max(0.15, m.burnTimer / BURN_DURATION);
    if (m.facing < 0) {
      ctx.translate(m.x + m.w, m.y);
      ctx.scale(-1, 1);
      drawShape(m, 0, 0);
    } else {
      drawShape(m, m.x, m.y);
    }
    ctx.restore();
    if (m.burning) drawFlames(m.x, m.y, m.w, m.h);
  }

  function drawShape(m, x, y) {
    switch (m.kind) {
      case 'zombie':   return drawZombie(x, y, m.w, m.h);
      case 'skeleton': return drawSkeleton(x, y, m.w, m.h);
      case 'spider':   return drawSpider(x, y, m.w, m.h);
      case 'cow':      return drawCow(x, y, m.w, m.h);
      case 'pig':      return drawPig(x, y, m.w, m.h);
      case 'chicken':  return drawChicken(x, y, m.w, m.h);
      case 'enderman': return drawEnderman(x, y, m.w, m.h);
    }
  }

  function drawZombie(x, y, w, h) {
    const headH = Math.round(h * 0.38);
    const bodyH = Math.round(h * 0.30);
    const legH  = h - headH - bodyH;
    const armW  = Math.round(w * 0.22);
    const bw    = w - armW * 2;
    ctx.fillStyle = '#7AAD7A';
    ctx.fillRect(x + armW, y, bw, headH);
    ctx.fillStyle = '#1A3A1A';
    ctx.fillRect(x + armW + 3, y + 5, 3, 3);
    ctx.fillRect(x + armW + bw - 6, y + 5, 3, 3);
    ctx.fillStyle = '#5A8A5A';
    ctx.fillRect(x, y + headH + 3, armW, Math.round(bodyH * 0.55));
    ctx.fillRect(x + w - armW, y + headH - 5, armW, Math.round(bodyH * 0.55));
    ctx.fillStyle = '#557755';
    ctx.fillRect(x + armW, y + headH, bw, bodyH);
    const lw = Math.round(bw / 2) - 1;
    ctx.fillStyle = '#3A3A5A';
    ctx.fillRect(x + armW,          y + headH + bodyH,                          lw, legH);
    ctx.fillRect(x + armW + lw + 2, y + headH + bodyH + Math.round(legH * 0.2), lw, legH - Math.round(legH * 0.2));
  }

  function drawSkeleton(x, y, w, h) {
    const headH = Math.round(h * 0.36);
    const bodyH = Math.round(h * 0.28);
    const legH  = h - headH - bodyH;
    const armW  = Math.round(w * 0.18);
    const bw    = w - armW * 2;
    ctx.fillStyle = '#D8D8D8';
    ctx.fillRect(x + armW, y, bw, headH);
    ctx.fillStyle = '#111';
    ctx.fillRect(x + armW + 2, y + 4, 4, 4);
    ctx.fillRect(x + armW + bw - 6, y + 4, 4, 4);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + armW + 3, y + headH - 4, 2, 3);
    ctx.fillRect(x + armW + bw - 5, y + headH - 4, 2, 3);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x, y + headH, armW, bodyH);
    ctx.fillRect(x + w - armW, y + headH, armW, bodyH);
    ctx.fillRect(x + armW, y + headH, bw, bodyH);
    ctx.fillStyle = '#888';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + armW + 1, y + headH + 2 + i * Math.round(bodyH / 3.5), bw - 2, 1);
    }
    const lw = Math.round(bw / 2) - 2;
    ctx.fillStyle = '#B8B8B8';
    ctx.fillRect(x + armW + 1,      y + headH + bodyH,                          lw, legH);
    ctx.fillRect(x + armW + lw + 3, y + headH + bodyH + Math.round(legH * 0.15), lw, legH - Math.round(legH * 0.15));
  }

  function drawSpider(x, y, w, h) {
    const bw   = Math.round(w * 0.46);
    const bx   = x + Math.round((w - bw) / 2);
    const legL = Math.round(w * 0.27);
    ctx.fillStyle = '#3A2A1A';
    for (let i = 0; i < 4; i++) {
      const ly = y + Math.round(h * 0.28) + i * Math.round(h * 0.18);
      ctx.fillRect(bx - legL, ly, legL, 2);
      ctx.fillRect(bx + bw,   ly, legL, 2);
    }
    ctx.fillStyle = '#4A3020';
    ctx.fillRect(bx, y + Math.round(h * 0.12), bw, Math.round(h * 0.65));
    const hw = Math.round(bw * 0.62);
    ctx.fillRect(bx + Math.round((bw - hw) / 2), y, hw, Math.round(h * 0.5));
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(bx + 2, y + 2, 3, 3);
    ctx.fillRect(bx + hw - 5, y + 2, 3, 3);
  }

  function drawCow(x, y, w, h) {
    const headH = Math.round(h * 0.36);
    const bodyH = Math.round(h * 0.38);
    const legH  = h - headH - bodyH;
    ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(x + 2, y + headH, w - 4, bodyH);
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 4,      y + headH + 2, 6, 5);
    ctx.fillRect(x + w - 10, y + headH + 5, 5, 5);
    ctx.fillStyle = '#EEEEEE';
    const hx = x + Math.round(w * 0.08);
    const hw = Math.round(w * 0.65);
    ctx.fillRect(hx, y, hw, headH);
    ctx.fillStyle = '#D4B4A0';
    const sw = Math.round(hw * 0.55);
    ctx.fillRect(hx + Math.round((hw - sw) / 2), y + Math.round(headH * 0.56), sw, Math.round(headH * 0.36));
    ctx.fillStyle = '#222';
    ctx.fillRect(hx + 3, y + Math.round(headH * 0.22), 3, 3);
    ctx.fillStyle = '#C8B880';
    ctx.fillRect(hx + 3, y - 4, 3, 5);
    ctx.fillRect(hx + hw - 6, y - 4, 3, 5);
    ctx.fillStyle = '#CCC';
    const lw = Math.max(3, Math.round(w * 0.11));
    ctx.fillRect(x + 3,                   y + headH + bodyH, lw, legH);
    ctx.fillRect(x + 3 + lw + 2,          y + headH + bodyH, lw, legH);
    ctx.fillRect(x + w - 5 - lw * 2 - 1, y + headH + bodyH, lw, legH);
    ctx.fillRect(x + w - 4 - lw,          y + headH + bodyH, lw, legH);
  }

  function drawPig(x, y, w, h) {
    ctx.fillStyle = '#F4A4A4';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#F9CACA';
    ctx.fillRect(x + 3, y + Math.floor(h * 0.3), w - 6, Math.floor(h * 0.35));
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 3, y + 4, 3, 3);
    ctx.fillRect(x + w - 6, y + 4, 3, 3);
    const sy = y + Math.floor(h * 0.58);
    const sw = Math.floor(w * 0.5), sh = Math.floor(h * 0.22);
    const sx = x + Math.floor((w - sw) / 2);
    ctx.fillStyle = '#E07878';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = '#B84444';
    ctx.fillRect(sx + 2, sy + 2, 2, 2);
    ctx.fillRect(sx + sw - 4, sy + 2, 2, 2);
    ctx.fillStyle = '#C86060';
    ctx.fillRect(x + 2, y + h - 5, 5, 5);
    ctx.fillRect(x + w - 7, y + h - 5, 5, 5);
  }

  function drawChicken(x, y, w, h) {
    const headH = Math.round(h * 0.35);
    const bodyH = Math.round(h * 0.42);
    const legH  = h - headH - bodyH;
    const bx = x + 2, bw = w - 4;
    ctx.fillStyle = '#EEEEDD';
    ctx.fillRect(bx, y + headH, bw, bodyH);
    const hw = Math.round(bw * 0.72);
    const hx = bx + Math.round((bw - hw) / 2);
    ctx.fillRect(hx, y, hw, headH);
    ctx.fillStyle = '#CC2222';
    ctx.fillRect(hx + 2, y - 4, Math.round(hw * 0.5), 5);
    ctx.fillStyle = '#DDAA00';
    ctx.fillRect(hx + hw - 1, y + Math.round(headH * 0.45), 4, 2);
    ctx.fillStyle = '#CC2222';
    ctx.fillRect(hx + hw - 1, y + Math.round(headH * 0.62), 3, 3);
    ctx.fillStyle = '#222';
    ctx.fillRect(hx + Math.round(hw * 0.55), y + Math.round(headH * 0.28), 2, 2);
    ctx.fillStyle = '#DDAA00';
    const ll = 2;
    ctx.fillRect(bx + Math.round(bw * 0.25), y + headH + bodyH, ll, legH);
    ctx.fillRect(bx + Math.round(bw * 0.62), y + headH + bodyH, ll, legH);
    ctx.fillRect(bx + Math.round(bw * 0.25) - 2, y + h - 2, ll + 4, 2);
    ctx.fillRect(bx + Math.round(bw * 0.62) - 2, y + h - 2, ll + 4, 2);
  }

  function drawEnderman(x, y, w, h) {
    ctx.fillStyle = '#0D0D1A';
    ctx.fillRect(x, y, w, h);
    const headH = Math.floor(h * 0.16);
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(x - 2, y, w + 4, headH);
    const ew = Math.max(2, Math.floor(w / 3));
    ctx.fillStyle = '#CC00FF';
    ctx.fillRect(x + 1, y + Math.floor(headH * 0.35), ew, 2);
    ctx.fillRect(x + w - ew - 1, y + Math.floor(headH * 0.35), ew, 2);
    ctx.fillStyle = 'rgba(100,0,180,0.15)';
    ctx.fillRect(x, y + headH, w, h - headH);
  }

  // ── render ────────────────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const m of mobs) drawMob(m);
    drawParticles();
  }

  // ── loop ──────────────────────────────────────────────────────
  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    update(dt);
    render();
    if (running) rafId = requestAnimationFrame(loop);
  }

  // ── resize ────────────────────────────────────────────────────
  function resize() {
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  // ── public API ────────────────────────────────────────────────
  function start(canvasId = 'mob-canvas') {
    canvas    = document.getElementById(canvasId);
    mobs      = [];
    particles = [];
    elapsed   = 0;
    nextSpawn = 1.5;
    running   = true;
    wasDay    = sceneBg.isDaytime();
    resize();
    ctx    = canvas.getContext('2d');
    lastTs = performance.now();
    rafId  = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    mobs      = [];
    particles = [];
  }

  return { start, stop };
})();
