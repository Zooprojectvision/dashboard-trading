import React from "react";
import HubCard from "./HubCard.jsx";
import DarwinWidget from "./DarwinWidget.jsx";

export default function HomeHub({ setView, t, subtitle }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
        padding: "24px 24px 80px",
        color: "var(--text)",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter','Roboto','Segoe UI'",
      }}
    >
      {/* HEADER TOP */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: 8,
          columnGap: 12,
          marginBottom: 24,
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--accent, #6aa9ff)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              lineHeight: 1.2,
            }}
          >
            {t?.brand || "ZooProjectVision"}
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--white,#fff)",
              lineHeight: 1.3,
              marginTop: 4,
            }}
          >
            {subtitle || "Centre d’observation global"}
          </div>

          <div
            style={{
              fontSize: 12,
              lineHeight: 1.4,
              opacity: 0.6,
              color: "var(--text,#c5ccd3)",
              marginTop: 6,
            }}
          >
            ZooProjectVision • v5.1.1 • 2025
          </div>
        </div>

        <div
          style={{
            minWidth: 220,
            fontSize: 12,
            lineHeight: 1.4,
            color: "var(--text,#c5ccd3)",
            opacity: 0.75,
            textAlign: "right",
          }}
        >
          Designed & Built by ZooProjectVision V5.1.1 @ 2025
        </div>
      </header>

      {/* GRID HAUT : 4 CARTES ACTION */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <HubCard
          title="Centre de contrôle"
          subtitle="Vue complète: filtres, equity, corrélation, calendrier, activité."
          goto="control"
          onNav={(v) => setView(v)}
        />

        <HubCard
          title="Comptabilité d’entreprise"
          subtitle="Suivi des flux (payouts, frais, dépôts), catégories et exports."
          goto="compta"
          onNav={(v) => setView(v)}
        />

        <HubCard
          title="Gestion du risque"
          subtitle="Seuils, limites et recommandations d’ajustement."
          goto="risk"
          onNav={(v) => setView(v)}
        />

        <HubCard
          title="Darwin VYU"
          subtitle="Performance live du Darwin."
          goto="darwin"
          onNav={(v) => setView(v)}
        />
      </section>

      {/* BLOC DARWIN WIDGET PLEINE LARGEUR */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            borderRadius: 20,
            padding: 16,
            border: "1px solid rgba(106,169,255,0.4)",
            background:
              "radial-gradient(circle at 0% 0%, rgba(20,30,50,0.6) 0%, rgba(10,11,15,0.6) 60%)",
            boxShadow:
              "0 0 20px rgba(106,169,255,0.25), 0 30px 60px rgba(0,0,0,0.8)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#6aa9ff",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              lineHeight: 1.2,
            }}
          >
            Darwin vyu
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.4,
              color: "#c5ccd3",
              opacity: 0.9,
              marginBottom: 12,
            }}
          >
            Widget Darwinex intégré ici
          </div>

          <DarwinWidget />
        </div>
      </section>

      {/* FOOTER LOCAL PAGE ACCUEIL */}
      <footer
        style={{
          fontSize: 11,
          lineHeight: 1.4,
          textAlign: "center",
          color: "var(--text,#c5ccd3)",
          opacity: 0.5,
          marginTop: 40,
        }}
      >
        Designed & Built by ZooProjectVision V5.1.1 @ 2025
      </footer>
    </div>
  );
}
