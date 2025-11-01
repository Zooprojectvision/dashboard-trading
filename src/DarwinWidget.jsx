import React from "react";

/**
 * Widget Darwinex (VYU)
 *
 * - Affichage en carte sombre, arrondie, pro.
 * - Le widget est cliquable : il envoie vers ton Darwin.
 * - L'image vient directement de Darwinex (pas hébergée chez toi).
 *
 * Props:
 *   title (string) -> petit titre au-dessus, ex: "Stratégie Live (Darwinex)"
 *   note  (string) -> texte sous l'image, optionnel
 */
export default function DarwinWidget({
  title = "Stratégie Live (Darwinex)",
  note = "Performance live du DARWIN VYU. Données fournies par Darwinex."
}) {
  return (
    <section
      className="card"
      style={{
        backgroundColor: "var(--panel, #111318)",
        border: "1px solid var(--border, #1f2a37)",
        borderRadius: 16,
        padding: 16,
        maxWidth: 360,
        width: "100%",
        textAlign: "center",
        margin: "0 auto",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
      }}
    >
      {/* Titre au-dessus du widget */}
      <div
        style={{
          color: "var(--text, #c5ccd3)",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 12,
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>

      {/* Le widget Darwinex lui-même */}
      <a
        href="https://www.darwinex.com/invest/VYU?utm_source=WidgetDarwin&utm_medium=Referral&utm_campaign=WidgetChart&utm_content=fxzooinvest"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#000",
        }}
      >
        <img
          src="https://prodx-widgets.s3-eu-west-1.amazonaws.com/VYU.5.3-widgets-darwin-chart-darwin-all-bg-darkest-l-fr.png"
          alt="VYU"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </a>

      {/* Texte sous le widget */}
      {note && (
        <p
          style={{
            marginTop: 12,
            marginBottom: 0,
            color: "var(--text, #c5ccd3)",
            fontSize: 11,
            lineHeight: 1.5,
            opacity: 0.7,
          }}
        >
          {note}
        </p>
      )}
    </section>
  );
}

