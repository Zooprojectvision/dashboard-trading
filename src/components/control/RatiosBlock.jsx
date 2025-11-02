// src/components/control/RatiosBlock.jsx
import React from "react";

/*
  Props:
  - rows: trades filtrés
  - convert: fonction convert(val, fromCcy, toCcy)
  - ccy: devise actuelle (ex: "USD")

  Affiche:
  - Expectancy par trade
  - Sharpe / Sortino annualisés
  - Risk/Reward, Kelly indicatif, Risque de ruine
*/

function mean(a) {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}
function std(a) {
  if (!a.length) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) * (x - m))));
}
function downsideStd(a) {
  if (!a.length) return 0;
  const m = mean(a);
  const n = a.filter((x) => x < m);
  if (!n.length) return 0;
  return Math.sqrt(mean(n.map((x) => (x - m) * (x - m))));
}
function sum(a) {
  return a.reduce((s, x) => s + x, 0);
}

const styleNum = (v) => ({
  color: Number(v) < 0 ? "var(--pink)" : "var(--text)",
});

export default function RatiosBlock({ rows, convert, ccy }) {
  // PnL total par jour
  const byDate = React.useMemo(() => {
    const m = new Map();
    rows.forEach((t) => {
      const v = convert(t.pnl, t.ccy || "USD", ccy);
      m.set(t.date, (m.get(t.date) || 0) + v);
    });
    return Array.from(m, ([date, pnl]) => ({ date, pnl })).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [rows, ccy, convert]);

  const dailyPnl = byDate.map((r) => r.pnl);

  const avg = mean(dailyPnl);
  const sd = std(dailyPnl);
  const dsd = downsideStd(dailyPnl);

  // trades gagnants / perdants
  const wins = rows
    .filter((t) => t.pnl > 0)
    .map((t) => convert(t.pnl, t.ccy || "USD", ccy));
  const loss = rows
    .filter((t) => t.pnl < 0)
    .map((t) => Math.abs(convert(t.pnl, t.ccy || "USD", ccy)));

  const p = rows.length ? wins.length / rows.length : 0;
  const q = 1 - p;
  const avgW = wins.length ? mean(wins) : 0;
  const avgL = loss.length ? mean(loss) : 0;

  // Risk/Reward ratio moyen
  const RR = avgL > 0 ? avgW / avgL : 0;

  // expectancy = PnL moyen par trade
  const expectancy = rows.length ? sum(dailyPnl) / rows.length : 0;

  // sharpe & sortino annualisés (252 jours de trading)
  const sharpe = sd > 0 ? (avg / sd) * Math.sqrt(252) : 0;
  const sortino = dsd > 0 ? (avg / dsd) * Math.sqrt(252) : 0;

  // Kelly indicatif
  const kelly = avgL > 0 ? p - q / (RR || 1) : 0;

  // Edge & risque de ruine approx.
  const edge = p * avgW - q * avgL;
  const ror =
    edge <= 0 ? 1 : Math.max(0, Math.pow(q / Math.max(p, 1e-6), 5)); // entre 0 et 1

  // couleur du halo global
  const verdict = (s) =>
    s >= 1 ? "halo-good" : s >= 0.4 ? "halo-warn" : "halo-bad";

  const V = ({ v, suffix = "" }) => (
    <span className="val" style={styleNum(v)}>
      {Number.isFinite(v) ? v.toFixed(2) + suffix : "—"}
    </span>
  );

  return (
    <div className={`card ${verdict(sharpe)}`}>
      <div className="block-head">
        <div className="block-title cap">Ratios (Pro)</div>
      </div>

      <div className="grid-3">
        {/* Bloc 1 */}
        <div className="card halo-neutral tinted">
          <div className="kpi-title">Expectancy par Trade</div>
          <V v={expectancy} />
        </div>

        {/* Bloc 2 */}
        <div className="card halo-neutral tinted">
          <div className="kpi-title">Sharpe (Ann.)</div>
          <V v={sharpe} />

          <div className="kpi-title" style={{ marginTop: 8 }}>
            Sortino (Ann.)
          </div>
          <V v={sortino} />
        </div>

        {/* Bloc 3 */}
        <div className="card halo-neutral tinted">
          <div className="kpi-title">Risk / Reward</div>
          <V v={RR} />

          <div className="kpi-title" style={{ marginTop: 8 }}>
            Kelly (Indicatif)
          </div>
          <V v={kelly} />

          <div className="kpi-title" style={{ marginTop: 8 }}>
            Risque de Ruine (≈)
          </div>
          <V v={ror * 100} suffix="%" />
        </div>
      </div>
    </div>
  );
}

