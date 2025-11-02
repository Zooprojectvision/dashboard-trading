import React from "react";

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Scatter,
} from "recharts";

const styleNum = (v) => ({
  color: Number(v) < 0 ? "var(--pink)" : "var(--text)",
});

/* ===========================
   Utils math / couleurs
   =========================== */

const C = {
  axis: "#c9cdd1",
  white: "#ffffff",
  green: "#20e3d6",
  pink: "#ff5fa2",
  orange: "#ffb347",
  blue: "#6aa9ff",
};

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
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

const styleNum = (v) => ({
  color: Number(v) < 0 ? "var(--pink, #ff5fa2)" : "var(--text, #c5ccd3)",
});

/* ===========================
   Demo trades (90 jours)
   =========================== */
function genDemoTrades() {
  const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"];
  const BROKERS = ["Darwinex", "Axi Select"];
  const STRATS = ["Breakout", "MeanRevert", "Momentum"];

  const rows = [];
  const today = new Date();
  for (let i = 90; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);

    for (let k = 0; k < 5; k++) {
      const asset = ASSETS[(i + k) % ASSETS.length];
      const broker = BROKERS[(i + k * 2) % BROKERS.length];
      const strategy = STRATS[(i + k * 3) % STRATS.length];

      let pnl = (Math.random() - 0.5) * (Math.random() < 0.15 ? 2600 : 900);
      pnl = Number(pnl.toFixed(2));

      const mfe = Number(
        (Math.abs(pnl) * (0.8 + Math.random() * 0.8)).toFixed(2)
      );
      const mae = Number(
        (Math.abs(pnl) * (0.6 + Math.random() * 0.8)).toFixed(2)
      );

      rows.push({
        date,
        asset,
        broker,
        strategy,
        pnl,
        ccy: "USD",
        mfe,
        mae,
      });
    }
  }

  return rows;
}

/* ===========================
   CSV parsing (import MT5)
   =========================== */
function parseCSV(text) {
  const lines = String(text || "")
    .trim()
    .split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines
    .shift()
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  const rows = [];
  for (const line of lines) {
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const obj = {};
    headers.forEach(
      (h, i) => (obj[h] = (cols[i] || "").replace(/^"|"$/g, ""))
    );
    rows.push(obj);
  }
  return rows;
}

function mapMT5Rows(rows) {
  return rows
    .map((r) => {
      const date = (
        r["Time"] ||
        r["Open time"] ||
        r["Open Time"] ||
        r["Date"] ||
        ""
      ).slice(0, 10);
      const asset =
        r["Symbol"] ||
        r["Instrument"] ||
        r["Symbol name"] ||
        "UNKNOWN";
      const broker = r["Broker"] || "Unknown";
      const strategy = r["Strategy"] || "Unknown";

      const pnl = Number(
        r["Profit"] || r["PnL"] || r["PL"] || r["Net P/L"] || 0
      );

      const mfe = Number(
        r["MFE"] ||
          r["MFE Profit"] ||
          r["Max Favorable Excursion"] ||
          0
      );
      const mae = Number(
        r["MAE"] ||
          r["MAE Profit"] ||
          r["Max Adverse Excursion"] ||
          0
      );

      return {
        date,
        asset,
        broker,
        strategy,
        pnl: Number((pnl || 0).toFixed(2)),
        ccy: "USD",
        mfe: Number((Math.abs(mfe) || 0).toFixed(2)),
        mae: Number((Math.abs(mae) || 0).toFixed(2)),
      };
    })
    .filter((r) => r.date);
}

/* ===========================
   Mini composants visuels
   =========================== */

// Carte cliquable page d'accueil
function HubCard({ title, subtitle, goto, onNav }) {
  return (
    <button
      onClick={() => onNav(goto)}
      style={{
        width: "100%",
        textAlign: "left",
        border: "1px solid #2a2f3a",
        background: "#111318",
        borderRadius: 16,
        padding: 16,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#6aa9ff",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.4,
          color: "#c5ccd3",
          opacity: 0.9,
        }}
      >
        {subtitle}
      </div>
    </button>
  );
}

// Footer global
function LocalFooter() {
  return (
    <div
      style={{
        textAlign: "center",
        color: "#c5ccd3",
        opacity: 0.6,
        fontSize: 12,
        marginTop: 40,
        paddingBottom: 40,
      }}
    >
      Designed &amp; Built by ZooProjectVision V5.1.1 @{" "}
      {new Date().getFullYear()}
    </div>
  );
}

// Bandeau interne des pages (bouton ← Accueil)
function InternalHeader({ view, goHome }) {
  return (
    <div
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #2a2f3a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#0a0b0f",
      }}
    >
      <button
        onClick={goHome}
        style={{
          background: "transparent",
          border: "1px solid #2a2f3a",
          color: "#c5ccd3",
          fontSize: 13,
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        ← Accueil
      </button>

      <div
        style={{
          fontSize: 12,
          color: "#c5ccd3",
          opacity: 0.8,
        }}
      >
        {view === "control"
          ? "Centre de contrôle"
          : view === "compta"
          ? "Comptabilité entreprise"
          : "Gestion du risque"}
      </div>
    </div>
  );
}

/* ===========================
   Blocs analytics (ControlPage)
   =========================== */

// Win rate donut simplifiée (texte-only fallback: pas de Recharts ici)
function WinRateBlock({ rows }) {
  let w = 0,
    l = 0;
  rows.forEach((t) => {
    if (t.pnl > 0) w++;
    else if (t.pnl < 0) l++;
  });
  const total = w + l;
  const wr = total ? (w / total) * 100 : 0;

  return (
    <div
      style={{
        background: "#111318",
        border: "1px solid #2a2f3a",
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: "#c5ccd3",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#ffffff",
          marginBottom: 8,
        }}
      >
        Taux de Réussite
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: "#20e3d6" }}>
        {wr.toFixed(1)}%
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
        {total} trades analysés ({w} gagnants / {l} perdants)
      </div>
    </div>
  );
}

