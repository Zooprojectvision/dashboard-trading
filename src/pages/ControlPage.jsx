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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Scatter,
  ComposedChart,
} from "recharts";

import FlowModal from "../components/control/FlowModal.jsx";
import CapitalTiersModal from "../components/control/CapitalTiersModal.jsx";
import CashflowsModal from "../components/control/CashflowsModal.jsx";
import AboutModal from "../components/control/AboutModal.jsx";

import WinRateBlock from "../components/control/WinRateBlock.jsx";
import RatiosBlock from "../components/control/RatiosBlock.jsx";
import CorrelationBlock from "../components/control/CorrelationBlock.jsx";
import MappingTable from "../components/control/MappingTable.jsx";
import ActivityBlocks from "../components/control/ActivityBlocks.jsx";
import CalendarMonthly from "../components/control/CalendarMonthly.jsx";
import EquityBlock from "../components/control/EquityBlock.jsx";

/*
IMPORTANT :
Les composants importés au-dessus (FlowModal, RatiosBlock, etc.)
viennent pour l’instant de ton ancien App.jsx.

Tu vas devoir créer chacun d’eux dans src/components/control/ avec le code correspondant
(qu’on a déjà dans ton gros App.jsx d’origine).

Mais au moins maintenant la structure est claire.
*/


