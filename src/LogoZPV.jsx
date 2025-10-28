// src/LogoZPV.jsx
import React from 'react';

export default function LogoZPV({ size = 28 }) {
  // on utilise la variable CSS --green (#20e3d6) déjà présente
  // V = 2 segments, la barre droite est volontairement plus courte
  return (
    <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="brand-word">ZooProject</span>
      <svg
        width={size * 1.1}
        height={size}
        viewBox="0 0 110 100"
        aria-label="V de Vision"
        role="img"
        style={{ display: 'block' }}
      >
        {/* Barre gauche */}
        <path
          d="M10 10 L50 90"
          fill="none"
          stroke="var(--green)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Barre droite (plus courte) */}
        <path
          d="M50 90 L100 42"
          fill="none"
          stroke="var(--green)"
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>
      <span className="brand-word">ision</span>
    </div>
  );
}

