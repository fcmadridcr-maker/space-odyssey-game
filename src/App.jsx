
import React from 'react';
import { Rocket, Star, Orbit, Telescope } from 'lucide-react';

export default function App() {
  return (
    <main className="space-app">
      <header className="topbar">
        <div className="brand">
          <Orbit size={28} />
          <span>SPACE ODYSSEY</span>
        </div>
        <span className="status">
          <span className="status-dot" />
          SYSTEM ONLINE
        </span>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <Star size={15} /> YOUR UNIVERSE AWAITS
        </div>
        <h1>
          EXPLORE THE
          <span>UNKNOWN.</span>
        </h1>
        <p>
          Tu aventura comienza aquí. Explora la inmensidad del cosmos
          y descubre lo que se esconde más allá de las estrellas.
        </p>

        <div className="planet">
          <div className="planet-ring" />
          <div className="planet-core" />
          <span className="planet-star star-one">✦</span>
          <span className="planet-star star-two">✧</span>
          <span className="planet-star star-three">✦</span>
        </div>

        <button
          className="launch-button"
          onClick={() => alert('¡Misión iniciada, astronauta!')}
        >
          <Rocket size={19} />
          INICIAR MISIÓN
        </button>
        <div className="mission-note">
          <Telescope size={15} />
          PREPÁRATE PARA EL DESPEGUE
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