export default function ControlPage({
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
  // ---------------------------
  // 1. States locaux
  // ---------------------------

  // filtres
  const [asset, setAsset] = React.useState("All");
  const [broker, setBroker] = React.useState("All");
  const [strategy, setStrategy] = React.useState("All");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  // sous-titre editable
  const [subtitle, setSubtitle] = React.useState(() => {
    try {
      return localStorage.getItem("zpv_subtitle") || t.subtitle_default;
    } catch {
      return t.subtitle_default;
    }
  });
  const [editSub, setEditSub] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!editSub) {
        localStorage.setItem("zpv_subtitle", subtitle);
      }
    } catch {}
  }, [subtitle, editSub, t]);

  // modales
  const [openFlow, setOpenFlow] = React.useState(false);
  const [openTiers, setOpenTiers] = React.useState(false);
  const [openRecap, setOpenRecap] = React.useState(false);
  const [openAbout, setOpenAbout] = React.useState(false);

  // ---------------------------
  // 2. Données dérivées
  // ---------------------------

  // tradesAll vient de App.jsx (démo + imports utilisateur)
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

  const noData = filtered.length === 0;

  // cashflows
  const cashflowsAll = flows;
  const cashflowsInRange = React.useMemo(
    () =>
      cashflowsAll.filter(
        (c) =>
          (!dateFrom || c.date >= dateFrom) &&
          (!dateTo || c.date <= dateTo)
      ),
    [cashflowsAll, dateFrom, dateTo]
  );

  // KPI capital / pnl / dd
  const capitalInitialDisp = React.useMemo(
    () => convert(initialCapitalUSD, "USD", displayCcy),
    [initialCapitalUSD, displayCcy, convert]
  );

  const cashFlowTotal = React.useMemo(
    () =>
      cashflowsInRange.reduce(
        (acc, c) =>
          acc + convert(c.amount, c.ccy || "USD", displayCcy),
        0
      ),
    [cashflowsInRange, displayCcy, convert]
  );

  const pnlFiltered = React.useMemo(
    () =>
      filtered.reduce(
        (acc, t) => acc + convert(t.pnl, t.ccy || "USD", displayCcy),
        0
      ),
    [filtered, displayCcy, convert]
  );

  const capitalBase = capitalInitialDisp + cashFlowTotal;
  const capitalGlobal = capitalBase + pnlFiltered;

  const returnPct = React.useMemo(
    () => (capitalBase > 0 ? (pnlFiltered / capitalBase) * 100 : 0),
    [capitalBase, pnlFiltered]
  );

  // max drawdown %
  const pnlByDate = React.useMemo(() => {
    const m = new Map();
    filtered.forEach((t) => {
      const v = convert(t.pnl, t.ccy || "USD", displayCcy);
      m.set(t.date, (m.get(t.date) || 0) + v);
    });
    return [...m.entries()]
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered, displayCcy, convert]);

  let eq = capitalInitialDisp;
  let peak = eq;
  let maxDrop = 0;
  pnlByDate.forEach((p) => {
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
          convert(Number(r.amount) || 0, r.ccy || "USD", displayCcy),
        0
      ),
    [tiers, displayCcy, convert]
  );

  // reset filtres
  const reset = () => {
    setAsset("All");
    setBroker("All");
    setStrategy("All");
    setDateFrom("");
    setDateTo("");
  };

  // ---------------------------
  // 3. RENDER
  // ---------------------------

  return (
    <div className="control-page">
      {/* Bandeau haut : titre + sous-titre + actions */}
      <div className="card">
        <div className="block-head">
          <div>
            <h1
              className="brand"
              style={{ fontSize: 28, margin: 0 }}
            >
              {t.brand}
            </h1>

            {!editSub ? (
              <p
                className="subtitle cap"
                style={{ marginTop: 6 }}
              >
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

          {/* Actions principales */}
          <div
            className="block-tools"
            style={{
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {/* Import CSV trades */}
            <label className="btn">
              {t.actions?.Import_csv || "Importer CSV"}
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
                    // NOTE: parseCSV/mapMT5Rows ne sont pas définis ici pour l’instant.
                    // On les déplacera plus tard dans un util commun et on les importera.
                    alert(
                      "parseCSV / mapMT5Rows doivent être importés ici depuis un util commun."
                    );
                  };
                  fr.readAsText(f);
                }}
              />
            </label>

            {/* Ajouter Flux */}
            <button className="btn" onClick={() => setOpenFlow(true)}>
              {t.actions?.Add_Flow || "Ajouter un Flux"}
            </button>

            {/* Capital Tiers */}
            <button className="btn" onClick={() => setOpenTiers(true)}>
              {t.actions?.Third_Capital || "Capital Tiers"}
            </button>

            {/* Récap flux */}
            <button className="btn ghost" onClick={() => setOpenRecap(true)}>
              {t.actions?.Recap || "Récap"}
            </button>

            {/* Reset filtres */}
            <button className="btn ghost" onClick={reset}>
              {t.actions?.Reset || "Réinitialiser"}
            </button>

            {/* À propos */}
            <button className="btn ghost" onClick={() => setOpenAbout(true)}>
              {t.actions?.About || "À Propos"}
            </button>

            {/* Devise */}
            <div className="kpi-title cap" style={{ marginLeft: 10 }}>
              Devise
            </div>
            <select
              className="sel"
              style={{ width: 110 }}
              value={displayCcy}
              onChange={(e) => setDisplayCcy(e.target.value)}
            >
              {["USD", "EUR", "CHF"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            {/* Langue */}
            <div className="kpi-title cap" style={{ marginLeft: 10 }}>
              Langue
            </div>
            <select
              className="sel"
              style={{ width: 150 }}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modales inline */}
        <FlowModal
          openHook={[openFlow, setOpenFlow]}
          onSave={(row) => setFlows((p) => p.concat([row]))}
          ccy={displayCcy}
          inline
        />

        <CapitalTiersModal
          openHook={[openTiers, setOpenTiers]}
          onAdd={(row) => setTiers((p) => p.concat([row]))}
          displayCcy={displayCcy}
          inline
        />

        <CashflowsModal
          openHook={[openRecap, setOpenRecap]}
          rows={cashflowsAll}
          inline
        />

        <AboutModal openHook={[openAbout, setOpenAbout]} />
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
                {brokers.map((b) => (
                  <option key={b}>{b}</option>
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
                {strategies.map((s) => (
                  <option key={s}>{s}</option>
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
                style={{
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <div className="kpi-title cap">Au</div>
              <input
                className="sel"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
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
        {/* Courbe d’équité (col-8) */}
        <div className="col-8">
          <EquityBlock
            rows={filtered}
            cashflows={cashflowsAll}
            initial={initialCapitalUSD}
            convert={convert}
            ccy={displayCcy}
          />
        </div>

        {/* Win rate + Ratios (col-4) */}
        <div className="col-4">
          <div className="grid-2">
            <div className="card">
              <div className="block-head">
                <div className="block-title cap">Taux de Réussite</div>
              </div>
              <WinRateBlock rows={filtered} />
            </div>

            <div className="card">
              <div className="block-head">
                <div className="block-title cap">Ratios (Pro)</div>
              </div>
              <RatiosBlock
                rows={filtered}
                convert={convert}
                ccy={displayCcy}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Corrélation & Mapping */}
      <div className="control-section control-grid">
        <div className="col-6">
          <div className="card">
            <div className="block-head">
              <div className="block-title cap">
                Corrélation Entre Stratégies
              </div>
            </div>

            <CorrelationBlock
              rows={filtered}
              convert={convert}
              ccy={displayCcy}
            />
          </div>
        </div>

        <div className="col-6">
          <div className="card">
            <div className="block-head">
              <div className="block-title cap">
                Mapping Stratégie × Broker
              </div>
            </div>

            <MappingTable
              rows={filtered}
              convert={convert}
              ccy={displayCcy}
            />
          </div>
        </div>
      </div>

      {/* Calendrier mensuel */}
      <div className="control-section">
        <CalendarMonthly
          rows={filtered}
          convert={convert}
          ccy={displayCcy}
          startEquity={convert(initialCapitalUSD, "USD", displayCcy)}
        />
      </div>

      {/* Activité */}
      <div className="control-section">
        <div className="card">
          <div className="block-head">
            <div className="block-title cap">Activité</div>
          </div>

          <ActivityBlocks rows={filtered} />
        </div>
      </div>

      {/* Alerte si aucune donnée */}
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
            }}
          >
            Ajuste les filtres ou importe un CSV pour voir les stats.
          </div>
        </div>
      )}
    </div>
  );
}
