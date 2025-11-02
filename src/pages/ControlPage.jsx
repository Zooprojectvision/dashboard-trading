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

/* =========================================================
   Petits helpers visuels / num
   ========================================================= */

const styleNum = (v) => ({
  color: Number(v) < 0 ? "var(--pink)" : "var(--text)",
});

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

/* =========================================================
   SOUS-COMPONENTS UTILISÉS DANS LA PAGE
   (EquityBlock, WinRateBlock, RatiosBlock, CorrelationBlock,
    MappingTable, ActivityBlocks, CalendarMonthly,
    FlowModal, CapitalTiersModal, CashflowsModal, AboutModal)
   ========================================================= */

/* -------- Modale générique -------- */
function Modal({ open, onClose, title, actions, children, inline = false }) {
  if (!open) return null;

  if (inline) {
    return (
      <div className="modal-card" style={{ marginTop: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div className="kpi-title" style={{ fontSize: 16 }}>
            {title}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {actions}
            <button className="btn ghost sm" onClick={onClose}>
              fermer
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div className="kpi-title" style={{ fontSize: 16 }}>
            {title}
          </div>
          <div style={{ display: "flex", gap: 
