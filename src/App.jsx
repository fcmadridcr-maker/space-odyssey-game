
import React, { useEffect, useRef, useState } from 'react';
import { Rocket, Star, Play, RotateCcw, Heart, Trophy } from 'lucide-react';

const W = 360;
const H = 640;

const initialGame = () => ({
  player: { x: W / 2, y: H - 100, w: 30, h: 42 },
  objects: [],
  particles: [],
  keys: {},
  score: 0,
  stars: 0,
  lives: 3,
  frame: 0,
  over: false,
  nextId: 1,
});

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(initialGame());
  const keysRef = useRef({});
  const runningRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [hud, setHud] = useState({ score: 0, stars: 0, lives: 3 });
  const [soundless] = useState(true);

  function startGame() {
    gameRef.current = initialGame();
    keysRef.current = {};
    setHud({ score: 0, stars: 0, lives: 3 });
    setResult(null);
    runningRef.current = true;
    setPlaying(true);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let lastHud = 0;

    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, '#07132d');
      gradient.addColorStop(0.55, '#10143a');
      gradient.addColorStop(1, '#210e38');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      const g = gameRef.current;
      for (let i = 0; i < 75; i++) {
        const x = (i * 97 + 13) % W;
        const y = (i * 157 + g.frame * (i % 3 + 1) * 0.6) % H;
        ctx.globalAlpha = 0.3 + (i % 5) * 0.13;
        ctx.fillStyle = i % 8 === 0 ? '#54e7ff' : '#ffffff';
        ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(91, 57, 175, 0.10)';
      ctx.beginPath();
      ctx.ellipse(180, 300, 150, 220, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawShip(p) {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Motores luminosos
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#39dfff';
      ctx.fillStyle = '#45dfff';
      ctx.beginPath();
      ctx.moveTo(-7, 14);
      ctx.lineTo(0, 31 + Math.random() * 7);
      ctx.lineTo(7, 14);
      ctx.closePath();
      ctx.fill();

      // Alas
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#3f9dff';
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(15, 16);
      ctx.lineTo(5, 11);
      ctx.lineTo(0, 16);
      ctx.lineTo(-5, 11);
      ctx.lineTo(-15, 16);
      ctx.closePath();
      ctx.fill();

      // Cabina
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle = '#e7fbff';
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(6, 8);
      ctx.lineTo(0, 12);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#43ddff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawMeteor(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rotation);
      ctx.shadowColor = '#ff653f';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#766779';
      ctx.strokeStyle = '#ff9a66';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const r = o.r * (0.76 + 0.24 * Math.sin(i * 8.3));
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff8657';
      ctx.fillRect(-o.r * 0.3, o.r * 0.15, o.r * 0.5, 2);
      ctx.restore();
    }

    function drawAlien(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.shadowColor = '#6dff9b';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#40d57c';
      ctx.beginPath();
      ctx.ellipse(0, 0, o.r, o.r * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b8ffbd';
      ctx.beginPath();
      ctx.ellipse(0, -3, o.r * 0.6, o.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#172443';
      ctx.beginPath();
      ctx.arc(0, -3, o.r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff596e';
      ctx.beginPath();
      ctx.arc(2, -4, o.r * 0.19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6079';
      ctx.beginPath();
      ctx.moveTo(-o.r * 0.45, o.r * 0.55);
      ctx.lineTo(0, o.r * 1.25);
      ctx.lineTo(o.r * 0.45, o.r * 0.55);
      ctx.fill();
      ctx.restore();
    }

    function drawStar(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rotation);
      ctx.shadowColor = '#ffd45a';
      ctx.shadowBlur = 17;
      ctx.fillStyle = '#ffdc62';
      ctx.strokeStyle = '#fff3b0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const r = i % 2 === 0 ? o.r : o.r * 0.44;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      const g = gameRef.current;
      drawBackground();

      if (runningRef.current && !g.over) {
        g.frame++;
        const p = g.player;
        const keys = keysRef.current;
        const speed = 4.2;

        if (keys.ArrowLeft || keys.a) p.x -= speed;
        if (keys.ArrowRight || keys.d) p.x += speed;
        if (keys.ArrowUp || keys.w) p.y -= speed;
        if (keys.ArrowDown || keys.s) p.y += speed;

        p.x = Math.max(22, Math.min(W - 22, p.x));
        p.y = Math.max(35, Math.min(H - 35, p.y));

        const spawnRate = Math.max(23, 52 - Math.floor(g.score / 100));
        if (g.frame % spawnRate === 0) {
          const roll = Math.random();
          const type = roll < 0.53 ? 'meteor' : roll < 0.78 ? 'star' : 'alien';
          const r = type === 'star' ? 10 : type === 'alien' ? 15 : 14 + Math.random() * 10;
          g.objects.push({
            id: g.nextId++,
            type,
            x: r + Math.random() * (W - 2 * r),
            y: -30,
            r,
            rotation: Math.random() * 6,
            speed: 1.8 + Math.random() * 1.6 + g.score / 1800,
          });
        }

        const kept = [];
        for (const o of g.objects) {
          o.y += o.speed;
          o.rotation += o.type === 'meteor' ? 0.025 : 0.01;

          const dx = o.x - p.x;
          const dy = o.y - p.y;
          const hit = Math.hypot(dx, dy) < o.r + 14;

          if (hit && o.type === 'star') {
            g.stars++;
            g.score += 100;
            for (let i = 0; i < 7; i++) {
              g.particles.push({
                x: o.x, y: o.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 22,
              });
            }
            continue;
          }

          if (hit && (o.type === 'meteor' || o.type === 'alien')) {
            g.lives--;
            if (g.lives <= 0) {
              g.lives = 0;
              g.over = true;
              runningRef.current = false;
              setResult({ score: g.score, stars: g.stars });
            } else {
              p.x = W / 2;
              p.y = H - 100;
            }
            continue;
          }

          if (o.y < H + 40) kept.push(o);
          else if (o.type !== 'star') g.score += 1;
        }
        g.objects = kept;
      }

      for (const o of g.objects) {
        if (o.type === 'meteor') drawMeteor(o);
        else if (o.type === 'alien') drawAlien(o);
        else drawStar(o);
      }

      const p = g.player;
      if (!g.over) drawShip(p);

      g.particles = g.particles.filter((part) => part.life > 0);
      for (const part of g.particles) {
        part.x += part.vx;
        part.y += part.vy;
        part.life--;
        ctx.globalAlpha = Math.max(0, part.life / 22);
        ctx.fillStyle = '#ffdf68';
        ctx.fillRect(part.x, part.y, 3, 3);
      }
      ctx.globalAlpha = 1;

      if (g.frame - lastHud > 8) {
        setHud({ score: g.score, stars: g.stars, lives: g.lives });
        lastHud = g.frame;
      }

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    function onDown(e) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(key)) {
        e.preventDefault();
      }
      keysRef.current[key] = true;
    }
    function onUp(e) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      keysRef.current[key] = false;
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  function press(key) {
    keysRef.current[key] = true;
  }
  function release(key) {
    keysRef.current[key] = false;
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logo}><Rocket size={22} /> SPACE ODYSSEY</div>
        <div style={styles.live}><span style={styles.dot} /> EN VIVO</div>
      </div>

      <div style={styles.hud}>
        <div style={styles.hudCard}>
          <span style={styles.label}>PUNTUACIÓN</span>
          <strong style={styles.number}>{String(hud.score).padStart(6, '0')}</strong>
        </div>
        <div style={styles.hudCard}>
          <span style={styles.label}><Star size={13} /> ESTRELLAS</span>
          <strong style={styles.number}>{hud.stars}</strong>
        </div>
        <div style={styles.hudCard}>
          <span style={styles.label}>VIDAS</span>
          <strong style={styles.lives}>{'♥ '.repeat(hud.lives) || '—'}</strong>
        </div>
      </div>

      <div style={styles.gameFrame}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={styles.canvas}
          aria-label="Juego espacial. Usa las flechas o WASD para mover la nave."
        />

        {!playing && !result && (
          <div style={styles.overlay}>
            <div style={styles.bigIcon}>🚀</div>
            <div style={styles.kicker}>MISIÓN DE SUPERVIVENCIA</div>
            <h1 style={styles.title}>SPACE<br /><span style={{ color: '#54e7ff' }}>ODYSSEY</span></h1>
            <p style={styles.copy}>Esquiva meteoritos, evita a los marcianos y recoge estrellas para lograr la mejor puntuación.</p>
            <button style={styles.start} onClick={startGame}><Play size={18} fill="currentColor" /> INICIAR PARTIDA</button>
            <small style={styles.hint}>TECLADO O CONTROLES TÁCTILES</small>
          </div>
        )}

        {result && (
          <div style={styles.overlay}>
            <div style={styles.bigIcon}>💥</div>
            <div style={styles.kicker}>SEÑAL PERDIDA</div>
            <h2 style={styles.title}>FIN DE LA<br /><span style={{ color: '#ff7c8e' }}>PARTIDA</span></h2>
            <div style={styles.resultBox}>
              <div><span style={styles.label}>PUNTUACIÓN</span><strong style={styles.number}>{result.score}</strong></div>
              <div><span style={styles.label}>ESTRELLAS</span><strong style={styles.number}>{result.stars}</strong></div>
            </div>
            <button style={styles.start} onClick={startGame}><RotateCcw size={18} /> VOLVER A JUGAR</button>
          </div>
        )}
      </div>

      <div style={styles.mission}>
        <div style={styles.missionTitle}><Trophy size={17} color="#ffc45b" /> OBJETIVO DE VUELO</div>
        <p style={styles.missionCopy}>Recoge estrellas para sumar 100 puntos. ¡Evita los meteoritos y marcianos!</p>
        <div style={styles.missionStats}>
          <span><Star size={15} color="#ffc45b" /> {hud.stars} estrellas</span>
          <span><Heart size={15} color="#ff7185" /> {hud.lives} vidas restantes</span>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.controlsText}>CONTROLES DE NAVE <small>WASD / FLECHAS</small></div>
        <div style={styles.pad}>
          <span />
          <button aria-label="Arriba" style={styles.padButton} onPointerDown={() => press('ArrowUp')} onPointerUp={() => release('ArrowUp')} onPointerLeave={() => release('ArrowUp')} onPointerCancel={() => release('ArrowUp')}>▲</button>
          <span />
          <button aria-label="Izquierda" style={styles.padButton} onPointerDown={() => press('ArrowLeft')} onPointerUp={() => release('ArrowLeft')} onPointerLeave={() => release('ArrowLeft')} onPointerCancel={() => release('ArrowLeft')}>◀</button>
          <button aria-label="Abajo" style={styles.padButton} onPointerDown={() => press('ArrowDown')} onPointerUp={() => release('ArrowDown')} onPointerLeave={() => release('ArrowDown')} onPointerCancel={() => release('ArrowDown')}>▼</button>
          <button aria-label="Derecha" style={styles.padButton} onPointerDown={() => press('ArrowRight')} onPointerUp={() => release('ArrowRight')} onPointerLeave={() => release('ArrowRight')} onPointerCancel={() => release('ArrowRight')}>▶</button>
        </div>
      </div>

      <footer style={styles.footer}>SPACE ODYSSEY <span>·</span> EXPLORACIÓN GALÁCTICA</footer>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh', width: '100%', maxWidth: 520, margin: '0 auto',
    padding: '14px 12px 22px', color: '#edf8ff', background: '#050914',
    fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 2px 14px', borderBottom: '1px solid #18314a',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8, color: '#54e7ff',
    fontWeight: 900, fontSize: 14, letterSpacing: 1.2,
  },
  live: { color: '#81a3bd', fontSize: 10, letterSpacing: 1.5, display: 'flex', gap: 7, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: '50%', background: '#5dffb0', boxShadow: '0 0 10px #5dffb0' },
  hud: { display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr', gap: 7, padding: '12px 0' },
  hudCard: { background: '#0b1729', border: '1px solid #203c58', borderRadius: 10, padding: '9px 10px', minWidth: 0 },
  label: { display: 'flex', alignItems: 'center', gap: 4, color: '#8ba7c3', fontSize: 9, letterSpacing: 1, fontWeight: 800 },
  number: { display: 'block', color: '#54e7ff', fontSize: 21, fontWeight: 900, marginTop: 3, fontVariantNumeric: 'tabular-nums' },
  lives: { display: 'block', color: '#ff7185', fontSize: 16, marginTop: 5, whiteSpace: 'nowrap' },
  gameFrame: { position: 'relative', width: '100%', aspectRatio: '9 / 16', maxHeight: '64vh', margin: '0 auto', border: '1px solid #245273', borderRadius: 13, overflow: 'hidden', boxShadow: '0 0 28px #10294c66', background: '#07132d' },
  canvas: { display: 'block', width: '100%', height: '100%', objectFit: 'contain', touchAction: 'none' },
  overlay: { position: 'absolute', inset: 0, padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(180deg, #040b1cdd, #08112beF)', backdropFilter: 'blur(3px)' },
  bigIcon: { fontSize: 48, filter: 'drop-shadow(0 0 16px #54e7ff)' },
  kicker: { color: '#ffc45b', fontSize: 10, fontWeight: 800, letterSpacing: 2, marginTop: 14 },
  title: { margin: '12px 0', fontSize: 'clamp(29px, 8vw, 43px)', lineHeight: 1.05, fontWeight: 950, letterSpacing: -1.5 },
  copy: { maxWidth: 290, color: '#a9bed5', fontSize: 13, lineHeight: 1.7, margin: '6px 0 20px' },
  start: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', maxWidth: 260, padding: '15px 12px', border: 0, borderRadius: 10, background: 'linear-gradient(110deg,#54e7ff,#a5f5ff)', color: '#03101a', fontWeight: 900, fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  hint: { marginTop: 14, color: '#718aa6', fontSize: 9, letterSpacing: 1.5 },
  mission: { marginTop: 12, padding: 14, background: '#0b1729', border: '1px solid #203c58', borderRadius: 12 },
  missionTitle: { display: 'flex', alignItems: 'center', gap: 8, color: '#edf8ff', fontSize: 11, fontWeight: 900, letterSpacing: 1 },
  missionCopy: { color: '#91a6c2', fontSize: 12, lineHeight: 1.6, margin: '9px 0' },
  missionStats: { display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', color: '#bed1e6', fontSize: 11 },
  controls: { marginTop: 12, padding: 13, background: '#0b1729', border: '1px solid #203c58', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  controlsText: { color: '#edf8ff', fontSize: 10, fontWeight: 900, letterSpacing: 1, lineHeight: 1.8 },
  pad: { display: 'grid', gridTemplateColumns: 'repeat(3, 42px)', gridTemplateRows: 'repeat(2, 42px)', gap: 4, touchAction: 'none' },
  padButton: { border: '1px solid #3279a4', borderRadius: 8, background: '#102a43', color: '#70e9ff', fontSize: 15, fontWeight: 900, touchAction: 'none', userSelect: 'none' },
  footer: { padding: '18px 0 4px', textAlign: 'center', color: '#607c9b', fontSize: 9, letterSpacing: 1.3 },
  resultBox: { display: 'flex', justifyContent: 'center', gap: 28, padding: '12px 20px 22px' },
};
