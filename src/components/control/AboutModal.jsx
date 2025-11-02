import React from "react";
import { APP_VERSION } from "../../version.js";

// on réutilise une mini Modal locale simple
function Modal({ open, onClose, title, children, inline = false }) {
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

          <button className="btn ghost sm" onClick={onClose}>
            fermer
          </button>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
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

          <button className="btn ghost sm" onClick={onClose}>
            fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AboutModal({ openHook, inline = false }) {
  const [open, setOpen] = openHook || [false, () => {}];

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="À Propos"
      inline={inline}
    >
      <div
        style={{
          fontSize: 14,
          color: "var(--text)",
          lineHeight: 1.6,
        }}
      >
        <div className="kpi-title">ZooProjectVision</div>
        <div style={{ marginTop: 6 }}>
          <div>
            Version : <b>V{APP_VERSION}</b>
          </div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Consulte le changelog pour les nouveautés et correctifs.
          </div>
          <div style={{ marginTop: 10 }}>
            <a
              href="/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost sm"
            >
              Ouvrir le changelog
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}

