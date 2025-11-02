// src/components/control/CorrelationBlock.jsx
import React from "react";

// petite fonction utilitaire locale
function meanArr(a) {
  return a.length ? a.reduce((sum, x) => sum + x, 0) / a.length : 0;
}

// calcule corrélation de Pearson
function corr(a, b) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;

  const ax = a.slice(0, n);
  const bx = b.slice(0, n);

  const ma = meanArr(ax);
  const mb = meanArr(bx);

  let num = 0,
    da = 0,
    db = 0;

  for (let i = 0; i < n; i++) {
    const x = ax[i] - ma;
    const y = bx[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }

  const den = Math.sqrt(da * db);
  return den > 0 ? num / den : 0;
}

// couleur du badge selon corrélation
function verdictColor(v) {
  const a = Math.abs(v);
  if (a <= 0.3) return "halo-good";
  if (a <= 0.6) return "halo-warn";
  return "halo-bad";
}

/*
  Props:
  - rows: trades filtrés [{date, strategy, pnl, ccy?}, ...]
  - convert: fn convert(value, fromCcy, toCcy)
  - ccy: devise d'affichage
*/
export default function CorrelationBlock({ rows, convert, ccy }) {
  // liste des stratégies uniques
  const strategies = React.useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.strategy))).sort();
  }, [rows]);

  // agrégation PnL par date et par stratégie
  const byDateStrat = React.useMemo(() => {
    const m = new Map();
    rows.forEach((t) => {
      const d = t.date;
      const s = t.strategy;
      const v = convert(t.pnl, t.ccy || "USD", ccy);
      if (!m.has(d)) m.set(d, new Map());
      const mm = m.get(d);
      mm.set(s, (mm.get(s) || 0) + v);
    });
    return m;
  }, [rows, ccy, convert]);

  // toutes les dates
  const dates = React.useMemo(() => {
    return Array.from(byDateStrat.keys()).sort();
  }, [byDateStrat]);

  // série PnL quotidienne par stratégie
  const seriesByStrategy = React.useMemo(() => {
    const out = {};
    strategies.forEach((st) => {
      out[st] = dates.map((d) => {
        const mm = byDateStrat.get(d) || new Map();
        return mm.get(st) || 0;
      });
    });
    return out;
  }, [strategies, dates, byDateStrat]);

  // si moins de 2 stratégies -> pas de matrice
  if (strategies.length < 2) {
    return (
      <div className="card">
        <div className="block-head">
          <div className="block-title cap">Corrélation Entre Stratégies</div>
        </div>
        <div
          className="kpi-sub"
          style={{ opacity: 0.8, fontSize: 12, padding: "8px 0" }}
        >
          Pas assez de stratégies pour calculer une corrélation.
        </div>
      </div>
    );
  }

  // matrice corrélation
  const matrix = strategies.map((s1, i) =>
    strategies.map((s2, j) =>
      i === j ? 1 : corr(seriesByStrategy[s1] || [], seriesByStrategy[s2] || [])
    )
  );

  return (
    <div className="card">
      <div className="block-head">
        <div className="block-title cap">Corrélation Entre Stratégies</div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 8 }}>
        <table className="table">
          <thead>
            <tr>
              <th></th>
              {strategies.map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th>{strategies[i]}</th>
                {row.map((c, j) => (
                  <td key={j}>
                    <div
                      className="card halo-neutral"
                      style={{
                        padding: "8px 10px",
                        textAlign: "center",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className={`val ${verdictColor(c)}`}
                        style={{ border: "none" }}
                      >
                        {c.toFixed(2)}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

