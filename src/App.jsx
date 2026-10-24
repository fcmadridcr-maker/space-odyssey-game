
import React, { useState } from 'react';
import {
  Rocket, Star, Orbit, Telescope, Zap, Target,
  LockKeyhole, Trophy, CheckCircle2, ArrowLeft,
} from 'lucide-react';

const MISSIONS = [
  { id: 1, planet: 'Luna Nova', icon: '🌑', goal: 10, reward: 50,
    title: 'Primer contacto', description: 'Recolecta 10 unidades de energía.' },
  { id: 2, planet: 'Marte Rojo', icon: '🔴', goal: 20, reward: 100,
    title: 'Explorador estelar', description: 'Recolecta 20 unidades de energía.' },
  { id: 3, planet: 'Neptuno', icon: '🔵', goal: 30, reward: 200,
    title: 'El gigante azul', description: 'Recolecta 30 unidades de energía.' },
];

const DEFAULT_SAVE = {
  started: false,
  energy: 0,
  progress: {},
  completed: [],
};

function readSave() {
  try {
    const saved = localStorage.getItem('space-odyssey-save');
    return saved ? { ...DEFAULT_SAVE, ...JSON.parse(saved) } : DEFAULT_SAVE;
  } catch {
    return DEFAULT_SAVE;
  }
}

export default function App() {
  const [game, setGame] = useState(readSave);

  function update(patch) {
    const next = { ...game, ...patch };
    setGame(next);
    try {
      localStorage.setItem('space-odyssey-save', JSON.stringify(next));
    } catch {
      // El juego también funciona si el navegador no permite guardar.
    }
  }

  const current = MISSIONS.find(
    (m) =>
      !game.completed.includes(m.id) &&
      MISSIONS.filter((previous) => previous.id < m.id)
        .every((previous) => game.completed.includes(previous.id))
  );

  function collectEnergy() {
    if (!current) return;

    const progress = {
      ...game.progress,
      [current.id]: (game.progress[current.id] || 0) + 1,
    };

    const amount = progress[current.id];

    if (amount >= current.goal) {
      update({
        progress,
        energy: game.energy + 1 + current.reward,
        completed: [...game.completed, current.id],
      });
    } else {
      update({ progress, energy: game.energy + 1 });
    }
  }

  function restart() {
    update({ ...DEFAULT_SAVE, started: true });
  }

  if (!game.started) {
    return (
      <main className="space-app">
        <header className="topbar">
          <div className="brand"><Orbit size={28} /> SPACE ODYSSEY</div>
          <span className="status"><span className="status-dot" /> SYSTEM ONLINE</span>
        </header>

        <section className="hero">
          <div className="eyebrow"><Star size={15} /> YOUR UNIVERSE AWAITS</div>
          <h1>EXPLORE THE<span>UNKNOWN.</span></h1>
          <p>
            Tu aventura comienza aquí. Completa misiones, consigue
            recompensas y desbloquea planetas desconocidos.
          </p>
          <div className="planet">
            <div className="planet-ring" />
            <div className="planet-core" />
            <span className="planet-star star-one">✦</span>
            <span className="planet-star star-two">✧</span>
            <span className="planet-star star-three">✦</span>
          </div>
          <button className="launch-button" onClick={() => update({ started: true })}>
            <Rocket size={19} /> INICIAR MISIÓN
          </button>
          <div className="mission-note">
            <Telescope size={15} /> PREPÁRATE PARA EL DESPEGUE
          </div>
        </section>
        <footer>
          <span>SECTOR 001</span>
          <span>DEEP SPACE EXPLORATION</span>
          <span>© SPACE ODYSSEY</span>
        </footer>
      </main>
    );
  }

  return (
    <main className="space-app">
      <header className="topbar">
        <div className="brand"><Orbit size={28} /> SPACE ODYSSEY</div>
        <div className="status"><Zap size={17} /> {game.energy} ENERGÍA</div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Target size={15} /> CENTRO DE MANDO</div>
        <h1>YOUR<span>GALAXY.</span></h1>
        <p>Misiones completadas: {game.completed.length} de {MISSIONS.length}</p>

        <div className="game-planets">
          {MISSIONS.map((mission) => {
            const unlocked =
              mission.id === 1 || game.completed.includes(mission.id - 1);
            const completed = game.completed.includes(mission.id);

            return (
              <div className="game-planet" key={mission.id}>
                <div className="game-planet-icon">
                  {completed ? <CheckCircle2 size={32} /> :
                    unlocked ? mission.icon : <LockKeyhole size={28} />}
                </div>
                <strong>{unlocked ? mission.planet : 'Desconocido'}</strong>
                <small>
                  {completed ? 'COMPLETADO' : unlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                </small>
              </div>
            );
          })}
        </div>

        {current ? (
          <div className="game-mission">
            <div className="eyebrow"><Target size={15} /> MISIÓN {current.id}</div>
            <h2>{current.icon} {current.title}</h2>
            <p>{current.description}</p>

            <div className="mission-progress">
              <div
                className="mission-progress-fill"
                style={{
                  width: `${Math.min(100, ((game.progress[current.id] || 0) / current.goal) * 100)}%`,
                }}
              />
            </div>

            <p>
              Objetivo: {Math.min(game.progress[current.id] || 0, current.goal)}
              {' / '}{current.goal} unidades
            </p>
            <p className="mission-reward">
              <Trophy size={17} /> Recompensa al completar: {current.reward} de energía
            </p>

            <button className="launch-button" onClick={collectEnergy}>
              <Zap size={19} /> RECOLECTAR ENERGÍA +1
            </button>
            <p className="mission-note">Cada pulsación avanza tu objetivo.</p>
          </div>
        ) : (
          <div className="game-mission">
            <Trophy size={42} />
            <h2>¡MISIÓN CUMPLIDA, COMANDANTE!</h2>
            <p>Has conquistado todos los planetas disponibles.</p>
            <button className="launch-button" onClick={restart}>JUGAR DE NUEVO</button>
          </div>
        )}

        <button className="back-button" onClick={() => update({ started: false })}>
          <ArrowLeft size={16} /> VOLVER AL INICIO
        </button>
      </section>

      <footer>
        <span>SECTOR 001</span>
        <span><Star size={13} /> EXPLORACIÓN GALÁCTICA</span>
        <button className="reset-button" onClick={restart}>Reiniciar progreso</button>
      </footer>
    </main>
  );
}
