import React from "react";

export default function Modal({
  open,
  onClose,
  title,
  actions,
  children,
  inline = false,
}) {
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
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 16,
          minWidth: 320,
          maxWidth: "90vw",
          color: "var(--text)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        }}
      >
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
    </div>
  );
}

