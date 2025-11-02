import React from "react";

export default function TradingPage() {
  return (
    <div className="page-outer">
      <div className="page-content">
        <div className="card" style={{ padding: 16 }}>
          <div className="block-head">
            <div className="block-title cap">Trading Interne (Capital Propre)</div>
          </div>
          <p style={{ marginTop: 8, opacity: 0.8, fontSize: 14 }}>
            Ici on affichera les métriques du capital que tu trades toi-même :
            équité, drawdown, répartition stratégies, calendrier, etc.
          </p>
        </div>
      </div>
    </div>
  );
}

