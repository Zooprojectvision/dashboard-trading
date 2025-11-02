// src/components/control/EquityBlock.jsx
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Scatter,
  ComposedChart,
} from "recharts";

/*
  Props attendues :
  - rows:          array de trades filtrés [{date, pnl, ccy, strategy, ...}]
  - cashflows:     array des flux financiers [{date, amount, ccy, ...}]
  - initial:       capital initial (en USD brut)
  - convert:       fonction convert(val, fromCcy, toCcy)
  - ccy:           devise d'affichage actuelle (ex "USD" / "EUR" / "CHF")

  Ce composant rend la grosse carte "Courbe d'Équité".
  On a retiré toutes les bulles d'aide et tout le blabla.
*/

export default function EquityBlock({
  rows,
  cashflows,
  initial,
  convert,
  ccy,
}) {
  const [mode, setMode] = React.useState("global"); // 'global' | 'strat'

  // Série agrégée par date (PnL journalier)
  const byDate = React.useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const v = convert(r.pnl, r.ccy || "USD", ccy);
      m.set(r.date, (m.get(r.date) || 0) + v);
    });
    return [...m.entries()]
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [rows, ccy, convert]);

  // Construire l'équity cumulée globale
  let eq = convert(initial, "USD", ccy);
  let peak = eq;
  const globalSeries = byDate.map((d) => {
    eq += d.pnl;
    peak = Math.max(peak, eq);
    const drawdownAbs = Math.max(0, peak - eq);
    return {
      date: d.date,
      equity: eq,
      pnl: d.pnl,
      peakEquity: peak,
      drawdownAbs,
    };
  });

  // Points spéciaux
  const fluxDates = new Set(cashflows.map((c) => c.date));
  const scatterFlux = globalSeries
    .filter((x) => fluxDates.has(x.date))
    .map((x) => ({ date: x.date, equity: x.equity }));

  const scatterLoss = globalSeries
    .filter((x) => x.pnl < 0)
    .map((x) => ({ date: x.date, equity: x.equity }));

  // Série cumulée par stratégie (courbes multiples)
  const strats = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.strategy))).sort(),
    [rows]
  );

  const byDateStrat = React.useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const v = convert(r.pnl, r.ccy || "USD", ccy);
      if (!m.has(r.date)) m.set(r.date, new Map());
      const mm = m.get(r.date);
      mm.set(r.strategy, (mm.get(r.strategy) || 0) + v);
    });
    return m;
  }, [rows, ccy, convert]);

  const datesAll = React.useMemo(
    () => Array.from(new Set(globalSeries.map((d) => d.date))).sort(),
    [globalSeries]
  );

  const stratSeries = React.useMemo(() => {
    const acc = {};
    strats.forEach((s) => (acc[s] = 0));

    const out = datesAll.map((date) => {
      const mm = byDateStrat.get(date) || new Map();
      const row = { date };
      strats.forEach((s) => {
        acc[s] += mm.get(s) || 0;
        row[s] = acc[s];
      });
      return row;
    });

    return out;
  }, [strats, datesAll, byDateStrat]);

  return (
    <div className="card">
      {/* En-tête bloc */}
      <div className="block-head">
        <div className="block-title cap">Courbe d’Équité</div>

        <div className="block-tools" style={{ gap: 8 }}>
          <span className="kpi-sub" style={{ opacity: 0.85 }}>
            Vue
          </span>
          <select
            className="sel"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="global">Global (PnL cumulé)</option>
            <option value="strat">Par Stratégie (PnL cumulé)</option>
          </select>
        </div>
      </div>

      {/* Le graphe */}
      <ResponsiveContainer width="100%" height={420}>
        {mode === "global" ? (
          <ComposedChart
            data={globalSeries}
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis
              dataKey="date"
              stroke="var(--axis-text)"
              tickLine={false}
              axisLine={{ stroke: "var(--axis-text)" }}
              tick={{ fontSize: 11, fill: "var(--axis-text)" }}
            />
            <YAxis
              stroke="var(--axis-text)"
              tickLine={false}
              axisLine={{ stroke: "var(--axis-text)" }}
              tick={{ fontSize: 11, fill: "var(--axis-text)" }}
            />
            <Tooltip />
            <Legend />

            {/* Équité principale */}
            <Line
              type="monotone"
              dataKey="equity"
              name="Équité"
              dot={false}
              stroke="var(--white)"
              strokeWidth={1.8}
            />

            {/* Plus haut atteint */}
            <Line
              type="monotone"
              dataKey="peakEquity"
              name="Peak"
              dot={false}
              stroke="var(--text)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />

            {/* Drawdown absolu */}
            <Line
              type="monotone"
              dataKey="drawdownAbs"
              name="DD (abs.)"
              dot={false}
              stroke="var(--pink)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* Points spéciaux */}
            <Scatter
              data={scatterLoss}
              dataKey="equity"
              name="Perte"
              fill="var(--pink)"
            />
            <Scatter
              data={scatterFlux}
              dataKey="equity"
              name="Flux"
              fill="var(--accent)"
            />
          </ComposedChart>
        ) : (
          <LineChart
            data={stratSeries}
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis
              dataKey="date"
              stroke="var(--axis-text)"
              tickLine={false}
              axisLine={{ stroke: "var(--axis-text)" }}
              tick={{ fontSize: 11, fill: "var(--axis-text)" }}
            />
            <YAxis
              stroke="var(--axis-text)"
              tickLine={false}
              axisLine={{ stroke: "var(--axis-text)" }}
              tick={{ fontSize: 11, fill: "var(--axis-text)" }}
            />
            <Tooltip />
            <Legend />
            {strats.map((s, i) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                name={s}
                dot={false}
                stroke={[
                  "var(--white)",
                  "var(--green)",
                  "var(--pink)",
                  "var(--orange)",
                ][i % 4]}
                strokeWidth={1.6}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Légende courte */}
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "var(--text)",
        }}
      >
        <span style={{ opacity: 0.9 }}>Pointillés :</span>{" "}
        Peak (gris), DD (rose). •{" "}
        <span style={{ opacity: 0.85 }}>
          points bleus = flux, points roses = jours perdants
        </span>
      </div>
    </div>
  );
}

