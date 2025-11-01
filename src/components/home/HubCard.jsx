import React from "react"

/*
  Carte cliquable utilisée sur la page d'accueil.
  - title : titre bleu
  - subtitle : petit texte gris
  - onClick : navigation (setView('control'), etc.)
*/

export default function HubCard({ title, subtitle, onClick }) {
  return (
    <button
      className="card"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 18,
        border: "1px solid var(--border)",
        borderRadius: 16,
        width: "100%",
        cursor: "pointer",
        background: "var(--panel)",
      }}
    >
      {/* Titre bleu */}
      <div
        className="kpi-title"
        style={{
          color: "#4da3ff",           // bleu pro
          fontWeight: 600,
          fontSize: 15,
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>

      {/* Sous-texte gris */}
      <div
        style={{
          marginTop: 6,
          color: "var(--text)",
          opacity: 0.85,
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        {subtitle}
      </div>
    </button>
  )
}

