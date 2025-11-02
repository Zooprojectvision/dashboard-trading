import React from "react";

// même logique de Modal que dans FlowModal
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

export default function CapitalTiersModal({
  openHook,
  onAdd,
  displayCcy,
  inline = false,
}) {
  const [open, setOpen] = openHook || [false, () => {}];

  const [form, setForm] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    source: "Prop firm",
    amount: "",
    ccy: displayCcy,
    note: "",
  });

  const sources = [
    "Prop firm",
    "Darwinex invest",
    "Axi Select",
    "Investisseur",
    "Autre",
  ];

  const submit = (e) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!form.date || !form.source || !Number.isFinite(amt)) {
      alert("date/source/montant requis");
      return;
    }
    onAdd?.({ ...form, amount: amt });
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Capital tiers"
      inline={inline}
    >
      <form
        onSubmit={submit}
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(2,1fr)",
        }}
      >
        <label className="form-label">
          <span>source</span>
          <select
            className="sel"
            value={form.source}
            onChange={(e) =>
              setForm((f) => ({ ...f, source: e.target.value }))
            }
          >
            {sources.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="form-label">
          <span>date</span>
          <input
            className="sel"
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm((f) => ({ ...f, date: e.target.value }))
            }
          />
        </label>

        <label className="form-label">
          <span>devise</span>
          <select
            className="sel"
            value={form.ccy}
            onChange={(e) =>
              setForm((f) => ({ ...f, ccy: e.target.value }))
            }
          >
            {["USD", "EUR", "CHF"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="form-label">
          <span>montant</span>
          <input
            className="sel"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: e.target.value }))
            }
          />
        </label>

        <label
          className="form-label"
          style={{ gridColumn: "1 / -1" }}
        >
          <span>note</span>
          <input
            className="sel"
            placeholder="optionnel"
            value={form.note}
            onChange={(e) =>
              setForm((f) => ({ ...f, note: e.target.value }))
            }
          />
        </label>

        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            className="btn ghost"
            onClick={() => setOpen(false)}
          >
            annuler
          </button>
          <button type="submit" className="btn">
            enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}

