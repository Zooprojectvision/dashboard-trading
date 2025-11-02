import React from "react";

// mini Modal inline identique (on duplique pour être autonome)
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

export default function CashflowsModal({ openHook, rows, inline = false }) {
  const [open, setOpen] = openHook || [false, () => {}];

  const exportCSV = () => {
    const headers = ["Date", "Type", "Montant", "Devise", "Note"];
    const lines = rows.map((c) => [
      c.date,
      c.type,
      c.amount,
      c.ccy || "USD",
      c.note || "",
    ]);
    const csv = [headers, ...lines]
      .map((r) =>
        r
          .map((x) => {
            const s = String(x ?? "");
            return /[\",;\n]/.test(s)
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cashflows_" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Cashflows (récapitulatif)"
      actions={
        <button className="btn ghost sm" onClick={exportCSV}>
          exporter
        </button>
      }
      inline={inline}
    >
      <table className="table">
        <thead>
          <tr>
            <th>date</th>
            <th>type</th>
            <th style={{ textAlign: "right" }}>montant</th>
            <th>devise</th>
            <th>note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.type}</td>
              <td style={{ textAlign: "right" }}>
                <span className="val">
                  {Number(r.amount).toFixed(2)}
                </span>
              </td>
              <td>{r.ccy || "USD"}</td>
              <td>{r.note || ""}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td
                colSpan="5"
                style={{
                  textAlign: "center",
                  opacity: 0.8,
                }}
              >
                aucun flux
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Modal>
  );
}

