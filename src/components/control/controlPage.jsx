import React from "react";
function EquityBlock({ rows, cashflows, initial, convert, ccy }) {
  // version simplifiée temporaire pour pas planter l'app
  const totalPnl = rows.reduce(
    (acc, t) => acc + convert(t.pnl, t.ccy || "USD", ccy),
    0
  );

  const equityNow = convert(initial, "USD", ccy) + totalPnl;

  return (
    <div className="card">
      <div className="block-title cap">Courbe d’Équité</div>
      <div
        style={{
          fontSize: 14,
          color: "var(--text)",
          lineHeight: 1.5,
        }}
      >
        <div>
          Équité actuelle&nbsp;:{" "}
          <span className="val val-main">
            {equityNow.toFixed(2)} {ccy}
          </span>
        </div>
        <div style={{ opacity: 0.8, fontSize: 12, marginTop: 6 }}>
          (version light sans graphique Recharts, juste pour que ça tourne)
        </div>
      </div>
    </div>
  );
}

// On a besoin de ces sous-composants/utilitaires qui existent déjà dans App.jsx.
// On les importe depuis App PLUS TARD, on va les déplacer proprement ensuite.
// Pour l’instant, on les redéclare ici en inline pour que ça marche tout de suite.

// ================= Helpers visuels simples =================

const styleNum = (v) => ({
  color: Number(v) < 0 ? "var(--pink, #ff5fa2)" : "var(--text, #c5ccd3)",
});

// ================= Composants KPI / Stats =================

// WinRateBlock
function WinRateBlock({ rows }) {
  const counts = React.useMemo(() => {
    let w = 0,
      l = 0;
    rows.forEach((t) => {
      if (t.pnl > 0) w++;
      else if (t.pnl < 0) l++;
    });
    const total = w + l;
    const wr = total ? (w / total) * 100 : 0;
    return { w, l, total, wr };
  }, [rows]);

  const donut = [
    { name: "Gagnants", value: counts.w },
    { name: "Perdants", value: counts.l },
  ];

  // version simplifiée (sans donut Recharts pour le moment, purement text)
  return (
    <div className="card">
      <div className="block-title cap">Taux de Réussite</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: "var(--white)" }}>
        {counts.wr.toFixed(1)}%
      </div>
      <div style={{ fontSize: 12, opacity: 0.8, color: "var(--text)" }}>
        sur {counts.total} trades
      </div>
    </div>
  );
}