// Ratios de performance (Sharpe etc.) en texte
function RatiosBlock({ rows, convert, ccy }) {
  // daily pnl regroupé par date
  const byDateMap = new Map();
  rows.forEach((t) => {
    const val = convert(t.pnl, t.ccy || "USD", ccy);
    byDateMap.set(t.date, (byDateMap.get(t.date) || 0) + val);
  });
  const daily = Array.from(byDateMap.values());

  const avg = mean(daily);
  const sd = std(daily);
  const dsd = downsideStd(daily);

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
  const RR = avgL > 0 ? avgW / avgL : 0;
  const expectancy = rows.length ? sum(daily) / rows.length : 0;
  const sharpe = sd > 0 ? (avg / sd) * Math.sqrt(252) : 0;
  const sortino = dsd > 0 ? (avg / dsd) * Math.sqrt(252) : 0;
  const kelly = avgL > 0 ? p - q / (RR || 1) : 0;
  const edge = p * avgW - q * avgL;

  function LineItem({ label, value, suffix = "" }) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 6,
        }}
      >
        <span style={{ opacity: 0.8 }}>{label}</span>
        <span style={styleNum(value)}>{Number(value).toFixed(2) + suffix}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#111318",
        border: "1px solid #2a2f3a",
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: "#c5ccd3",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#ffffff",
          marginBottom: 8,
        }}
      >
        Ratios (Pro)
      </div>

      <LineItem label="Expectancy / trade" value={expectancy} />
      <LineItem label="Sharpe (ann.)" value={sharpe} />
      <LineItem label="Sortino (ann.)" value={sortino} />
      <LineItem label="Risk / Reward" value={RR} />
      <LineItem label="Kelly (indicatif)" value={kelly} />
      <LineItem label="Edge (p*W - q*L)" value={edge} />
    </div>
  );
}

