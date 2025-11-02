import React from "react";

export default function HubCard({ title, subtitle, onClick }) {
  return (
    <button
      className="card"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 18,
        border: "1px solid var(--border)",
        borderRadius: 16,
        width: "100%",
        cursor: "pointer",
        backgroundColor: "var(--panel)",
      }}
    >
      <div
        className="kpi-title"
        style={{
          color: "var(--white)",
          fontWeight: 500,
          fontSize: 14,
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      <div
        className="kpi-sub"
        style={{
          color: "var(--text)",
          opacity: 0.85,
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        {subtitle}
      </div>
    </button>
  );
}
