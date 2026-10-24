
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Rocket, Star, Trophy, RotateCcw, Maximize2 } from 'lucide-react';

const W = 390;
const H = 844;
const MAX_LEVEL = 501;

const SHIPS = [
  { name: 'Comet', icon: '🚀', color: '#54e7ff', speed: 1 },
  { name: 'Phoenix', icon: '🛸', color: '#ff8a65', speed: 1.12 },
  { name: 'Spectre', icon: '✦', color: '#c69aff', speed: 1.22 },
  { name: 'Nova', icon: '🚀', color: '#ffe17b', speed: 1.08 },
];

const WORLDS = [
  { name: 'Nebulosa Azul', a: '#06172f', b: '#102f60' },
  { name: 'Marte Carmesí', a: '#260d22', b: '#772c35' },
  { name: 'Anillos de Saturno', a: '#201934', b: '#65503e' },
  { name: 'Abismo Violeta', a: '#170c36', b: '#4b2176' },
  { name: 'Sector Esmeralda', a: '#061f27', b: '#126454' },
  { name: 'Supernova', a: '#351017', b: '#a23a24' },
  { name: 'Horizonte Dorado', a: '#211b25', b: '#84622e' },
  { name: 'Galaxia Fantasma', a: '#0a1029', b: '#394d83' },
  { name: 'Espacio Profundo', a: '#030712', b: '#25284c' },
  { name: 'Última Frontera', a: '#190b25', b: '#6c286e' },
];