// Corrélation stratégies (table simple)
function CorrelationBlock({ rows, convert, ccy }) {
  const strats = Array.from(new Set(rows.map((r) => r.strategy))).sort();

  // daily pnl par stratégie
  const byDateStrat = new Map();
  rows.forEach((t) => {
    const d = t.date;
    const s = t.strategy;
    const v = convert(t.pnl, t.ccy || "USD", ccy);
    if (!byDateStrat.has(d)) byDateStrat.set(d, new Map());
    const mm = byDateStrat.get(d);
    mm.set(s, (mm.get(s) || 0) + v);
  });

  const dates = Array.from(byDateStrat.keys()).sort();

  // séries cumulées par strat jour par jour
  const series = {};
  strats.forEach((s) => {
    series[s] = [];
  });

  dates.forEach((date) => {
    const mm = byDateStrat.get(date);
    strats.forEach((s) => {
      series[s].push(mm.get(s) || 0);
    });
  });

  const corr = (a, b) => {
    const n = Math.min(a.length, b.length);
    if (!n) return 0;
    const ax = a.slice(0, n);
    const bx = b.slice(0, n);
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

  const matrix = strats.map((s1, i) =>
    strats.map((s2, j) => (i === j ? 1 : corr(series[s1] || [], series[s2] || [])))
  );

  return (
    <div
      style={{
        background: "#111318",
        border: "1px solid #2a2f3a",
        borderRadius: 16,
        padding: 16,
        color: "#c5ccd3",
        fontSize: 13,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#ffffff",
          marginBottom: 12,
        }}
      >
        Corrélation Entre Stratégies
      </div>

      {strats.length < 2 ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Pas assez de stratégies pour calculer une corrélation.
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 6px" }}></th>
              {strats.map((s) => (
                <th
                  key={s}
                  style={{
                    textAlign: "center",
                    padding: "4px 6px",
                    color: "#c5ccd3",
                    fontWeight: 500,
                  }}
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: "4px 6px",
                    color: "#ffffff",
                    fontWeight: 500,
                  }}
                >
                  {strats[i]}
                </td>
                {row.map((c, j) => (
                  <td
                    key={j}
                    style={{
                      textAlign: "center",
                      padding: "4px 6px",
                      border: "1px solid #2a2f3a",
                      borderRadius: 8,
                      color:
                        Math.abs(c) <= 0.3
                          ? "#20e3d6"
                          : Math.abs(c) <= 0.6
                          ? "#ffb347"
                          : "#ff5fa2",
                    }}
                  >
                    {c.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Mapping stratégie x broker
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
    <div
      style={{
        background: "#111318",
        border: "1px solid #2a2f3a",
        borderRadius: 16,
        padding: 16,
        color: "#c5ccd3",
        fontSize: 13,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#ffffff",
          marginBottom: 12,
        }}
      >
        Mapping Stratégie × Broker
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
        }}
      >
        <thead>
          <tr
            style={{
              color: "#c5ccd3",
              fontWeight: 500,
              textAlign: "left",
            }}
          >
            <th style={{ padding: "4px 6px" }}>Stratégie</th>
            <th style={{ padding: "4px 6px" }}>Broker</th>
            <th style={{ padding: "4px 6px", textAlign: "right" }}>PnL</th>
            <th style={{ padding: "4px 6px", textAlign: "right" }}>Trades</th>
            <th style={{ padding: "4px 6px", textAlign: "right" }}>
              Expectancy
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: "4px 6px" }}>{r.strategy}</td>
              <td style={{ padding: "4px 6px" }}>{r.broker}</td>
              <td style={{ padding: "4px 6px", textAlign: "right" }}>
                <span style={styleNum(r.pnl)}>{r.pnl.toFixed(2)}</span>
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right" }}>{r.n}</td>
              <td style={{ padding: "4px 6px", textAlign: "right" }}>
                <span style={styleNum(r.expectancy)}>
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

// Calendrier mensuel (texte-only résumé)
function CalendarMonthly({ rows, convert, ccy, startEquity }) {
  // Agrège PnL par jour
  const dailyMap = new Map();
  rows.forEach((t) => {
    const v = convert(t.pnl, t.ccy || "USD", ccy);
    const o = dailyMap.get(t.date) || { pnl: 0, n: 0 };
    o.pnl += v;
    o.n += 1;
    dailyMap.set(t.date, o);
  });

  // On prend le dernier jour filtré pour choisir le mois affiché
  const lastDateStr = rows.length
    ? rows[rows.length - 1].date
    : new Date().toISOString().slice(0, 10);

  const base = new Date(lastDateStr + "T12:00:00Z");
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth(); // 0..11

  // construit résumé du mois
  let eq = startEquity;
  let peak = eq;
  let daysData = [];

  // on regarde chaque trade day du mois en question :
  Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, info]) => {
      const d = new Date(date + "T12:00:00Z");
      if (d.getUTCFullYear() === year && d.getUTCMonth() === month) {
        const prevEq = eq;
        eq += info.pnl;
        peak = Math.max(peak, eq);
        const ddAbs = Math.max(0, peak - eq);
        const retPct = prevEq > 0 ? (info.pnl / prevEq) * 100 : 0;

        daysData.push({
          date,
          pnl: info.pnl,
          trades: info.n,
          retPct,
          ddAbs,
        });
      }
    });

  const totalMonth = daysData.reduce((acc, d) => acc + d.pnl, 0);
  const worstDD = daysData.reduce((m, d) => Math.max(m, d.ddAbs), 0);

  return (
    <div
      style={{
        background: "#111318",
        border: "1px solid #2a2f3a",
        borderRadius: 16,
        padding: 16,
        fontSize: 13,
        color: "#c5ccd3",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#ffffff",
          marginBottom: 8,
        }}
      >
        Calendrier Mensuel (résumé)
      </div>

      {daysData.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Pas de trades ce mois.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.4,
              marginBottom: 12,
              opacity: 0.8,
            }}
          >
            Mois: {String(month + 1).padStart(2, "0")}/{year} •{" "}
            Jours tradés: {daysData.length}
            <br />
            PnL total mois:{" "}
            <span style={styleNum(totalMonth)}>
              {totalMonth.toFixed(2)} {ccy}
            </span>
            <br />
            Max Drawdown absolu observé: {worstDD.toFixed(2)} {ccy}
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
            }}
          >
            <thead>
              <tr
                style={{
                  color: "#c5ccd3",
                  fontWeight: 500,
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "4px 6px" }}>Date</th>
                <th style={{ padding: "4px 6px", textAlign: "right" }}>PnL</th>
                <th style={{ padding: "4px 6px", textAlign: "right" }}>
                  Trades
                </th>
                <th style={{ padding: "4px 6px", textAlign: "right" }}>
                  Rentab.%
                </th>
                <th style={{ padding: "4px 6px", textAlign: "right" }}>
                  DD Abs
                </th>
              </tr>
            </thead>
            <tbody>
              {daysData.map((d, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px 6px" }}>{d.date}</td>
                  <td style={{ padding: "4px 6px", textAlign: "right" }}>
                    <span style={styleNum(d.pnl)}>{d.pnl.toFixed(2)}</span>
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right" }}>
                    {d.trades}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right" }}>
                    <span style={styleNum(d.retPct)}>
                      {d.retPct.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right" }}>
                    {d.ddAbs.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// Activité (résumé texte)
function ActivityBlocks({ rows }) {
  const totalTrades = rows.length;
  const wins = rows.filter((t) => t.pnl > 0).length;
  const losses = rows.filter((t) => t.pnl < 0).length;

  // On fait une mini stat "par mois"
  const byMonth = new Map();
  rows.forEach((t) => {
    const m = t.date.slice(0, 7); // "YYYY-MM"
    const o = byMonth.get(m) || { pnl: 0, n: 0 };
    o.pnl += t.pnl;
    o.n += 1;
    byMonth.set(m, o);
  });

  const monthRows = Array.from(byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, o]) => ({
      month,
      trades: o.n,
      pnl: o.pnl,
    }));

  return (
    <div
      style={{
        background: "#111318",
        border: "1px solid #2a2f3a",
        borderRadius: 16,
        padding: 16,
        fontSize: 13,
        color: "#c5ccd3",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#ffffff",
          marginBottom: 8,
        }}
      >
        Activité
      </div>

      <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.8 }}>
        <div>Total trades: {totalTrades}</div>
        <div>
          Gagnants / Perdants: {wins} / {losses}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          lineHeight: 1.4,
        }}
      >
        <div
          style={{
            fontWeight: 500,
            color: "#ffffff",
            marginBottom: 4,
          }}
        >
          Par mois:
        </div>
        {monthRows.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Aucune donnée mensuelle.</div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
            }}
          >
            <thead>
              <tr
                style={{
                  color: "#c5ccd3",
                  fontWeight: 500,
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "4px 6px" }}>Mois</th>
                <th style={{ padding: "4px 6px", textAlign: "right" }}>
                  Trades
                </th>
                <th style={{ padding: "4px 6px", textAlign: "right" }}>PnL</th>
              </tr>
            </thead>
            <tbody>
              {monthRows.map((m, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px 6px" }}>{m.month}</td>
                  <td style={{ padding: "4px 6px", textAlign: "right" }}>
                    {m.trades}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right" }}>
                    <span style={styleNum(m.pnl)}>
                      {m.pnl.toFixed(2)} USD
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ===========================
   PAGE CONTROL (full dashboard)
   =========================== */

function ControlPage({
  t,
  lang,
  setLang,
  LOCALES,
  displayCcy,
  setDisplayCcy,
  convert,
  fmt,
  initialCapitalUSD,
  tradesAll,
  flows,
  setFlows,
  tiers,
  setTiers,
}) {
  // --- filtres locaux
  const [asset, setAsset] = React.useState("All");
  const [broker, setBroker] = React.useState("All");
  const [strategy, setStrategy] = React.useState("All");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const resetFilters = () => {
    setAsset("All");
    setBroker("All");
    setStrategy("All");
    setDateFrom("");
    setDateTo("");
  };

  const assets = React.useMemo(
    () => Array.from(new Set(tradesAll.map((t) => t.asset))),
    [tradesAll]
  );
  const brokers = React.useMemo(
    () => Array.from(new Set(tradesAll.map((t) => t.broker))),
    [tradesAll]
  );
  const strategies = React.useMemo(
    () => Array.from(new Set(tradesAll.map((t) => t.strategy))),
    [tradesAll]
  );

  const filtered = React.useMemo(
    () =>
      tradesAll.filter((t) => {
        if (asset !== "All" && t.asset !== asset) return false;
        if (broker !== "All" && t.broker !== broker) return false;
        if (strategy !== "All" && t.strategy !== strategy) return false;
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        return true;
      }),
    [tradesAll, asset, broker, strategy, dateFrom, dateTo]
  );

  // cashflows
  const [openFlowForm, setOpenFlowForm] = React.useState(false);
  const [flowDraft, setFlowDraft] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    type: "deposit",
    amount: "",
    ccy: displayCcy,
    note: "",
  });

  const addFlow = (e) => {
    e?.preventDefault?.();
    const amtNum = Number(flowDraft.amount);
    if (
      !flowDraft.date ||
      !flowDraft.type ||
      !Number.isFinite(amtNum)
    ) {
      alert("date/type/montant requis");
      return;
    }
    const newRow = {
      date: flowDraft.date,
      type: flowDraft.type,
      amount: amtNum,
      ccy: flowDraft.ccy,
      note: flowDraft.note,
    };
    setFlows((p) => p.concat([newRow]));
    setOpenFlowForm(false);
    setFlowDraft({
      date: new Date().toISOString().slice(0, 10),
      type: "deposit",
      amount: "",
      ccy: displayCcy,
      note: "",
    });
  };

  // capital tiers
  const [openTierForm, setOpenTierForm] = React.useState(false);
  const [tierDraft, setTierDraft] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    source: "Prop firm",
    amount: "",
    ccy: displayCcy,
    note: "",
  });

  const addTier = (e) => {
    e?.preventDefault?.();
    const amtNum = Number(tierDraft.amount);
    if (
      !tierDraft.date ||
      !tierDraft.source ||
      !Number.isFinite(amtNum)
    ) {
      alert("date/source/montant requis");
      return;
    }
    const newRow = {
      date: tierDraft.date,
      source: tierDraft.source,
      amount: amtNum,
      ccy: tierDraft.ccy,
      note: tierDraft.note,
    };
    setTiers((p) => p.concat([newRow]));
    setOpenTierForm(false);
  };

  // recap flows
  const cashflowsAll = flows;
  const [openRecap, setOpenRecap] = React.useState(false);

  // about
  const [openAbout, setOpenAbout] = React.useState(false);

  // Sous-titre éditable
  const [subtitle, setSubtitle] = React.useState(() => {
    try {
      return (
        localStorage.getItem("zpv_subtitle") ||
        "Tableau de bord multi-actifs, multi-brokers, multi-stratégies."
      );
    } catch {
      return "Tableau de bord multi-actifs, multi-brokers, multi-stratégies.";
    }
  });
  const [editSub, setEditSub] = React.useState(false);
  React.useEffect(() => {
    try {
      if (!editSub) {
        localStorage.setItem("zpv_subtitle", subtitle);
      }
    } catch {}
  }, [subtitle, editSub]);

  // KPI calculs
  const displayCcyMemo = displayCcy;
  const cashflowsInRange = React.useMemo(
    () =>
      cashflowsAll.filter(
        (c) =>
          (!dateFrom || c.date >= dateFrom) &&
          (!dateTo || c.date <= dateTo)
      ),
    [cashflowsAll, dateFrom, dateTo]
  );

  const capitalInitialDisp = React.useMemo(
    () => convert(initialCapitalUSD, "USD", displayCcyMemo),
    [initialCapitalUSD, displayCcyMemo, convert]
  );

  const cashFlowTotal = React.useMemo(
    () =>
      cashflowsInRange.reduce(
        (acc, c) =>
          acc + convert(c.amount, c.ccy || "USD", displayCcyMemo),
        0
      ),
    [cashflowsInRange, convert, displayCcyMemo]
  );

  const pnlFiltered = React.useMemo(
    () =>
      filtered.reduce(
        (acc, t) => acc + convert(t.pnl, t.ccy || "USD", displayCcyMemo),
        0
      ),
    [filtered, convert, displayCcyMemo]
  );

  const capitalBase = capitalInitialDisp + cashFlowTotal;
  const capitalGlobal = capitalBase + pnlFiltered;

  const returnPct = capitalBase > 0 ? (pnlFiltered / capitalBase) * 100 : 0;

  // max drawdown (simple)
  const byDate = React.useMemo(() => {
    const m = new Map();
    filtered.forEach((t) => {
      const v = convert(t.pnl, t.ccy || "USD", displayCcyMemo);
      m.set(t.date, (m.get(t.date) || 0) + v);
    });
    return [...m.entries()]
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered, convert, displayCcyMemo]);

  let eq = capitalInitialDisp;
  let peak = eq;
  let maxDrop = 0;
  byDate.forEach((p) => {
    eq += p.pnl;
    peak = Math.max(peak, eq);
    maxDrop = Math.max(maxDrop, peak - eq);
  });
  const maxDDAbs = maxDrop;
  const maxDDPct = peak > 0 ? (maxDrop / peak) * 100 : 0;

  // capital tiers total
  const tiersTotal = React.useMemo(
    () =>
      tiers.reduce(
        (s, r) =>
          s +
          convert(
            Number(r.amount) || 0,
            r.ccy || "USD",
            displayCcyMemo
          ),
        0
      ),
    [tiers, convert, displayCcyMemo]
  );

  const noData = filtered.length === 0;

  // === UI composants internes à la page Control ===

  // barre header de la section "Dashboard / actions"
  function DashboardHeader() {
    return (
      <div
        style={{
          background: "#111318",
          border: "1px solid #2a2f3a",
          borderRadius: 16,
          padding: 16,
          color: "#c5ccd3",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Gauche: titre + sous-titre éditable */}
          <div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.2,
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              ZooProjectVision
            </div>

            {!editSub ? (
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.4,
                  opacity: 0.8,
                  marginTop: 6,
                  color: "#c5ccd3",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span>{subtitle}</span>
                <button
                  onClick={() => setEditSub(true)}
                  style={{
                    cursor: "pointer",
                    background: "transparent",
                    border: "1px solid #2a2f3a",
                    color: "#c5ccd3",
                    fontSize: 12,
                    borderRadius: 6,
                    padding: "4px 8px",
                  }}
                >
                  ✏️
                </button>
              </div>
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
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  style={{
                    background: "#0f1115",
                    border: "1px solid #2a2f3a",
                    borderRadius: 8,
                    color: "#c5ccd3",
                    fontSize: 13,
                    padding: "6px 8px",
                    minWidth: 260,
                  }}
                />
                <button
                  onClick={() => setEditSub(false)}
                  style={{
                    background: "#1a1e2a",
                    border: "1px solid #2a2f3a",
                    borderRadius: 8,
                    color: "#c5ccd3",
                    fontSize: 12,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  OK
                </button>
              </div>
            )}
          </div>

          {/* Droite: actions */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            {/* Import CSV trades */}
            <label
              style={{
                background: "#1a1e2a",
                border: "1px solid #2a2f3a",
                borderRadius: 8,
                color: "#c5ccd3",
                fontSize: 12,
                padding: "6px 10px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              Importer CSV
              <input
                type="file"
                accept=".csv"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const fr = new FileReader();
                  fr.onload = () => {
                    const rows = parseCSV(String(fr.result));
                    const mapped = mapMT5Rows(rows);
                    if (!mapped.length) {
                      alert("CSV non reconnu. (Time/Symbol/Profit requis)");
                      return;
                    }
                    // NOTE: pas de "userTrades" global ici,
                    // pour version simple on n'injecte pas encore.
                    alert(
                      `Import CSV OK (${mapped.length} lignes mappées). Dans la version finale on les fusionnera aux trades.`
                    );
                  };
                  fr.readAsText(f);
                }}
              />
            </label>

            {/* Ajouter Flux */}
            <button
              onClick={() => setOpenFlowForm(true)}
              style={ghostBtn(false)}
            >
              Ajouter Flux
            </button>

            {/* Capital Tiers */}
            <button
              onClick={() => setOpenTierForm(true)}
              style={ghostBtn(false)}
            >
              Capital Tiers
            </button>

            {/* Récap flux */}
            <button
              onClick={() => setOpenRecap(true)}
              style={ghostBtn(true)}
            >
              Récap
            </button>

            {/* Reset filtres */}
            <button onClick={resetFilters} style={ghostBtn(true)}>
              Reset
            </button>

            {/* À propos */}
            <button
              onClick={() => setOpenAbout(true)}
              style={ghostBtn(true)}
            >
              À Propos
            </button>

            {/* Devise */}
            <div
              style={{
                fontSize: 12,
                color: "#c5ccd3",
                opacity: 0.8,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                marginLeft: 6,
              }}
            >
              Devise
            </div>
            <select
              value={displayCcy}
              onChange={(e) => setDisplayCcy(e.target.value)}
              style={selStyle(110)}
            >
              {["USD", "EUR", "CHF"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            {/* Langue */}
            <div
              style={{
                fontSize: 12,
                color: "#c5ccd3",
                opacity: 0.8,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                marginLeft: 6,
              }}
            >
              Langue
            </div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={selStyle(150)}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* === Formulaire inline: Ajouter Flux === */}
        {openFlowForm && (
          <div style={inlineCardStyle}>
            <div style={inlineHeadRowStyle}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                Ajouter un flux
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={addFlow}
                  style={ghostBtn(false)}
                >
                  enregistrer
                </button>
                <button
                  onClick={() => setOpenFlowForm(false)}
                  style={ghostBtn(true)}
                >
                  fermer
                </button>
              </div>
            </div>

            <form
              onSubmit={addFlow}
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              }}
            >
              <label style={labelStyle}>
                <span style={labelSpanStyle}>type</span>
                <select
                  value={flowDraft.type}
                  onChange={(e) =>
                    setFlowDraft((f) => ({
                      ...f,
                      type: e.target.value,
                    }))
                  }
                  style={selStyle()}
                >
                  <option value="deposit">dépôt</option>
                  <option value="withdrawal">retrait</option>
                  <option value="prop_payout">payout prop</option>
                  <option value="prop_fee">frais challenge prop</option>
                  <option value="darwin_mgmt_fee">
                    darwinex – management fee
                  </option>
                  <option value="business_expense">charge business</option>
                  <option value="other_income">autre revenu</option>
                </select>
              </label>

              <label style={labelStyle}>
                <span style={labelSpanStyle}>date</span>
                <input
                  type="date"
                  value={flowDraft.date}
                  onChange={(e) =>
                    setFlowDraft((f) => ({
                      ...f,
                      date: e.target.value,
                    }))
                  }
                  style={selStyle()}
                />
              </label>

              <label style={labelStyle}>
                <span style={labelSpanStyle}>devise</span>
                <select
                  value={flowDraft.ccy}
                  onChange={(e) =>
                    setFlowDraft((f) => ({
                      ...f,
                      ccy: e.target.value,
                    }))
                  }
                  style={selStyle()}
                >
                  {["USD", "EUR", "CHF"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                <span style={labelSpanStyle}>montant</span>
                <input
                  type="number"
                  step="0.01"
                  value={flowDraft.amount}
                  onChange={(e) =>
                    setFlowDraft((f) => ({
                      ...f,
                      amount: e.target.value,
                    }))
                  }
                  style={selStyle()}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                <span style={labelSpanStyle}>note</span>
                <input
                  placeholder="optionnel"
                  value={flowDraft.note}
                  onChange={(e) =>
                    setFlowDraft((f) => ({
                      ...f,
                      note: e.target.value,
                    }))
                  }
                  style={selStyle()}
                />
              </label>
            </form>
          </div>
        )}

        {/* === Formulaire inline: Capital Tiers === */}
        {openTierForm && (
          <div style={inlineCardStyle}>
            <div style={inlineHeadRowStyle}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                Capital tiers
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={addTier}
                  style={ghostBtn(false)}
                >
                  enregistrer
                </button>
                <button
                  onClick={() => setOpenTierForm(false)}
                  style={ghostBtn(true)}
                >
                  fermer
                </button>
              </div>
            </div>

            <form
              onSubmit={addTier}
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              }}
            >
              <label style={labelStyle}>
                <span style={labelSpanStyle}>source</span>
                <select
                  value={tierDraft.source}
                  onChange={(e) =>
                    setTierDraft((f) => ({
                      ...f,
                      source: e.target.value,
                    }))
                  }
                  style={selStyle()}
                >
                  {[
                    "Prop firm",
                    "Darwinex invest",
                    "Axi Select",
                    "Investisseur",
                    "Autre",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                <span style={labelSpanStyle}>date</span>
                <input
                  type="date"
                  value={tierDraft.date}
                  onChange={(e) =>
                    setTierDraft((f) => ({
                      ...f,
                      date: e.target.value,
                    }))
                  }
                  style={selStyle()}
                />
              </label>

              <label style={labelStyle}>
                <span style={labelSpanStyle}>devise</span>
                <select
                  value={tierDraft.ccy}
                  onChange={(e) =>
                    setTierDraft((f) => ({
                      ...f,
                      ccy: e.target.value,
                    }))
                  }
                  style={selStyle()}
                >
                  {["USD", "EUR", "CHF"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                <span style={labelSpanStyle}>montant</span>
                <input
                  type="number"
                  step="0.01"
                  value={tierDraft.amount}
                  onChange={(e) =>
                    setTierDraft((f) => ({
                      ...f,
                      amount: e.target.value,
                    }))
                  }
                  style={selStyle()}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                <span style={labelSpanStyle}>note</span>
                <input
                  placeholder="optionnel"
                  value={tierDraft.note}
                  onChange={(e) =>
                    setTierDraft((f) => ({
                      ...f,
                      note: e.target.value,
                    }))
                  }
                  style={selStyle()}
                />
              </label>
            </form>
          </div>
        )}

        {/* === Récap flux inline === */}
        {openRecap && (
          <div style={inlineCardStyle}>
            <div style={inlineHeadRowStyle}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                Cashflows (récapitulatif)
              </div>
              <button
                onClick={() => setOpenRecap(false)}
                style={ghostBtn(true)}
              >
                fermer
              </button>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                color: "#c5ccd3",
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    color: "#c5ccd3",
                    fontWeight: 500,
                  }}
                >
                  <th style={{ padding: "4px 6px" }}>date</th>
                  <th style={{ padding: "4px 6px" }}>type</th>
                  <th style={{ padding: "4px 6px", textAlign: "right" }}>
                    montant
                  </th>
                  <th style={{ padding: "4px 6px" }}>devise</th>
                  <th style={{ padding: "4px 6px" }}>note</th>
                </tr>
              </thead>
              <tbody>
                {cashflowsAll.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: 8,
                        opacity: 0.7,
                      }}
                    >
                      aucun flux
                    </td>
                  </tr>
                ) : (
                  cashflowsAll.map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: "4px 6px" }}>{r.date}</td>
                      <td style={{ padding: "4px 6px" }}>{r.type}</td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "right",
                        }}
                      >
                        <span style={styleNum(r.amount)}>
                          {Number(r.amount).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: "4px 6px" }}>{r.ccy || "USD"}</td>
                      <td style={{ padding: "4px 6px" }}>{r.note || ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* === About inline === */}
        {openAbout && (
          <div style={inlineCardStyle}>
            <div style={inlineHeadRowStyle}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                À Propos
              </div>
              <button
                onClick={() => setOpenAbout(false)}
                style={ghostBtn(true)}
              >
                fermer
              </button>
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "#c5ccd3",
              }}
            >
              <div style={{ fontWeight: 600, color: "#ffffff" }}>
                ZooProjectVision
              </div>
              <div style={{ marginTop: 6 }}>
                Version : <b>V5.1.1</b>
              </div>
              <div style={{ opacity: 0.85, marginTop: 6 }}>
                Consulte le changelog pour les nouveautés et correctifs.
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                (lien changelog à intégrer)
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Filtres bloc
  function FiltersBlock() {
    return (
      <div
        style={{
          background: "#111318",
          border: "1px solid #2a2f3a",
          borderRadius: 16,
          padding: 16,
          color: "#c5ccd3",
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))",
            gap: 10,
          }}
        >
          {/* Actif */}
          <div style={filterColStyle}>
            <div style={filterLabelStyle}>Actif</div>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              style={selStyle()}
            >
              <option>All</option>
              {assets.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Broker */}
          <div style={filterColStyle}>
            <div style={filterLabelStyle}>Broker</div>
            <select
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              style={selStyle()}
            >
              <option>All</option>
              {brokers.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Stratégie */}
          <div style={filterColStyle}>
            <div style={filterLabelStyle}>Stratégie</div>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              style={selStyle()}
            >
              <option>All</option>
              {strategies.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div style={filterColStyle}>
            <div style={filterLabelStyle}>Du</div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={selStyle()}
            />
          </div>

          {/* Date To */}
          <div style={filterColStyle}>
            <div style={filterLabelStyle}>Au</div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={selStyle()}
            />
          </div>
        </div>
      </div>
    );
  }

  // KPIs bloc
  function KPIsBlock() {
    return (
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: "#ffffff",
            marginBottom: 6,
          }}
        >
          Indicateurs Principaux
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px,1fr))",
            gap: 12,
          }}
        >
          <KpiCard
            title="Capital Initial"
            value={fmt(capitalInitialDisp)}
          />

          <KpiCard
            title="Cashflow"
            value={fmt(cashFlowTotal)}
            bad={cashFlowTotal < 0}
          />

          <KpiCard
            title="PnL (Filtré)"
            value={fmt(pnlFiltered)}
            bad={pnlFiltered < 0}
          />

          <KpiCard
            title="Capital Total"
            value={fmt(capitalGlobal)}
            bad={pnlFiltered < 0}
          />

          <KpiCard
            title="Rentabilité"
            value={returnPct.toFixed(2) + "%"}
            bad={returnPct < 0}
          />

          <KpiCard
            title="Max DD %"
            value={maxDDPct.toFixed(2) + "%"}
          />

          <KpiCard
            title="Max DD (Abs.)"
            value={fmt(maxDDAbs)}
          />

          <KpiCard
            title="Jours Actifs"
            value={new Set(filtered.map((t) => t.date)).size}
          />

          <KpiCard
            title="Capital Tiers"
            value={fmt(tiersTotal)}
          />

          <KpiCard
            title="Trades Total"
            value={filtered.length}
          />
        </div>
      </div>
    );
  }

  // Equité : version simplifiée sans chart (texte résumé)
  function EquitySummary() {
    // equity cumulée jour après jour pour construire un aperçu
    const dailyMap = new Map();
    filtered.forEach((r) => {
      const v = convert(r.pnl, r.ccy || "USD", displayCcy);
      dailyMap.set(r.date, (dailyMap.get(r.date) || 0) + v);
    });
    const sortedDaily = Array.from(dailyMap.entries())
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let eqNow = convert(initialCapitalUSD, "USD", displayCcy);
    let peakEq = eqNow;
    let rowsEq = [];
    sortedDaily.forEach((d) => {
      eqNow += d.pnl;
      peakEq = Math.max(peakEq, eqNow);
      const ddAbs = Math.max(0, peakEq - eqNow);
      rowsEq.push({
        date: d.date,
        equity: eqNow,
        drawdownAbs: ddAbs,
      });
    });

    const lastPoint = rowsEq[rowsEq.length - 1];
    return (
      <div
        style={{
          background: "#111318",
          border: "1px solid #2a2f3a",
          borderRadius: 16,
          padding: 16,
          color: "#c5ccd3",
          fontSize: 13,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: "#ffffff",
            marginBottom: 8,
          }}
        >
          Courbe d’Équité (résumé)
        </div>

        {rowsEq.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Pas assez de données filtrées pour afficher l'équité.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, lineHeight: 1.4, opacity: 0.8 }}>
              Dernière date: {lastPoint.date}
              <br />
              Équité courante:{" "}
              <span style={{ color: "#ffffff", fontWeight: 600 }}>
                {fmt(lastPoint.equity)}
              </span>
              <br />
              Drawdown absolu actuel: {fmt(lastPoint.drawdownAbs)}
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  color: "#ffffff",
                  marginBottom: 4,
                }}
              >
                Derniers points:
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr
                    style={{
                      color: "#c5ccd3",
                      fontWeight: 500,
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "4px 6px" }}>Date</th>
                    <th style={{ padding: "4px 6px", textAlign: "right" }}>
                      Équité
                    </th>
                    <th style={{ padding: "4px 6px", textAlign: "right" }}>
                      DD abs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowsEq.slice(-6).map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: "4px 6px" }}>{row.date}</td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "right",
                        }}
                      >
                        {fmt(row.equity)}
                      </td>
                      <td
                        style={{
                          padding: "4px 6px",
                          textAlign: "right",
                        }}
                      >
                        {fmt(row.drawdownAbs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  // === rendu final page control ===
  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1400,
        margin: "0 auto",
        color: "#c5ccd3",
      }}
    >
      {/* header / actions */}
      <DashboardHeader />

      {/* filtres */}
      <FiltersBlock />

      {/* KPIs */}
      <KPIsBlock />

      {/* zone metriques principales */}
      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)",
          gap: 16,
        }}
      >
        {/* équité + calendrier + activité */}
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          <EquitySummary />

          <CalendarMonthly
            rows={filtered}
            convert={convert}
            ccy={displayCcy}
            startEquity={convert(
              initialCapitalUSD,
              "USD",
              displayCcy
            )}
          />

          <ActivityBlocks rows={filtered} />
        </div>

        {/* stats droites */}
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          <WinRateBlock rows={filtered} />
          <RatiosBlock
            rows={filtered}
            convert={convert}
            ccy={displayCcy}
          />
          <CorrelationBlock
            rows={filtered}
            convert={convert}
            ccy={displayCcy}
          />
          <MappingTable
            rows={filtered}
            convert={convert}
            ccy={displayCcy}
          />
        </div>
      </div>

      {/* message aucune donnée */}
      {noData && (
        <div
          style={{
            background: "#2a1d00",
            border: "1px solid #ffb347",
            borderRadius: 16,
            padding: 16,
            marginTop: 24,
            textAlign: "center",
            color: "#ffb347",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            Aucune Donnée
          </div>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Ajuste les filtres ou importe un CSV pour voir les stats.
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   petits styles inline réutilisés
   =========================== */

const ghostBtn = (ghost = false) => ({
  background: ghost ? "transparent" : "#1a1e2a",
  border: "1px solid #2a2f3a",
  borderRadius: 8,
  color: "#c5ccd3",
  fontSize: 12,
  padding: "6px 10px",
  cursor: "pointer",
});

const selStyle = (w) => ({
  background: "#0f1115",
  border: "1px solid #2a2f3a",
  borderRadius: 8,
  color: "#c5ccd3",
  fontSize: 13,
  padding: "6px 8px",
  width: w || "100%",
  minHeight: 32,
});

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontSize: 12,
  color: "#c5ccd3",
  lineHeight: 1.4,
};

const labelSpanStyle = {
  opacity: 0.8,
  marginBottom: 4,
};

const inlineCardStyle = {
  marginTop: 16,
  background: "#0f1115",
  border: "1px solid #2a2f3a",
  borderRadius: 16,
  padding: 16,
  color: "#c5ccd3",
  fontSize: 13,
};

const inlineHeadRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const filterColStyle = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  fontSize: 12,
};

const filterLabelStyle = {
  marginBottom: 4,
  fontSize: 12,
  color: "#c5ccd3",
  opacity: 0.8,
  lineHeight: 1.4,
  fontWeight: 500,
};

function KpiCard({ title, value, bad }) {
  return (
    <div
      style={{
        background: "#111318",
        border: `1px solid ${bad ? "#ff5fa2" : "#2a2f3a"}`,
        borderRadius: 16,
        padding: 16,
        minHeight: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#c5ccd3",
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.8,
          fontWeight: 500,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: bad ? "#ff5fa2" : "#ffffff",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ===========================
   PAGE COMPTA / PAGE RISK (stubs)
   =========================== */

function SimplePage({ title, children }) {
  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
        color: "#c5ccd3",
      }}
    >
      <div
        style={{
          background: "#111318",
          border: "1px solid #2a2f3a",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.4,
            opacity: 0.8,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   HOME SCREEN
   =========================== */

function HomeScreen({ onNav }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#c5ccd3",
      }}
    >
      {/* Titre principal */}
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "#ffffff",
          margin: 0,
          textAlign: "center",
        }}
      >
        ZooProjectVision
      </h1>

      {/* Sous-titre */}
      <p
        style={{
          marginTop: 8,
          fontSize: 14,
          lineHeight: 1.4,
          color: "#c5ccd3",
          opacity: 0.9,
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        Le tableau de bord de performance trading Edouard & Michel Jimenez
      </p>

      {/* Grille */}
      <div
        style={{
          marginTop: 24,
          width: "100%",
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <HubCard
          title="Centre de Contrôle"
          subtitle="Vue complète: filtres, equity, corrélation, calendrier, activité."
          goto="control"
          onNav={onNav}
        />

        <HubCard
          title="Comptabilité d’Entreprise"
          subtitle="Suivi des flux (payouts, frais, dépôts), catégories et exports."
          goto="compta"
          onNav={onNav}
        />

        <HubCard
          title="Gestion du Risque"
          subtitle="Seuils, limites et recommandations d’ajustement."
          goto="risk"
          onNav={onNav}
        />

        {/* Widget Darwinex placeholder */}
        <div
          style={{
            border: "1px solid #2a2f3a",
            background: "#111318",
            borderRadius: 16,
            padding: 16,
            minHeight: 140,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#6aa9ff",
                marginBottom: 6,
              }}
            >
              Darwin VYU
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.4,
                color: "#c5ccd3",
                opacity: 0.9,
                marginBottom: 12,
              }}
            >
              Performance live du Darwin.
            </div>
          </div>
          <div
            style={{
              background: "#0f1115",
              borderRadius: 12,
              border: "1px solid #2a2f3a",
              padding: 12,
              textAlign: "center",
              fontSize: 12,
              color: "#c5ccd3",
            }}
          >
            [Widget Darwinex intégré ici]
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   APP ROOT
   =========================== */

export default function App() {
  // ----- navigation -----
  const [view, setView] = React.useState("home"); // home | control | compta | risk
  const goHome = () => setView("home");
  const go = (v) => {
    const vv = String(v || "").toLowerCase();
    if (["home", "control", "compta", "risk"].includes(vv)) {
      setView(vv);
    } else {
      setView("home");
    }
  };

  // ----- langue / i18n simple -----
  const LOCALES = ["fr", "en"];
  const [lang, setLang] = React.useState("fr");

  // dico très simple pour la démo
  const t = {
    brand: "ZooProjectVision",
    subtitle_default:
      "Tableau de bord multi-actifs, multi-brokers, multi-stratégies.",
  };

  // ----- devise -----
  const [displayCcy, setDisplayCcy] = React.useState("USD");

  // fallback FX simple
  const fallbackRates = {
    USD: { USD: 1, EUR: 0.93, CHF: 0.88 },
    EUR: { USD: 1 / 0.93, EUR: 1, CHF: 0.88 / 0.93 },
    CHF: { USD: 1 / 0.88, EUR: 0.93 / 0.88, CHF: 1 },
  };
  const [rates, setRates] = React.useState(fallbackRates);

  // convert / fmt
  const convert = (val, from = "USD", to = displayCcy) => {
    if (val == null) return 0;
    if (from === to) return Number(Number(val).toFixed(2));
    const tab = rates || fallbackRates;
    const r = tab[from] && tab[from][to] ? tab[from][to] : 1;
    return Number((Number(val) * r).toFixed(2));
  };

  const fmt = (v, ccy = displayCcy) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: ccy,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v ?? 0);
    } catch {
      return `${(v ?? 0).toFixed(2)} ${ccy}`;
    }
  };

  // ----- data demo & états persistants -----
  const demoTrades = React.useMemo(() => genDemoTrades(), []);
  // (Version simplifiée: pas encore userTrades merge, on fera plus tard)
  const tradesAll = demoTrades;

  // flows (localStorage)
  const [flows, setFlows] = React.useState(() => {
    try {
      const raw = localStorage.getItem("zpv_flows");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("zpv_flows", JSON.stringify(flows));
    } catch {}
  }, [flows]);

  // capital tiers
  const [tiers, setTiers] = React.useState(() => {
    try {
      const raw = localStorage.getItem("zpv_tiers");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("zpv_tiers", JSON.stringify(tiers));
    } catch {}
  }, [tiers]);

  // capital initial
  const CAPITAL_INITIAL_USD = 100000;

  // ===========================
  // Rendu final
  // ===========================
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0b0f",
        color: "#c5ccd3",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {view === "home" ? (
        <>
          <HomeScreen onNav={go} />
          <LocalFooter />
        </>
      ) : (
        <>
          <InternalHeader view={view} goHome={goHome} />

          {view === "control" && (
            <>
              <ControlPage
                t={t}
                lang={lang}
                setLang={setLang}
                LOCALES={LOCALES}
                displayCcy={displayCcy}
                setDisplayCcy={setDisplayCcy}
                convert={convert}
                fmt={fmt}
                initialCapitalUSD={CAPITAL_INITIAL_USD}
                tradesAll={tradesAll}
                flows={flows}
                setFlows={setFlows}
                tiers={tiers}
                setTiers={setTiers}
              />
              <LocalFooter />
            </>
          )}

          {view === "compta" && (
            <>
              <SimplePage title="Comptabilité entreprise">
                Récap flux, revenus, charges, exports CSV.
              </SimplePage>
              <LocalFooter />
            </>
          )}

          {view === "risk" && (
            <>
              <SimplePage title="Analyse de risque">
                Seuils, limites, recommandations d’ajustement.
              </SimplePage>
              <LocalFooter />
            </>
          )}
        </>
      )}
    </div>
  );
}
