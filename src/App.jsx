import React from "react";

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Scatter,
} from "recharts";

const styleNum = (v) => ({
  color: Number(v) < 0 ? "var(--pink)" : "var(--text)",
});

/* ===========================
   Utils math / couleurs
   =========================== */

const C = {
  axis: "#c9cdd1",
  white: "#ffffff",
  green: "#20e3d6",
  pink: "#ff5fa2",
  orange: "#ffb347",
  blue: "#6aa9ff",
};

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const std = (a) => {
  if (!a.length) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) * (x - m))));
};
const downsideStd = (a) => {
  if (!a.length) return 0;
  const m = mean(a);
  const n = a.filter((x) => x < m);
  if (!n.length) return 0;
  return Math.sqrt(mean(n.map((x) => (x - m) * (x - m))));
};
const sum = (a) => a.reduce((s, x) => s + x, 0);

/* ===========================
   Demo trades (90 jours)
   =========================== */
function genDemoTrades() {
  const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"];
  const BROKERS = ["Darwinex", "Axi Select"];
  const STRATS = ["Breakout", "MeanRevert", "Momentum"];

  const rows = [];
  const today = new Date();
  for (let i = 90; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);

    for (let k = 0; k < 5; k++) {
      const asset = ASSETS[(i + k) % ASSETS.length];
      const broker = BROKERS[(i + k * 2) % BROKERS.length];
      const strategy = STRATS[(i + k * 3) % STRATS.length];

      let pnl = (Math.random() - 0.5) * (Math.random() < 0.15 ? 2600 : 900);
      pnl = Number(pnl.toFixed(2));

      const mfe = Number(
        (Math.abs(pnl) * (0.8 + Math.random() * 0.8)).toFixed(2)
      );
      const mae = Number(
        (Math.abs(pnl) * (0.6 + Math.random() * 0.8)).toFixed(2)
      );

      rows.push({
        date,
        asset,
        broker,
        strategy,
        pnl,
        ccy: "USD",
        mfe,
        mae,
      });
    }
  }

  return rows;
}

// =============== STYLES INLINE POUR LES CARTES ACCUEIL ===============
// On injecte un objet style commun pour les cards d'accueil.
// (si styles.css n'est pas encore pris en compte par Vite/vercel)

const hubCardBaseStyle = {
  width: "100%",
  textAlign: "left",
  background: `
    radial-gradient(circle at 20% 20%, rgba(32,227,214,0.08) 0%, rgba(17,19,24,0) 60%),
    linear-gradient(to bottom right, rgba(17,19,24,1) 0%, rgba(15,17,21,1) 60%)
  `,
  border: "1px solid rgba(106,169,255,0.4)",
  borderRadius: 20,
  padding: "16px 18px 14px",
  cursor: "pointer",
  boxShadow:
    "0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(32,227,214,0)",
  transition:
    "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
};

// état hover simulé avec onMouseEnter/onMouseLeave
function HubCard({ title, sub, onClick, disabled }) {
  const [hover, setHover] = React.useState(false);

  const liveStyle = {
    ...hubCardBaseStyle,
    transform: hover ? "scale(1.03)" : "scale(1)",
    borderColor: hover
      ? "rgba(32,227,214,0.7)"
      : "rgba(106,169,255,0.4)",
    boxShadow: hover
      ? "0 24px 48px rgba(0,0,0,0.9), 0 0 35px rgba(32,227,214,0.5), 0 0 70px rgba(32,227,214,0.25)"
      : "0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(32,227,214,0)",
    cursor: disabled ? "default" : "pointer",
  };

  return (
    <button
      style={liveStyle}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.3,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase", // ← MAJUSCULE VISUELLE
          color: "#c5ccd3",
          opacity: 0.95,
          marginBottom: 6,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Inter", "Roboto", "Segoe UI", sans-serif',
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.4,
          color: "#c5ccd3",
          opacity: 0.8,
          fontWeight: 400,
          maxWidth: 480,
          textAlign: "left",
        }}
      >
        {sub}
      </div>
    </button>
  );
}

// =============== PAGE ACCUEIL DIRECTEMENT ICI =================
function HomeHubInline({ setView, t, subtitle }) {
  const go = (v) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  return (
    <div
      style={{
        padding: "24px 16px 80px",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* Bandeau header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent, #6aa9ff)",
            opacity: 0.9,
          }}
        >
          {t?.brand || "ZooProjectVision • v5.1.1 • 2025"}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "var(--text, #c5ccd3)",
            opacity: 0.7,
            lineHeight: 1.4,
            marginTop: 4,
          }}
        >
          {subtitle ||
            "Designed & Built by ZooProjectVision V5.1.1 @ 2025"}
        </div>
      </div>

      {/* Les 4 blocs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(min(320px,100%),1fr))",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        <HubCard
          title="CENTRE DE CONTRÔLE"
          sub="Vue complète: filtres, equity, corrélation, calendrier, activité."
          onClick={() => go("control")}
        />

        <HubCard
          title="COMPTABILITÉ D’ENTREPRISE"
          sub="Suivi des flux (payouts, frais, dépôts), catégories et exports."
          onClick={() => go("compta")}
        />

        <HubCard
          title="GESTION DU RISQUE"
          sub="Seuils, limites et recommandations d’ajustement."
          onClick={() => go("risk")}
        />

        <HubCard
          title="DARWIN VYU"
          sub="Performance live du Darwin."
          onClick={() => {}}
          disabled={true}
        />
      </div>
    </div>
  );
}
