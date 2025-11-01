
import React from "react";
import EquityBlock from "../components/control/EquityBlock.jsx";
import WinRateBlock from "../components/control/WinRateBlock.jsx";
import RatiosBlock from "../components/control/RatiosBlock.jsx";
import CorrelationBlock from "../components/control/CorrelationBlock.jsx";
import MappingTable from "../components/control/MappingTable.jsx";
import CalendarMonthly from "../components/control/CalendarMonthly.jsx";
import ActivityBlocks from "../components/control/ActivityBlocks.jsx";
import FlowModal from "../components/modals/FlowModal.jsx";
import CapitalTiersModal from "../components/modals/CapitalTiersModal.jsx";
import CashflowsModal from "../components/modals/CashflowsModal.jsx";
import AboutModal from "../components/modals/AboutModal.jsx";

/*
  ControlPage est purement visuel : pas de logique business ici.
  Tout ce dont il a besoin lui est donné en props par App.jsx.
*/

export default function ControlPage({
  t,

  // sous-titre éditable
  subtitle,
  editSub,
  onStartEditSubtitle,
  onChangeSubtitle,
  onConfirmSubtitle,

  // actions header
  onImportCSV, // file input handler
  onOpenFlow,
  onOpenTiers,
  onOpenRecap,
  onOpenAbout,
  onReset,

  // états modales (ouverture/fermeture) + setters (passés depuis App)
  openFlow,
  setOpenFlow,
  openTiers,
  setOpenTiers,
  openRecap,
  setOpenRecap,
  openAbout,
  setOpenAbout,

  // données pour les modales
  allCashflows,
  onSaveFlow,
  onAddTier,
  displayCcy,

  // sélecteurs devise / langue
  displayCcyValue,
  onChangeDisplayCcy,
  lang,
  onChangeLang,
  locales,

  // filtres et setters
  asset,
  broker,
  strategy,
  dateFrom,
  dateTo,
  assets,
  brokers,
  strategies,
  setAsset,
  setBroker,
  setStrategy,
  setDateFrom,
  setDateTo,

  // KPIs calculés
  capitalInitialDisp,
  cashFlowTotal,
  pnlFiltered,
  capitalGlobal,
  returnPct,
  maxDDPct,
  maxDDAbs,
  filteredTrades,
  tiersTotal,

  // blocs analytiques
  convert,
  displayCcyForBlocks,
  initialCapitalUSD,
  cashflowsAllForBlocks,

  // flags
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

            {editSub ? (
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
                  onChange={(e) => onChangeSubtitle(e.target.value)}
                />
                <button className="btn sm" onClick={onConfirmSubtitle}>
                  OK
                </button>
              </div>
            ) : (
              <p className="subtitle cap" style={{ marginTop: 6 }}>
                {subtitle}
                <button
                  className="edit-pencil"
                  onClick={onStartEditSubtitle}
                >
                  ✏️
                </button>
              </p>
            )}
          </div>

          <div
            className="block-tools"
            style={{ flexWrap: "wrap", justifyContent: "flex-end" }}
          >
            {/* Import CSV */}
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
                onChange={onImportCSV}
              />
            </label>

            {/* Flux financiers */}
            <button className="btn" onClick={onOpenFlow}>
              {t.actions?.Add_Flow || "Ajouter un Flux"}
            </button>

            {/* Capital Tiers */}
            <button className="btn" onClick={onOpenTiers}>
              {t.actions?.Third_Capital || "Capital Tiers"}
            </button>

            {/* Récap cashflows */}
            <button className="btn ghost" onClick={onOpenRecap}>
              {t.actions?.Recap || "Récap"}
            </button>

            {/* Reset filtres */}
            <button className="btn ghost" onClick={onReset}>
              {t.actions?.Reset || "Réinitialiser"}
            </button>

            {/* À propos */}
            <button className="btn ghost" onClick={onOpenAbout}>
              {t.actions?.About || "À Propos"}
            </button>

            {/* Devise */}
            <div
              className="kpi-title cap"
              style={{ marginLeft: 10 }}
            >
              Devise
            </div>
            <select
              className="sel"
              style={{ width: 110 }}
              value={displayCcyValue}
              onChange={(e) => onChangeDisplayCcy(e.target.value)}
            >
              {["USD", "EUR", "CHF"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            {/* Langue */}
            <div
              className="kpi-title cap"
              style={{ marginLeft: 10 }}
            >
              Langue
            </div>
            <select
              className="sel"
              style={{ width: 150 }}
              value={lang}
              onChange={(e) => onChangeLang(e.target.value)}
            >
              {locales.map((l) => (
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
          onSave={onSaveFlow}
          ccy={displayCcy}
          inline
        />

        <CapitalTiersModal
          openHook={[openTiers, setOpenTiers]}
          onAdd={onAddTier}
          displayCcy={displayCcy}
          inline
        />

        <CashflowsModal
          openHook={[openRecap, setOpenRecap]}
          rows={allCashflows}
          inline
        />

        <AboutModal
          openHook={[openAbout, setOpenAbout]}
        />
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
            <div className="val val-main">{capitalInitialDisp}</div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Cashflow</div>
            <div
              className={`val ${cashFlowTotal < 0 ? "neg" : "pos"}`}
            >
              {cashFlowTotal}
            </div>
          </div>

          <div className="card">
            <div className="kpi-title cap">PnL (Filtré)</div>
            <div
              className={`val ${pnlFiltered < 0 ? "neg" : "pos"}`}
            >
              {pnlFiltered}
            </div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Capital Total</div>
            <div
              className={`val ${pnlFiltered < 0 ? "neg" : "pos"}`}
            >
              {capitalGlobal}
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
            <div className="val val-main">{maxDDAbs}</div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Jours Actifs</div>
            <div className="val val-main">
              {new Set(filteredTrades.map((t) => t.date)).size}
            </div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Capital Tiers</div>
            <div className="val val-main">{tiersTotal}</div>
          </div>

          <div className="card">
            <div className="kpi-title cap">Trades Total</div>
            <div className="val val-main">
              {filteredTrades.length}
            </div>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="control-section control-grid">
        {/* Équité (col-8) */}
        <div className="col-8">
          <EquityBlock
            rows={filteredTrades}
            cashflows={cashflowsAllForBlocks}
            initial={initialCapitalUSD}
            convert={convert}
            ccy={displayCcyForBlocks}
          />
        </div>

        {/* Win rate + Ratios (col-4) */}
        <div className="col-4">
          <div className="grid-2">
            <div className="card">
              <WinRateBlock rows={filteredTrades} />
            </div>

            <div className="card">
              <RatiosBlock
                rows={filteredTrades}
                convert={convert}
                ccy={displayCcyForBlocks}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Corrélation & Mapping */}
      <div className="control-section control-grid">
        <div className="col-6">
          <div className="card">
            <CorrelationBlock
              rows={filteredTrades}
              convert={convert}
              ccy={displayCcyForBlocks}
            />
          </div>
        </div>

        <div className="col-6">
          <div className="card">
            <MappingTable
              rows={filteredTrades}
              convert={convert}
              ccy={displayCcyForBlocks}
            />
          </div>
        </div>
      </div>

      {/* Calendrier mensuel */}
      <div className="control-section">
        <CalendarMonthly
          rows={filteredTrades}
          convert={convert}
          ccy={displayCcyForBlocks}
          startEquity={convert(
            initialCapitalUSD,
            "USD",
            displayCcyForBlocks
          )}
        />
      </div>

      {/* Activité */}
      <div className="control-section">
        <div className="card">
          <div className="block-head">
            <div className="block-title cap">Activité</div>
          </div>
          <ActivityBlocks rows={filteredTrades} />
        </div>
      </div>

      {/* Message si pas de données */}
      {noData && (
        <div
          className="card halo-warn"
          style={{
            marginTop: 20,
            textAlign: "center",
          }}
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
