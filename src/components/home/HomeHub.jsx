import React from "react";
import DarwinWidget from "./DarwinWidget.jsx";

export default function HomeHub({ setView, t, subtitle }) {
  return (
    <div
      className="home-hero"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        width: "100%",
        padding: "20px 16px",
      }}
    >
      {/* Titre principal */}
      <h1
        className="brand"
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "var(--white)",
          margin: 0,
          textAlign: "center",
        }}
      >
        {t.brand} <span style={{ opacity: 0.6, fontSize: 14 }}>• v5.1.1 • 2025</span>
      </h1>

      {/* Sous-titre */}
      <p
        className="subtitle home-subtitle"
        style={{
          marginTop: 8,
          color: "var(--text)",
          opacity: 0.9,
          fontSize: 14,
          maxWidth: 600,
          textAlign: "center",
        }}
      >
        {subtitle ||
          "Le tableau de bord de performance trading Edouard & Michel Jimenez"}
      </p>

      {/* GRID cartes + widget */}
      <div
        className="home-grid"
        style={{
          marginTop: 24,
          width: "100%",
          maxWidth: 1200,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        {/* Carte Contrôle */}
        <button
          className="card"
          onClick={() => setView("control")}
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
          <div
            className="kpi-title"
            style={{
              color: "var(--accent)",
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 6,
            }}
          >
            Centre de Contrôle
          </div>
          <div
            style={{
              color: "var(--text)",
              opacity: 0.85,
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            Vue complète: filtres, equity, corrélation, calendrier, activité.
          </div>
        </button>

        {/* Carte Comptabilité */}
        <button
          className="card"
          onClick={() => setView("compta")}
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
          <div
            className="kpi-title"
            style={{
              color: "var(--accent)",
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 6,
            }}
          >
            Comptabilité d’Entreprise
          </div>
          <div
            style={{
              color: "var(--text)",
              opacity: 0.85,
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            Suivi des flux (payouts, frais, dépôts), catégories et exports.
          </div>
        </button>

        {/* Carte Gestion du Risque */}
        <button
          className="card"
          onClick={() => setView("risk")}
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
          <div
            className="kpi-title"
            style={{
              color: "var(--accent)",
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 6,
            }}
          >
            Gestion du Risque
          </div>
          <div
            style={{
              color: "var(--text)",
              opacity: 0.85,
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            Seuils, limites et recommandations d’ajustement.
          </div>
        </button>

        {/* Widget Darwinex */}
        <div
          className="card"
          style={{
            padding: 18,
            border: "1px solid var(--border)",
            borderRadius: 16,
            background: "var(--panel)",
          }}
        >
          <div
            className="kpi-title"
            style={{
              color: "var(--accent)",
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 6,
            }}
          >
            Darwin VYU
          </div>

          <div
            style={{
              color: "var(--text)",
              opacity: 0.85,
              fontSize: 13,
              lineHeight: 1.4,
              marginBottom: 12,
            }}
          >
            Performance live du Darwin.
          </div>

          <DarwinWidget />
        </div>
      </div>
    </div>
  );
}
