import React from "react";
import DarwinWidget from "./DarwinWidget.jsx";

function HubCard({ title, subtitle, onClick, accent }) {
  return (
    <button
      className="card hub-card"
      onClick={onClick}
      style={{
        textAlign: "left",
        width: "100%",
        background:
          "linear-gradient(145deg, var(--panel) 0%, rgba(20,25,40,0.4) 100%)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 16,
        cursor: "pointer",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          className="hub-title"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: accent || "var(--accent)",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div
          className="hub-sub"
          style={{
            fontSize: 13,
            lineHeight: 1.4,
            color: "var(--text)",
            opacity: 0.9,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "var(--text)",
          opacity: 0.6,
          marginTop: 12,
        }}
      >
        Ouvrir →
      </div>
    </button>
  );
}

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
      }}
    >
      {/* Titre principal centré */}
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
        {t.brand}
      </h1>

      {/* Sous-titre centré */}
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

      {/* Grille : 3 cartes + widget Darwin */}
      <div
        className="home-grid"
        style={{
          marginTop: 24,
          width: "100%",
          maxWidth: 1200,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          alignItems: "stretch",
        }}
      >
        {/* 1. Centre de Contrôle */}
        <HubCard
          title="Centre de Contrôle"
          subtitle="Vue complète: filtres, equity, corrélation, calendrier, activité."
          accent="var(--accent)"
          onClick={() => {
            // IMPORTANT : aucune espace, exactement "control"
            setView("control");
          }}
        />

        {/* 2. Comptabilité d’Entreprise */}
        <HubCard
          title="Comptabilité d’Entreprise"
          subtitle="Suivi des flux (payouts, frais, dépôts), catégories et exports."
          accent="var(--green)"
          onClick={() => {
            // IMPORTANT : aucune espace, exactement "compta"
            setView("compta");
          }}
        />

        {/* 3. Gestion du Risque */}
        <HubCard
          title="Gestion du Risque"
          subtitle="Seuils, limites et recommandations d’ajustement."
          accent="var(--pink)"
          onClick={() => {
            // IMPORTANT : aucune espace, exactement "risk"
            setView("risk");
          }}
        />

        {/* 4. Widget Darwinex (aperçu perf / marketing) */}
        <div
          className="card"
          style={{
            background:
              "linear-gradient(145deg, var(--panel) 0%, rgba(20,25,40,0.4) 100%)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 16,
            minHeight: 140,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--blue, #4da3ff)",
              marginBottom: 8,
              textAlign: "left",
            }}
          >
            Darwinex - Allocation Externe
          </div>

          <div
            style={{
              flex: 1,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "rgba(0,0,0,0.2)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
            }}
          >
            {/* Le widget réel */}
            <DarwinWidget />
          </div>

          <div
            style={{
              fontSize: 11,
              lineHeight: 1.4,
              color: "var(--text)",
              opacity: 0.6,
              marginTop: 8,
              textAlign: "left",
            }}
          >
            Rendement du portefeuille investi sur Darwinex.
          </div>
        </div>
      </div>

      {/* Bas de page accueil (branding simple) */}
      <div
        style={{
          marginTop: 32,
          fontSize: 12,
          opacity: 0.5,
          color: "var(--text)",
        }}
      >
        ZooProjectVision • v{APP_VERSION} • 2025
      </div>
    </div>
  );
}