// RatiosBlock
function RatiosBlock({ rows, convert, ccy }) {
  const mean = (a) =>
    a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const std = (a) => {
    if (!a.length) return 0;
    const m = mean(a);
    return Math.sqrt(mean(a.map((x) => (x - m) * (x - m))));
  };
  const downsideStd = (a) => {
    if (!a.length) return 0;
    const m = mean(a);
    const n = a.filter((x) => x < m);
    if (!n.length) return 0;
    return Math.sqrt(mean(n.map((x) => (x - m) * (x - m))));
  };
  const sum = (a) => a.reduce((s, x) => s + x, 0);

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

  const daily = byDate.map((r) => r.pnl);
  const avg = mean(daily),
    sd = std(daily),
    dsd = downsideStd(daily);

  const wins = rows
    .filter((t) => t.pnl > 0)
    .map((t) => convert(t.pnl, t.ccy || "USD", ccy));
  const loss = rows
    .filter((t) => t.pnl < 0)
    .map((t) => Math.abs(convert(t.pnl, t.ccy || "USD", ccy)));
  const p = rows.length ? wins.length / rows.length : 0,
    q = 1 - p;
  const avgW = wins.length ? mean(wins) : 0,
    avgL = loss.length ? mean(loss) : 0;
  const RR = avgL > 0 ? avgW / avgL : 0;
  const expectancy = rows.length ? sum(daily) / rows.length : 0;
  const sharpe = sd > 0 ? (avg / sd) * Math.sqrt(252) : 0;
  const sortino = dsd > 0 ? (avg / dsd) * Math.sqrt(252) : 0;
  const kelly = avgL > 0 ? p - q / (RR || 1) : 0;
  const edge = p * avgW - q * avgL;
  const ror =
    edge <= 0 ? 1 : Math.max(0, Math.pow(q / Math.max(p, 1e-6), 5)); // approx

  return (
    <div className="card">
      <div className="block-title cap">Ratios (Pro)</div>
      <div className="grid-3" style={{ gap: 12, fontSize: 13 }}>
        <div className="card tinted halo-neutral" style={{ borderRadius: 12 }}>
          <div className="kpi-title">Expectancy / trade</div>
          <div className="val" style={styleNum(expectancy)}>
            {expectancy.toFixed(2)}
          </div>
          <div className="kpi-title" style={{ marginTop: 8 }}>
            Kelly (indicatif)
          </div>
          <div className="val" style={styleNum(kelly)}>
            {kelly.toFixed(2)}
          </div>
        </div>

        <div className="card tinted halo-neutral" style={{ borderRadius: 12 }}>
          <div className="kpi-title">Sharpe (Ann.)</div>
          <div className="val" style={styleNum(sharpe)}>
            {sharpe.toFixed(2)}
          </div>
          <div className="kpi-title" style={{ marginTop: 8 }}>
            Sortino (Ann.)
          </div>
          <div className="val" style={styleNum(sortino)}>
            {sortino.toFixed(2)}
          </div>
        </div>

        <div className="card tinted halo-neutral" style={{ borderRadius: 12 }}>
          <div className="kpi-title">Risk / Reward</div>
          <div className="val" style={styleNum(RR)}>
            {RR.toFixed(2)}
          </div>
          <div className="kpi-title" style={{ marginTop: 8 }}>
            Risque de Ruine (≈)
          </div>
          <div className="val">{(ror * 100).toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
}

// Corrélation Stratégies
function CorrelationBlock({ rows, convert, ccy }) {
  const strats = React.useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.strategy))).sort();
  }, [rows]);

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

  const dates = React.useMemo(() => {
    return Array.from(byDateStrat.keys()).sort();
  }, [byDateStrat]);

  const series = React.useMemo(() => {
    const s = {};
    strats.forEach((st) => {
      s[st] = dates.map((d) => {
        const mm = byDateStrat.get(d) || new Map();
        return mm.get(st) || 0;
      });
    });
    return s;
  }, [strats, dates, byDateStrat]);

  const corr = (a, b) => {
    const n = Math.min(a.length, b.length);
    if (!n) return 0;
    const ax = a.slice(0, n);
    const bx = b.slice(0, n);
    const mean = (arr) =>
      arr.length ? arr.reduce((sum, x) => sum + x, 0) / arr.length : 0;
    const ma = mean(ax);
    const mb = mean(bx);
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
  };

  const matrix = React.useMemo(() => {
    return strats.map((s1, i) =>
      strats.map((s2, j) => (i === j ? 1 : corr(series[s1] || [], series[s2] || [])))
    );
  }, [strats, series]);

  if (strats.length < 2) {
    return (
      <div className="card">
        <div className="block-title cap">Corrélation Stratégies</div>
        <div
          style={{
            fontSize: 12,
            opacity: 0.8,
            color: "var(--text)",
            padding: "8px 0",
          }}
        >
          Pas assez de stratégies pour calculer une corrélation.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="block-title cap">Corrélation Stratégies</div>
      <div style={{ overflowX: "auto", marginTop: 8 }}>
        <table className="table">
          <thead>
            <tr>
              <th></th>
              {strats.map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th>{strats[i]}</th>
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
                      <div className="val" style={{ border: "none" }}>
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

// Mapping Stratégie × Broker
function MappingTable({ rows, convert, ccy }) {
  const map = new Map();
  rows.forEach((r) => {
    const k = `${r.strategy}||${r.broker}`;
    const v = convert(r.pnl, r.ccy || "USD", ccy);
    const o = map.get(k) || { pnl: 0, n: 0 };
    o.pnl += v;
    o.n += 1;
    map.set(k, o);
  });

  const items = Array.from(map.entries())
    .map(([k, v]) => {
      const [strategy, broker] = k.split("||");
      return {
        strategy,
        broker,
        pnl: v.pnl,
        n: v.n,
        expectancy: v.n ? v.pnl / v.n : 0,
      };
    })
    .sort(
      (a, b) =>
        a.strategy.localeCompare(b.strategy) ||
        a.broker.localeCompare(b.broker)
    );

  return (
    <div className="card">
      <div className="block-title cap">Mapping Stratégie × Broker</div>

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
          {items.map((r, i) => (
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
        </tbody>
      </table>
    </div>
  );
}

// Calendrier mensuel simplifié
function CalendarMonthly({ rows, convert, ccy, startEquity }) {
  const map = new Map();
  rows.forEach((t) => {
    const v = convert(t.pnl, t.ccy || "USD", ccy);
    const o = map.get(t.date) || { pnl: 0, n: 0 };
    o.pnl += v;
    o.n++;
    map.set(t.date, o);
  });

  const lastDateStr = rows.length
    ? rows[rows.length - 1].date
    : new Date().toISOString().slice(0, 10);
  const base = new Date(lastDateStr + "T12:00:00Z");
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();

  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const lastOfMonth = new Date(Date.UTC(year, month + 1, 0));

  const start = new Date(firstOfMonth);
  const startDow = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - startDow);

  const end = new Date(lastOfMonth);
  const endDow = (end.getUTCDay() + 6) % 7;
  end.setUTCDate(end.getUTCDate() + (6 - endDow));

  const days = [];
  let eq = startEquity,
    peak = eq;
  for (
    let d = new Date(start);
    d <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const date = d.toISOString().slice(0, 10);
    const isInMonth = d.getUTCMonth() === month;
    const dayData = map.get(date) || { pnl: 0, n: 0 };
    const prev = eq;
    eq += isInMonth ? dayData.pnl : 0;
    peak = Math.max(peak, eq);
    const ddAbs = Math.max(0, peak - eq);
    const retPct = prev > 0 ? (dayData.pnl / prev) * 100 : 0;

    days.push({
      date,
      inMonth: isInMonth,
      pnl: isInMonth ? dayData.pnl : null,
      n: isInMonth ? dayData.n : 0,
      retPct: isInMonth ? retPct : null,
      ddAbs: isInMonth ? ddAbs : null,
    });
  }

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="card">
      <div className="block-title cap">Calendrier Mensuel</div>

      <div className="month-grid">
        <div className="month-head">
          {weekDays.map((d) => (
            <div key={d} className="cap">
              {d}
            </div>
          ))}
        </div>

        {days.map((d) => (
          <div
            key={d.date}
            className="day-cell"
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 8,
              fontSize: 11,
              lineHeight: 1.4,
              color: "var(--text)",
              backgroundColor: d.inMonth
                ? "var(--panel)"
                : "var(--panel-2)",
            }}
          >
            <div
              className="day-top"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: d.inMonth ? "var(--white)" : "var(--text)",
                opacity: d.inMonth ? 1 : 0.5,
                marginBottom: 4,
              }}
            >
              <span>
                {d.date.slice(8, 10)}/{d.date.slice(5, 7)}
              </span>
              <span style={{ opacity: 0.7 }}>
                {d.n ? `${d.n} t.` : ""}
              </span>
            </div>

            {d.inMonth ? (
              <>
                <div className="day-metric">
                  <span className="cap" style={{ opacity: 0.7 }}>
                    PnL
                  </span>{" "}
                  <span className="val" style={styleNum(d.pnl)}>
                    {(d.pnl ?? 0).toFixed(2)}
                  </span>
                </div>

                <div className="day-metric">
                  <span className="cap" style={{ opacity: 0.7 }}>
                    Rentab.
                  </span>{" "}
                  <span className="val" style={styleNum(d.retPct)}>
                    {Number(d.retPct ?? 0).toFixed(2)}%
                  </span>
                </div>

                <div className="day-metric">
                  <span className="cap" style={{ opacity: 0.7 }}>
                    DD Abs
                  </span>{" "}
                  <span className="val">
                    {Number(d.ddAbs ?? 0).toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.5,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                —
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Activité
function ActivityBlocks({ rows }) {
  const hour = new Array(24).fill(0).map((_, h) => ({
    h,
    win: 0,
    loss: 0,
  }));
  const dow = new Array(7).fill(0).map((_, d) => ({
    d,
    win: 0,
    loss: 0,
  }));
  const mon = new Array(12).fill(0).map((_, m) => ({
    m,
    win: 0,
    loss: 0,
  }));
  rows.forEach((t) => {
    const rndH = (Math.random() * 24) | 0;
    const dt = new Date(t.date + "T12:00:00Z");
    const d = (dt.getUTCDay() + 6) % 7;
    const m = dt.getUTCMonth();
    if (t.pnl > 0) {
      hour[rndH].win++;
      dow[d].win++;
      mon[m].win++;
    } else if (t.pnl < 0) {
      hour[rndH].loss++;
      dow[d].loss++;
      mon[m].loss++;
    }
  });

  return (
    <div className="card">
      <div className="block-title cap">Activité</div>
      <div
        className="grid-3"
        style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr 1fr" }}
      >
        <div className="card tinted">
          <div className="kpi-title">Activité par Heure</div>
          <div style={{ fontSize: 12, opacity: 0.8, color: "var(--text)" }}>
            heures gagnantes / perdantes
          </div>
        </div>
        <div className="card tinted">
          <div className="kpi-title">
            Activité par Jour (Lundi…Dimanche)
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, color: "var(--text)" }}>
            jours les plus actifs
          </div>
        </div>
        <div className="card tinted">
          <div className="kpi-title">
            Activité par Mois (Janvier…Décembre)
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, color: "var(--text)" }}>
            saisonnalité
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// PAGE CENTRE DE CONTRÔLE
// =====================================================================

export default function ControlPage({
  t,
  subtitle,
  editSub,
  setEditSub,
  setSubtitle,

  // filtres / setters
  asset,
  setAsset,
  broker,
  setBroker,
  strategy,
  setStrategy,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  reset,

  // liste des options
  assets,
  brokers,
  strategies,

  // cashflows
  openFlow,
  setOpenFlow,
  openTiers,
  setOpenTiers,
  openRecap,
  setOpenRecap,
  openAbout,
  setOpenAbout,

  cashflowsAll,
  CAPITAL_INITIAL_USD,

  // computed data
  filtered,
  displayCcy,
  convert,
  fmt,
  tiersTotal,
  capitalInitialDisp,
  cashFlowTotal,
  pnlFiltered,
  capitalGlobal,
  returnPct,
  maxDDPct,
  maxDDAbs,
  noData,
}) {
  return (
    <div className="control-page">
      {/* Bandeau haut : Titre + sous-titre + actions principales */}
      <div className="card">
        <div className="block-head">
          <div>
            <h1 className="brand" style={{ fontSize: 28, margin: 0 }}>
              {t.brand}
            </h1>

            {!editSub ? (
              <p className="subtitle cap" style={{ marginTop: 6 }}>
                {subtitle}
                <button
                  className="edit-pencil"
                  onClick={() => setEditSub(true)}
                >
                  ✏️
                </button>
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 6,
                }}
              >
                <input
                  className="sel"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
                <button
                  className="btn sm"
                  onClick={() => setEditSub(false)}
                >
                  OK
                </button>
              </div>
            )}
          </div>

          <div
            className="block-tools"
            style={{ flexWrap: "wrap", justifyContent: "flex-end" }}
          >
            {/* Boutons / actions  */}
            <button className="btn" onClick={() => setOpenFlow(true)}>
              {t.actions?.Add_Flow || "Ajouter un Flux"}
            </button>

            <button className="btn" onClick={() => setOpenTiers(true)}>
              {t.actions?.Third_Capital || "Capital Tiers"}
            </button>

            <button className="btn ghost" onClick={() => setOpenRecap(true)}>
              {t.actions?.Recap || "Récap"}
            </button>

            <button className="btn ghost" onClick={reset}>
              {t.actions?.Reset || "Réinitialiser"}
            </button>

            <button className="btn ghost" onClick={() => setOpenAbout(true)}>
              {t.actions?.About || "À Propos"}
            </button>
          </div>
        </div>

        {/* Les modales inline restent gérées dans App.jsx pour l’instant.
           Ici on laisse juste l’emplacement logique. */}
      </div>

      {/* Filtres */}
      <div className="control-section">
        <div className="card">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 10,
            }}
          >
            <div>
              <div className="kpi-title cap">Actif</div>
              <select
                className="sel"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
              >
                <option>All</option>
                {assets.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="kpi-title cap">Broker</div>
              <select
                className="sel"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
              >
                <option>All</option>
                {brokers.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="kpi-title cap">Stratégie</div>
              <select
                className="sel"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              >
                <option>All</option>
                {strategies.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="kpi-title cap">Du</div>
              <input
                className="sel"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ fontFamily: "inherit", fontSize: 14 }}
              />
            </div>

            <div>
              <div className="kpi-title cap">Au</div>
              <input
                className="sel"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ fontFamily: "inherit", fontSize: 14 }}
              />
            </div>

            <div />
            <div />
          </div>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="control-section">
        <div className="block-head" style={{ marginBottom: 6 }}>
          <div className="block-title cap">Indicateurs Principaux</div>
        </div>

        <div className="kpi-grid">
          <div className="card halo-neutral">
            <div className="kpi-title cap">Capital Initial</div>
            <div className="val val-main">{fmt(capitalInitialDisp)}</div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Cashflow</div>
            <div
              className={`val ${cashFlowTotal < 0 ? "neg" : "pos"}`}
            >
              {fmt(cashFlowTotal)}
            </div>
          </div>

          <div className="card">
            <div className="kpi-title cap">PnL (Filtré)</div>
            <div
              className={`val ${pnlFiltered < 0 ? "neg" : "pos"}`}
            >
              {fmt(pnlFiltered)}
            </div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Capital Total</div>
            <div
              className={`val ${pnlFiltered < 0 ? "neg" : "pos"}`}
            >
              {fmt(capitalGlobal)}
            </div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Rentabilité</div>
            <div
              className={`val ${returnPct < 0 ? "neg" : "pos"}`}
            >
              {returnPct.toFixed(2)}%
            </div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Max DD %</div>
            <div className="val val-main">{maxDDPct.toFixed(2)}%</div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Max DD (Abs.)</div>
            <div className="val val-main">{fmt(maxDDAbs)}</div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Jours Actifs</div>
            <div className="val val-main">
              {new Set(filtered.map((t) => t.date)).size}
            </div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Capital Tiers</div>
            <div className="val val-main">{fmt(tiersTotal)}</div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Trades Total</div>
            <div className="val val-main">{filtered.length}</div>
          </div>
        </div>
      </div>

    {/* Grille principale */}
<div className="control-section control-grid">
  <div className="col-8">
    <EquityBlock
      rows={filtered}
      cashflows={cashflowsAll}
      initial={CAPITAL_INITIAL_USD}
      convert={convert}
      ccy={displayCcy}
    />
  </div>

  <div className="col-4">
    <div className="grid-2">
      <WinRateBlock rows={filtered} />
      <RatiosBlock
        rows={filtered}
        convert={convert}
        ccy={displayCcy}
      />
    </div>
  </div>
</div>

{/* Corrélation & Mapping */}
<div className="control-section control-grid">
  <div className="col-6">
    <CorrelationBlock
      rows={filtered}
      convert={convert}
      ccy={displayCcy}
    />
  </div>

  <div className="col-6">
    <MappingTable
      rows={filtered}
      convert={convert}
      ccy={displayCcy}
    />
  </div>
</div>

{/* Calendrier mensuel */}
<div className="control-section">
  <CalendarMonthly
    rows={filtered}
    convert={convert}
    ccy={displayCcy}
    startEquity={convert(CAPITAL_INITIAL_USD, "USD", displayCcy)}
  />
</div>

{/* Activité */}
<div className="control-section">
  <ActivityBlocks rows={filtered} />
</div>
      {/* Message si pas de données */}
      {noData && (
        <div
          className="card halo-warn"
          style={{ marginTop: 20, textAlign: "center" }}
        >
          <div className="kpi-title cap">Aucune Donnée</div>
          <div
            style={{
              fontSize: 13,
              opacity: 0.8,
              marginTop: 6,
              color: "var(--text)",
            }}
          >
            Ajuste les filtres ou importe un CSV pour voir les stats.
          </div>
        </div>
      )}
    </div>
  );
}

