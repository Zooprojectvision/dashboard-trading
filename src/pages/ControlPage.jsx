import React from "react";

export default function ControlPage() {
  return (
    <main className="control-root">
      {/* en-tête */}
      <section className="control-header">
        <div>
          <h1>Control — Rapport</h1>
          <p className="subtitle">Vue synthétique des performances, risques & corrélations</p>
        </div>
        <div className="control-actions">
          <button className="btn ghost">À propos</button>
          <button className="btn">Niveaux de capital</button>
          <button className="btn">Cash-Flows</button>
        </div>
      </section>

      {/* KPIs */}
      <section className="control-kpis">
        <Kpi title="PnL MTD" value="+3.2%" note="Objectif 4.0%" />
        <Kpi title="Win rate" value="58%" note="30j rolling" />
        <Kpi title="Max DD" value="-4.8%" note="Règle: -5%" />
      </section>

      {/* zone principale */}
      <section className="control-main">
        <div className="panel">
          <h3 className="panel-title">Équity</h3>
          <div className="placeholder">Graphique équity (à brancher)</div>
        </div>
        <div className="right-col">
          <div className="panel">
            <h3 className="panel-title">Corrélations</h3>
            <div className="placeholder">Heatmap corrélations (à brancher)</div>
          </div>
          <div className="panel">
            <h3 className="panel-title">Calendrier</h3>
            <div className="placeholder">Événements/Journal (à brancher)</div>
          </div>
        </div>
      </section>

      {/* table mapping */}
      <section className="control-table panel">
        <h3 className="panel-title">Mapping Stratégies / Instruments</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Stratégie</th><th>Instrument</th><th>Risque</th><th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Taurusteum</td><td>XAUUSD</td><td>1.0%</td><td>Actif</td></tr>
            <tr><td>Lupusteum</td><td>GBPUSD</td><td>0.6%</td><td>Actif</td></tr>
            <tr><td>Sepultura</td><td>AUDJPY</td><td>0.8%</td><td>Pause</td></tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Kpi({ title, value, note }) {
  return (
    <div className="kpi panel">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note">{note}</div>
    </div>
  );
}

