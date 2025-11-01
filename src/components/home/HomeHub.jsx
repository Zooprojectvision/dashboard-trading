import React from "react";
import HubCard from "./HubCard.jsx";
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

      {/* Grille cartes + widget Darwin */}
      <div
        className="grid-3 home-grid"
        style={{
          marginTop: 24,
          width: "100%",
          maxWidth: 1200,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        {/* Carte 1 */}
        <HubCard
          title="Centre de Contrôle"
          subtitle="Vue complète: filtres, equity, corrélation, calendrier, activité."
          onClick={() => setView("control")}
        />

        {/* Carte 2 */}
        <HubCard
          title="Comptabilité d’Entreprise"
          subtitle="Suivi des flux (payouts, frais, dépôts), catégories et exports."
          onClick={() => setView("compta")}
        />

        {/* Carte 3 */}
        <HubCard
          title="Gestion du Risque"
          subtitle="Seuils, limites et recommandations d’ajustement."
          onClick={() => setView("risk")}
        />

        {/* Widget Darwinex */}
        <DarwinWidget />
      </div>
    </div>
  );
}