function newGame(ship = 0) {
  return {
    x: W / 2, y: H * 0.76,
    objects: [], particles: [],
    score: 0, stars: 0, lives: 3,
    elapsed: 0, frame: 0, level: 1,
    ship, over: false, invincible: 0,
    nextId: 1,
  };
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(newGame());
  const runningRef = useRef(false);
  const pointerRef = useRef({ active: false, id: null });
  const [playing, setPlaying] = useState(false);
  const [shipChoice, setShipChoice] = useState(0);
  const [hud, setHud] = useState({ score: 0, stars: 0, lives: 3, level: 1, value: 2, time: 0 });
  const [result, setResult] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);

  const goFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      }
      try {
        await screen.orientation?.lock?.('portrait');
      } catch {
        // Algunos navegadores no permiten bloquear la orientación.
      }
      setFullScreen(Boolean(document.fullscreenElement));
    } catch {
      // El juego puede jugarse aunque fullscreen no esté disponible.
    }
  }, []);

  const startGame = useCallback(async () => {
    await goFullscreen();
    gameRef.current = newGame(shipChoice);
    pointerRef.current = { active: false, id: null };
    setHud({ score: 0, stars: 0, lives: 3, level: 1, value: 2, time: 0 });
    setResult(null);
    runningRef.current = true;
    setPlaying(true);
  }, [goFullscreen, shipChoice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let last = performance.now();
    let hudAt = 0;

    function background(g) {
      const world = WORLDS[Math.floor((g.level - 1) / 50) % WORLDS.length];
      const gradient = ctx.createLinearGradient(0, 0, W * 0.7, H);
      gradient.addColorStop(0, world.a);
      gradient.addColorStop(1, world.b);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // Nebulosas y estrellas de fondo
      for (let i = 0; i < 95; i++) {
        const x = (i * 113 + 17) % W;
        const y = (i * 191 + g.frame * (0.3 + (i % 4) * 0.16)) % H;
        ctx.globalAlpha = 0.3 + (i % 5) * 0.13;
        ctx.fillStyle = i % 9 === 0 ? '#54e7ff' : '#ffffff';
        ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1.3, i % 7 === 0 ? 2 : 1.3);
      }
      ctx.globalAlpha = 1;

      const glow = ctx.createRadialGradient(W * 0.5, H * 0.44, 5, W * 0.5, H * 0.44, W * 0.8);
      glow.addColorStop(0, 'rgba(92,120,255,0.12)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    function drawShip(g) {
      const ship = SHIPS[g.ship];
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.shadowColor = ship.color;
      ctx.shadowBlur = 18;

      ctx.fillStyle = ship.color;
      ctx.beginPath();
      ctx.moveTo(-7, 13);
      ctx.lineTo(0, 29 + Math.random() * 8);
      ctx.lineTo(7, 13);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#4d8fff';
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(18, 16);
      ctx.lineTo(6, 10);
      ctx.lineTo(0, 16);
      ctx.lineTo(-6, 10);
      ctx.lineTo(-18, 16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f2fcff';
      ctx.beginPath();
      ctx.moveTo(0, -19);
      ctx.lineTo(7, 9);
      ctx.lineTo(0, 13);
      ctx.lineTo(-7, 9);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = ship.color;
      ctx.beginPath();
      ctx.ellipse(0, -1, 3.5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawMeteor(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rotation);
      ctx.shadowColor = '#ff7047';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#756a79';
      ctx.strokeStyle = '#ff996b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = i * Math.PI / 5;
        const r = o.r * (0.76 + 0.24 * Math.sin(i * 7.2));
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function drawAlien(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.shadowColor = '#71ff9a';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#40d67c';
      ctx.beginPath();
      ctx.ellipse(0, 0, o.r, o.r * 0.76, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c0ffc6';
      ctx.beginPath();
      ctx.ellipse(0, -3, o.r * 0.6, o.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b2543';
      ctx.beginPath();
      ctx.arc(0, -3, o.r * 0.37, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff627b';
      ctx.beginPath();
      ctx.arc(2, -4, o.r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawStar(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rotation);
      ctx.shadowColor = '#ffd45a';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffdc62';
      ctx.strokeStyle = '#fff3b0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 === 0 ? o.r : o.r * 0.43;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      const now = performance.now();
      const dt = Math.min((now - last) / 16.67, 2);
      last = now;
      const g = gameRef.current;
      background(g);

      if (runningRef.current && !g.over) {
        g.frame += dt;
        g.elapsed += (now - (g.lastTime || now)) / 1000;
        g.lastTime = now;

        const difficulty = Math.floor(g.elapsed / 60);
        g.level = Math.min(MAX_LEVEL, 1 + Math.floor(g.stars / 10) + difficulty);
        const starValue = 2 + Math.floor(g.stars / 10);

        const speed = (3.0 + difficulty * 0.38) * dt;
        const spawnRate = Math.max(12, 48 - difficulty * 3);

        if (g.frame % spawnRate < dt) {
          const roll = Math.random();
          const type = roll < 0.47 ? 'meteor' : roll < 0.74 ? 'star' : 'alien';
          const r = type === 'star' ? 10 : type === 'alien' ? 15 : 13 + Math.random() * 11;
          g.objects.push({
            id: g.nextId++, type,
            x: r + Math.random() * (W - 2 * r),
            y: -30, r,
            rotation: Math.random() * 6,
            speed: speed * (0.7 + Math.random() * 0.65),
          });
        }

        const p = g;
        const kept = [];
        for (const o of g.objects) {
          o.y += o.speed * dt;
          o.rotation += 0.025 * dt;
          const hit = Math.hypot(o.x - p.x, o.y - p.y) < o.r + 15;

          if (hit && o.type === 'star') {
            g.stars++;
            g.score += starValue;
            for (let i = 0; i < 9; i++) {
              g.particles.push({
                x: o.x, y: o.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 25,
              });
            }
            continue;
          }

          if (hit && (o.type === 'meteor' || o.type === 'alien') && g.invincible <= 0) {
            g.lives--;
            g.invincible = 90;
            if (g.lives <= 0) {
              g.lives = 0;
              g.over = true;
              runningRef.current = false;
              setResult({ score: g.score, stars: g.stars, level: g.level });
            }
            continue;
          }

          if (o.y < H + 40) kept.push(o);
          else if (o.type !== 'star') g.score++;
        }
        g.objects = kept;
        g.invincible = Math.max(0, g.invincible - dt);
      }

      for (const o of g.objects) {
        if (o.type === 'meteor') drawMeteor(o);
        else if (o.type === 'alien') drawAlien(o);
        else drawStar(o);
      }

      g.particles = g.particles.filter((part) => part.life > 0);
      for (const part of g.particles) {
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.life -= dt;
        ctx.globalAlpha = Math.max(0, part.life / 25);
        ctx.fillStyle = '#ffdf68';
        ctx.fillRect(part.x, part.y, 3, 3);
      }
      ctx.globalAlpha = 1;

      if (g.invincible <= 0 || Math.floor(g.frame / 5) % 2 === 0) {
        drawShip(g);
      }

      if (now - hudAt > 120) {
        setHud({
          score: g.score, stars: g.stars, lives: g.lives,
          level: g.level, value: 2 + Math.floor(g.stars / 10),
          time: Math.floor(g.elapsed),
        });
        hudAt = now;
      }
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  function moveShip(e) {
    if (!playing || !pointerRef.current.active) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const g = gameRef.current;
    g.x = Math.max(22, Math.min(W - 22, ((e.clientX - rect.left) / rect.width) * W));
    g.y = Math.max(35, Math.min(H - 35, ((e.clientY - rect.top) / rect.height) * H));
  }

  function pointerDown(e) {
    if (!playing || result) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const g = gameRef.current;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    // Para iniciar el control, toca la nave o cerca de ella.
    if (Math.hypot(x - g.x, y - g.y) < 85) {
      pointerRef.current = { active: true, id: e.pointerId };
      canvas.setPointerCapture?.(e.pointerId);
      moveShip(e);
    }
  }

  function pointerUp(e) {
    if (pointerRef.current.id === e.pointerId) {
      pointerRef.current = { active: false, id: null };
    }
  }

  const world = WORLDS[Math.floor((hud.level - 1) / 50) % WORLDS.length];

  return (
    <main style={styles.page}>
      <div style={styles.hud}>
        <div><small>PUNTOS</small><strong>{hud.score}</strong></div>
        <div><small><Star size={12} /> ESTRELLAS</small><strong>{hud.stars}</strong></div>
        <div><small>NIVEL</small><strong>{hud.level}/{MAX_LEVEL}</strong></div>
        <div><small>VIDAS</small><strong style={{ color: '#ff7185' }}>{'♥'.repeat(hud.lives) || '—'}</strong></div>
      </div>

      <div style={styles.frame}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={styles.canvas}
          onPointerDown={pointerDown}
          onPointerMove={moveShip}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onLostPointerCapture={pointerUp}
          aria-label="Arrastra el dedo sobre la nave para moverla por el espacio."
        />

        {!playing && !result && (
          <div style={styles.overlay}>
            <Rocket size={48} color="#54e7ff" />
            <small style={styles.eyebrow}>ARCADE ESPACIAL</small>
            <h1>SPACE<br /><span style={{ color: '#54e7ff' }}>ODYSSEY</span></h1>
            <p>Arrastra la nave con el dedo para esquivar obstáculos y recoger estrellas.</p>

            <div style={styles.shipChoices}>
              {SHIPS.map((ship, i) => (
                <button
                  key={ship.name}
                  onClick={() => setShipChoice(i)}
                  style={{
                    ...styles.shipButton,
                    borderColor: shipChoice === i ? ship.color : '#29415e',
                    background: shipChoice === i ? '#18314c' : '#091326',
                  }}
                >
                  <span style={{ color: ship.color, fontSize: 22 }}>{ship.icon}</span>
                  <small>{ship.name}</small>
                </button>
              ))}
            </div>

            <button style={styles.start} onClick={startGame}>
              <Rocket size={18} /> INICIAR PARTIDA
            </button>
            <button style={styles.fullscreen} onClick={goFullscreen}>
              <Maximize2 size={15} /> PANTALLA COMPLETA
            </button>
            <small style={styles.note}>501 NIVELES · 10 MUNDOS · DIFICULTAD PROGRESIVA</small>
          </div>
        )}

        {result && (
          <div style={styles.overlay}>
            <div style={{ fontSize: 48 }}>💥</div>
            <small style={styles.eyebrow}>FIN DE LA PARTIDA</small>
            <h2>¡VUELVE A INTENTARLO!</h2>
            <div style={styles.resultBox}>
              <div><small>PUNTOS</small><strong>{result.score}</strong></div>
              <div><small>ESTRELLAS</small><strong>{result.stars}</strong></div>
              <div><small>NIVEL</small><strong>{result.level}</strong></div>
            </div>
            <button style={styles.start} onClick={startGame}>
              <RotateCcw size={18} /> VOLVER A JUGAR
            </button>
            <button style={styles.fullscreen} onClick={() => {
              runningRef.current = false;
              setPlaying(false);
              setResult(null);
            }}>VOLVER AL MENÚ</button>
          </div>
        )}
      </div>

      <div style={styles.info}>
        <div><Star size={15} color="#ffc45b" /> <span>{hud.value} puntos por estrella</span></div>
        <div><Trophy size={15} color="#54e7ff" /> <span>{world.name}</span></div>
        <div><span>⏱</span> <span>Dificultad: +1 cada minuto</span></div>
      </div>

      {playing && (
        <div style={styles.touchHint}>☝️ TOCA LA NAVE Y ARRASTRA EL DEDO PARA MOVERLA</div>
      )}
    </main>
  );
}

const styles = {
  page: {
    position: 'fixed', inset: 0, width: '100%', height: '100dvh',
    overflow: 'hidden', background: '#030712', color: '#edf8ff',
    fontFamily: 'Inter, system-ui, sans-serif', display: 'flex',
    flexDirection: 'column', padding: 'max(env(safe-area-inset-top), 6px) 8px max(env(safe-area-inset-bottom), 6px)',
    boxSizing: 'border-box', zIndex: 9999, touchAction: 'none',
  },
  hud: {
    display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.7fr',
    gap: 5, flex: '0 0 auto', paddingBottom: 6,
  },
  frame: {
    position: 'relative', flex: '1 1 auto', minHeight: 0, width: '100%',
    overflow: 'hidden', border: '1px solid #244b70', borderRadius: 9,
    background: '#06152b', boxShadow: '0 0 24px #14396555',
  },
  canvas: {
    display: 'block', width: '100%', height: '100%',
    touchAction: 'none', userSelect: 'none',
  },
  hudCard: {},
  overlay: {
    position: 'absolute', inset: 0, overflowY: 'auto',
    padding: '20px 18px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    background: 'linear-gradient(180deg,#040b1cf2,#09132bf5)',
    backdropFilter: 'blur(5px)', gap: 12,
  },
  eyebrow: { color: '#ffc45b', letterSpacing: 2, fontWeight: 900, fontSize: 10 },
  start: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', maxWidth: 270, padding: 15, border: 0, borderRadius: 10,
    background: 'linear-gradient(110deg,#54e7ff,#a5f5ff)',
    color: '#041019', fontWeight: 900, letterSpacing: 1, cursor: 'pointer',
  },
  fullscreen: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: 10, background: '#101f35', border: '1px solid #31516f',
    color: '#c6eaff', borderRadius: 9, fontSize: 10, fontWeight: 800,
  },
  shipChoices: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%', maxWidth: 300 },
  shipButton: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    padding: '9px 2px', border: '1px solid', borderRadius: 9, color: '#edf8ff',
  },
  note: { color: '#8ca4c0', fontSize: 9, letterSpacing: 1, lineHeight: 1.7 },
  resultBox: { display: 'flex', justifyContent: 'center', gap: 22, padding: 12 },
  info: {
    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
    gap: 6, padding: '9px 2px 3px', color: '#a9bfd5', fontSize: 10,
  },
  touchHint: {
    textAlign: 'center', color: '#54e7ff', fontSize: 9, letterSpacing: 1,
    padding: '4px 0 2px', flex: '0 0 auto',
  },
};
