import React from "react";

/**
 * TradingPage
 *
 * Vue dédiée au TRADING INTERNE (capital propre).
 * C'est ici qu'on va afficher :
 *  - Capital de départ
 *  - Équité actuelle
 *  - PnL total
 *  - Drawdown max
 *  - Win rate
 *  - Courbe d'équité
 *
 * Pour l'instant c'est un squelette propre, mais déjà avec les props dont on aura besoin.
 *
 * Props attendues :
 * - goHome(): revient à la Home
 * - kpi: objet avec les valeurs calculées par App (on les branchera après)
 *      {
 *        capitalInitialFmt,
 *        equityNowFmt,
 *        pnlTotalFmt,
 *        maxDDPctFmt,
 *        maxDDAbsFmt,
 *        winRatePctFmt,
 *        tradesCount
 *      }
 */
export default function TradingPage({ goHome, kpi }) {
  return (
    <div className="page-outer" style={{ width: "100%" }}>
      {/* Header local (bouton retour + titre de la page) */}
      <div
        className="header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <button className="btn ghost" onClick={goHome}>
          ← Accueil
        </button>

        <div
          style={{
            opacity: 0.8,
            fontSize: 12,
            color: "var(--text)",
          }}
        >
          Trading Interne
        </div>
      </div>

      {/* Contenu page */}
      <div
        className="page-content"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Bloc titre + description */}
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
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "var(--white)",
              marginBottom: 6,
            }}
          >
            Trading Interne
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--text)",
              opacity: 0.9,
            }}
          >
            Vue purement dédiée à notre capital propre (fonds maison). On ne
            mélange pas ici les revenus Darwinex / Axi ni les payouts prop firm.
            Objectif : suivre la performance nette de notre trading interne, le
            risque et la stabilité.
          </div>
        </div>

        {/* KPIs principaux en grille */}
        <div
          className="kpi-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(180px,100%),1fr))",
            gap: 16,
          }}
        >
          <KpiCard label="Capital Initial" value={kpi.capitalInitialFmt} />
          <KpiCard label="Équité Actuelle" value={kpi.equityNowFmt} />
          <KpiCard label="PnL Total" value={kpi.pnlTotalFmt} />
          <KpiCard label="Max DD %" value={kpi.maxDDPctFmt} />
          <KpiCard label="Max DD (Abs.)" value={kpi.maxDDAbsFmt} />
          <KpiCard label="Win Rate" value={kpi.winRatePctFmt} />
          <KpiCard label="Nb Trades" value={kpi.tradesCount} />
        </div>

        {/* Courbe d'équité + drawdown etc. */}
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
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--white)",
              marginBottom: 12,
            }}
          >
            Courbe d’Équité (bientôt)
          </div>

          <div
            style={{
              fontSize: 13,
              color: "var(--text)",
              opacity: 0.8,
              lineHeight: 1.4,
            }}
          >
            Ici on va remettre la vraie courbe d’équité + les points "perte"
            + les points "flux" (comme avant dans Centre de Contrôle). On la
            branchera une fois que la page est bien incluse dans App.
          </div>
        </div>
      </div>
    </div>
  );
}

/* Petit composant visuel pour un KPI */
function KpiCard({ label, value }) {
  return (
    <div
      className="card halo-neutral"
      style={{
        border: "1px solid var(--border)",
        borderRadius: 16,
        backgroundColor: "var(--panel)",
        padding: 16,
        minHeight: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        className="kpi-title cap"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text)",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>

      <div
        className="val val-main"
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "var(--white)",
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

