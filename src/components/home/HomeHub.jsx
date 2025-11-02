import React from "react";
import HubCard from "./HubCard.jsx";
import DarwinWidget from "./DarwinWidget.jsx"; // si tu veux afficher le widget Darwin en bas (optionnel)

/**
 * Page d'accueil / Hub
 * - Montre les 4 pôles de revenus de l'entreprise
 * - Redirige vers les vues correspondantes via setView(...)
 *
 * Props attendues :
 *  - setView(viewName: string) vient de App.jsx
 *  - t = traductions / i18n (t.brand par ex)
 *  - subtitle = sous-titre éditable stocké dans App.jsx
 */
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
      {/* ===== Titre principal centré ===== */}
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

      {/* ===== Sous-titre centré ===== */}
      <p
        className="subtitle home-subtitle"
        style={{
          marginTop: 8,
          color: "var(--text)",
          opacity: 0.9,
          fontSize: 14,
          maxWidth: 600,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {subtitle ||
          "Le tableau de bord de performance trading Edouard & Michel Jimenez"}
      </p>

      {/* ===== Grille principale : les 4 pôles business ===== */}
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
        {/* 1. Trading Interne */}
        <HubCard
          title="Trading Interne"
          subtitle="Capital propre, drawdown, performance quotidienne, contrôle du risque."
          onClick={() => setView("trading")}
        />

        {/* 2. Gestion pour Tiers (Darwinex / Axi) */}
        <HubCard
          title="Gestion pour Tiers (Darwinex / Axi)"
          subtitle="Capital alloué par des tiers, fees management, crédibilité investisseur."
          onClick={() => setView("darwinex")}
        />

        {/* 3. Prop Firms */}
        <HubCard
          title="Prop Firms"
          subtitle="Payouts, frais de challenge, règles de risque, comptes actifs."
          onClick={() => setView("propfirms")}
        />

        {/* 4. Comptabilité d’Entreprise */}
        <HubCard
          title="Comptabilité d’Entreprise"
          subtitle="Revenus, charges, marge nette consolidée."
          onClick={() => setView("compta")}
        />
      </div>

      {/* ===== Widget Darwinex (optionnel, sous les cartes) ===== */}
      <div
        style={{
          marginTop: 24,
          width: "100%",
          maxWidth: 1200,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        <div
          className="card"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 16,
            backgroundColor: "var(--panel)",
            padding: 16,
          }}
        >
          <div
            className="kpi-title"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--white)",
              marginBottom: 12,
            }}
          >
            Performance publique investissable
          </div>

          <DarwinWidget />
        </div>
      </div>
    </div>
  );
}
