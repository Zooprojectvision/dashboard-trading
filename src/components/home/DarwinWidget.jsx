import React from "react"

/*
  Widget Darwinex intégré en tant que carte cohérente visuellement.
  Pour l’instant c’est une <img> cliquable.
*/

export default function DarwinWidget() {
  return (
    <div
      className="card"
      style={{
        border: "1px solid var(--border)",
        borderRadius: 16,
        background: "var(--panel)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Titre bloc Darwin */}
      <div
        style={{
          color: "#4da3ff", // le même bleu
          fontWeight: 600,
          fontSize: 15,
          lineHeight: 1.4,
          width: "100%",
          marginBottom: 12,
          textAlign: "left",
        }}
      >
        Darwinex Allocation
      </div>

      {/* Lien + image du widget Darwinex */}
      <a
        href="https://www.darwinex.com/invest/VYU?utm_source=WidgetDarwin&utm_medium=Referral&utm_campaign=WidgetChart&utm_content=fxzooinvest"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
        }}
      >
        <img
          src="https://prodx-widgets.s3-eu-west-1.amazonaws.com/VYU.5.3-widgets-darwin-chart-darwin-all-bg-darkest-l-fr.png"
          alt="VYU"
          style={{
            width: "100%",
            height: "auto",
            borderRadius: 12,
            border: "1px solid var(--border)",
            display: "block",
          }}
        />
      </a>

      {/* Petit texte sous le widget */}
      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          lineHeight: 1.4,
          color: "var(--text)",
          opacity: 0.7,
          textAlign: "center",
        }}
      >
        Compte géré / Performance live.  
        Revenus de management & performance fee.
      </div>
    </div>
  )
}

