import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

export default function App() {
  try {
    // ------------------------------
    // Thème / couleurs
    // ------------------------------
    const colors = {
      bg: "#0b0b0c",
      text: "#e9ecef",
      muted: "#bfc5c9",
      panel: "#151515",
      border: "#242424",
      turq: "#20e3d6",
      turq2: "#18b8ad",
      pink: "#ff5fa2",
      pink2: "#ff7cbf",
      gold: "#c9a44b",
      axis: "#7a7a7a"
    }

    const card = {
      background: colors.panel,
      border: `1px solid ${colors.border}`,
      borderRadius: 14,
      padding: 10
    }

    // ------------------------------
    // Démo data (60 jours, multi-actifs/brokers/strats)
    // ------------------------------
    const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"]
    const BROKERS = ["Darwinex", "ICMarkets", "Pepperstone"]
    const STRATS = ["Strategy 1", "Strategy 2", "Breakout"]

    const demoTrades = useMemo(() => {
      const rows = []
      const today = new Date()
      for (let i = 60; i >= 1; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const date = d.toISOString().slice(0, 10)
        // 6 trades / jour environ
        for (let k = 0; k < 6; k++) {
          const asset = ASSETS[(i + k) % ASSETS.length]
          const broker = BROKERS[(i + k * 2) % BROKERS.length]
          const strategy = STRATS[(i + k * 3) % STRATS.length]
          // pnl démo avec grosses variations positives/négatives
          let pnl = (Math.random() - 0.5) * (Math.random() < 0.15 ? 2500 : 900)
          pnl = Number(pnl.toFixed(2))
          rows.push({ date, asset, broker, strategy, pnl })
        }
      }
      return rows
    }, [])

    // ------------------------------
    // Filtres
    // ------------------------------
    const [asset, setAsset] = useState("All")
    const [broker, setBroker] = useState("All")
    const [strategy, setStrategy] = useState("All")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const resetFilters = () => { setAsset("All"); setBroker("All"); setStrategy("All"); setDateFrom(""); setDateTo("") }

    const assets = useMemo(() => Array.from(new Set(demoTrades.map(t => t.asset))), [demoTrades])
    const brokers = useMemo(() => Array.from(new Set(demoTrades.map(t => t.broker))), [demoTrades])
    const strategies = useMemo(() => Array.from(new Set(demoTrades.map(t => t.strategy))), [demoTrades])

    const filtered = useMemo(() => demoTrades.filter(t => {
      if (asset !== "All" && t.asset !== asset) return false
      if (broker !== "All" && t.broker !== broker) return false
      if (strategy !== "All" && t.strategy !== strategy) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      return true
    }), [demoTrades, asset, broker, strategy, dateFrom, dateTo])

    // ------------------------------
    // KPI
    // ------------------------------
    const CAPITAL_INITIAL = 100000
    const CASH_FLOW = 1500

    const totalPnl = useMemo(() => filtered.reduce((s, t) => s + t.pnl, 0), [filtered])
    const capitalGlobal = CAPITAL_INITIAL + CASH_FLOW + totalPnl

    const wins = filtered.filter(t => t.pnl > 0).length
    const wr = filtered.length ? (wins / filtered.length) * 100 : 0

    const avgWin = (() => {
      const list = filtered.filter(t => t.pnl > 0).map(t => t.pnl)
      return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
    })()
    const avgLoss = (() => {
      const list = filtered.filter(t => t.pnl < 0).map(t => Math.abs(t.pnl))
      return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
    })()
    const rr = avgLoss > 0 ? (avgWin / avgLoss) : 0

    // risque de ruine (approche simplifiée)
    const expectancy = (wr / 100) * rr - (1 - wr / 100)
    const riskPerTrade = 0.01
    const riskOfRuin = (() => {
      const x = expectancy / (rr + 1 || 1)
      const base = (1 - x) / (1 + x)
      if (!isFinite(base) || base <= 0) return 0
      const r = Math.pow(base, 1 / Math.max(1e-6, riskPerTrade))
      return Math.max(0, Math.min(1, r))
    })()

    // ------------------------------
    // Séries pour graphiques
    // ------------------------------
    function groupByDateSumPnl(rows) {
      const m = new Map()
      for (const r of rows) m.set(r.date, (m.get(r.date) || 0) + r.pnl)
      return Array.from(m, ([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date))
    }
    const pnlByDate = useMemo(() => groupByDateSumPnl(filtered), [filtered])

    // Equity (cumule pnl par date, base = capital initial + cash flow)
    const equitySeries = useMemo(() => {
      let eq = CAPITAL_INITIAL + CASH_FLOW
      return pnlByDate.map(pt => {
        eq += pt.pnl
        return { date: pt.date, equity: Number(eq.toFixed(2)) }
      })
    }, [pnlByDate])

    // Histogramme Gain/Perte par actif (somme pnl)
    function groupByNameSum(rows, key) {
      const m = new Map()
      for (const r of rows) {
        const k = r[key]
        m.set(k, (m.get(k) || 0) + r.pnl)
      }
      return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    }
    const pnlByAsset = useMemo(() => groupByNameSum(filtered, "asset"), [filtered])

    // Pie répartition absolue (part de contribution |pnl|)
    const pieData = useMemo(() => {
      const sums = new Map()
      for (const r of filtered) {
        sums.set(r.asset, (sums.get(r.asset) || 0) + Math.abs(r.pnl))
      }
      const tot = Array.from(sums.values()).reduce((a, b) => a + b, 0) || 1
      return Array.from(sums, ([name, val]) => ({
        name,
        value: val,
        pct: (val / tot) * 100,
      })).sort((a, b) => b.value - a.value)
    }, [filtered])

    // ------------------------------
    // Render
    // ------------------------------
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: 16
      }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h1 style={{ color: colors.turq, fontWeight: 400, margin: 0, fontSize: 22 }}>ZooProjectVision</h1>
            <p style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Dashboard de performance trading</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: 'wrap' }}>
            <button style={{
              border: `1px solid ${colors.gold}`, background: "transparent", color: colors.text,
              padding: "8px 12px", borderRadius: 10, cursor: "pointer"
            }} onClick={() => window.location.reload()}>actualiser</button>
            <button style={{
              border: `1px solid ${colors.gold}`, background: "transparent", color: colors.text,
              padding: "8px 12px", borderRadius: 10, cursor: "pointer"
            }} onClick={resetFilters}>réinitialiser filtres</button>
          </div>
        </div>

        {/* FILTRES */}
        <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          <div>
            <div style={{ color: colors.text, fontSize: 12, marginBottom: 4, fontWeight: 400 }}>Actif</div>
            <select value={asset} onChange={e => setAsset(e.target.value)}
              style={selStyle(colors)}>
              <option>All</option>
              {assets.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color: colors.text, fontSize: 12, marginBottom: 4, fontWeight: 400 }}>Broker</div>
            <select value={broker} onChange={e => setBroker(e.target.value)}
              style={selStyle(colors)}>
              <option>All</option>
              {brokers.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color: colors.text, fontSize: 12, marginBottom: 4, fontWeight: 400 }}>Stratégie</div>
            <select value={strategy} onChange={e => setStrategy(e.target.value)}
              style={selStyle(colors)}>
              <option>All</option>
              {strategies.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color: colors.text, fontSize: 12, marginBottom: 4, fontWeight: 400 }}>Du</div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={selStyle(colors)} />
          </div>
          <div>
            <div style={{ color: colors.text, fontSize: 12, marginBottom: 4, fontWeight: 400 }}>Au</div>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={selStyle(colors)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <div style={{ color: colors.muted, fontSize: 12 }}>
              {filtered.length} trades
            </div>
          </div>
        </div>

        {/* KPI */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginTop: 12
        }}>
          <div style={card}>
            <h3 style={kpiTitle(colors)}>Capital initial</h3>
            <div style={{ fontSize: 18 }}>{CAPITAL_INITIAL.toLocaleString()} USD</div>
          </div>
          <div style={card}>
            <h3 style={kpiTitle(colors)}>Cash flow</h3>
            <div style={{ fontSize: 18, color: colors.turq }}>+{CASH_FLOW.toFixed(2)} USD</div>
          </div>
          <div style={card}>
            <h3 style={kpiTitle(colors)}>PNL (filtré)</h3>
            <div style={{ fontSize: 18, color: totalPnl >= 0 ? colors.turq : colors.pink }}>
              {totalPnl.toFixed(2)} USD
            </div>
          </div>
          <div style={card}>
            <h3 style={kpiTitle(colors)}>Capital global</h3>
            <div style={{ fontSize: 18 }}>{capitalGlobal.toFixed(2)} USD</div>
          </div>
        </div>

        {/* KPI secondaires */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 12
        }}>
          <div style={card}>
            <h3 style={kpiTitle(colors)}>Win Rate / RR</h3>
            <div style={{ fontSize: 16 }}>{wr.toFixed(2)}% / {rr.toFixed(2)}</div>
          </div>
          <div style={card}>
            <h3 style={kpiTitle(colors)}>Risque ruine</h3>
            <div style={{ fontSize: 16, color: colors.pink }}>{(riskOfRuin * 100).toFixed(2)}%</div>
          </div>
          <div style={card}>
            <h3 style={kpiTitle(colors)}>Trades</h3>
            <div style={{ fontSize: 16 }}>{filtered.length}</div>
          </div>
        </div>

        {/* Courbe d'équité */}
        <div style={{ ...card, height: 360, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>Courbe d’équité</h3>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={equitySeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="turqStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.turq} /><stop offset="100%" stopColor={colors.turq2} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10 }}
                itemStyle={{ color: colors.text }}
                labelStyle={{ color: colors.text }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />
              <Line type="monotone" dataKey="equity" name="Équité" dot={false} stroke="#ffffff" strokeWidth={2.6} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Histogramme par actif */}
        <div style={{ ...card, height: 320, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>Gain / Perte par actif</h3>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={pnlByAsset} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="name" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10 }}
                itemStyle={{ color: colors.text }}
                labelStyle={{ color: colors.text }}
                formatter={(v) => [`${Number(v).toFixed(2)} USD`, 'PnL']}
              />
              <Bar dataKey="value" name="PnL">
                {pnlByAsset.map((row, i) => (
                  <Cell key={i} fill={row.value >= 0 ? "url(#turqGloss)" : "url(#pinkGloss)"} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="turqGloss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.turq} /><stop offset="100%" stopColor={colors.turq2} />
                </linearGradient>
                <linearGradient id="pinkGloss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.pink} /><stop offset="100%" stopColor={colors.pink2} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition PnL (absolu) */}
        <div style={{ ...card, height: 320, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>Répartition PnL</h3>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} stroke="none"
                   label={({ name, pct }) => `${name} ${(pct).toFixed(2)}%`}>
                {pieData.map((seg, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "url(#pieTurq)" : "url(#piePink)"} stroke="none" />
                ))}
              </Pie>
              <defs>
                <linearGradient id="pieTurq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.turq} /><stop offset="100%" stopColor={colors.turq2} />
                </linearGradient>
                <linearGradient id="piePink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.pink} /><stop offset="100%" stopColor={colors.pink2} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10 }}
                itemStyle={{ color: colors.text }}
                labelStyle={{ color: colors.text }}
                formatter={(v, n, ctx) => [`${Number(ctx.payload.value).toFixed(2)} USD (${ctx.payload.pct.toFixed(2)}%)`, ctx.payload.name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 20 }}>
          ZooProjectVision © {new Date().getFullYear()}
        </div>
      </div>
    )
  } catch (e) {
    console.error(e)
    return <div style={{ color: '#ff5fa2', padding: 16 }}>Erreur dans App.jsx : {String(e.message || e)}</div>
  }
}

/* ---------- helpers UI ---------- */
function selStyle(colors) {
  return {
    width: "100%",
    padding: "8px 10px",
    fontSize: 12,
    color: colors.text,
    background: "#0f0f10",
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    outline: "none"
  }
}
function kpiTitle(colors) {
  return { fontWeight: 400, color: colors.text, margin: "0 0 6px", fontSize: 13 }
}
