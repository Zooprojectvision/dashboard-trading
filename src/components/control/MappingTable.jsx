// src/components/control/MappingTable.jsx
import React from "react";

/*
  Props:
  - rows: trades filtrés
  - convert: fn convert(val, fromCcy, toCcy)
  - ccy: devise actuelle
*/
export default function MappingTable({ rows, convert, ccy }) {
  const data = React.useMemo(() => {
    // agrège par couple stratégie+broker
    const map = new Map();
    rows.forEach((r) => {
      const key = `${r.strategy}||${r.broker}`;
      const pnlConv = convert(r.pnl, r.ccy || "USD", ccy);
      const prev = map.get(key) || { pnl: 0, n: 0 };
      prev.pnl += pnlConv;
      prev.n += 1;
      map.set(key, prev);
    });

    // transforme en tableau
    const items = Array.from(map.entries()).map(([k, v]) => {
      const [strategy, broker] = k.split("||");
      return {
        strategy,
        broker,
        pnl: v.pnl,
        n: v.n,
        expectancy: v.n ? v.pnl / v.n : 0,
      };
    });

    // tri par stratégie puis broker
    items.sort(
      (a, b) =>
        a.strategy.localeCompare(b.strategy) ||
        a.broker.localeCompare(b.broker)
    );
    return items;
  }, [rows, convert, ccy]);

  const styleNum = (v) => ({
    color: Number(v) < 0 ? "var(--pink)" : "var(--text)",
  });

  return (
    <div className="card">
      <div className="block-head">
        <div className="block-title cap">Mapping Stratégie × Broker</div>
      </div>

      <table className="table" style={{ marginTop: 6 }}>
        <thead>
          <tr>
            <th>Stratégie</th>
            <th>Broker</th>
            <th style={{ textAlign: "right" }}>PnL</th>
            <th style={{ textAlign: "right" }}>Trades</th>
            <th style={{ textAlign: "right" }}>Expectancy</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <td>{r.strategy}</td>
              <td>{r.broker}</td>
              <td style={{ textAlign: "right" }}>
                <span className="val" style={styleNum(r.pnl)}>
                  {r.pnl.toFixed(2)}
                </span>
              </td>
              <td style={{ textAlign: "right" }}>{r.n}</td>
              <td style={{ textAlign: "right" }}>
                <span className="val" style={styleNum(r.expectancy)}>
                  {r.expectancy.toFixed(2)}
                </span>
              </td>
            </tr>
          ))}

          {!data.length && (
            <tr>
              <td
                colSpan="5"
                style={{ textAlign: "center", opacity: 0.8, padding: "10px 0" }}
              >
                Aucun trade
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

