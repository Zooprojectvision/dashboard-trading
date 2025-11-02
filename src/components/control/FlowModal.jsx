import React from "react";

/* Petite modale générique interne à FlowModal.
   Ici on la redéfinit localement plutôt que d'importer Modal global,
   pour rester autonome. */
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

/* === FlowModal ===
   Formulaire "Ajouter un flux"
   (payout prop, frais challenge, management fee Darwinex, etc.)
*/
export default function FlowModal({ openHook, onSave, ccy, inline = false }) {
  const [open, setOpen] = openHook || [false, () => {}];

  const [flow, setFlow] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    type: "deposit",
    amount: "",
    ccy,
    note: "",
  });

  const types = [
    { value: "deposit", label: "dépôt" },
    { value: "withdrawal", label: "retrait" },
    { value: "prop_payout", label: "payout prop" },
    { value: "prop_fee", label: "frais challenge prop" },
    { value: "darwin_mgmt_fee", label: "darwinex – management fee" },
    { value: "business_expense", label: "charge business" },
    { value: "other_income", label: "autre revenu" },
  ];

  const submit = (e) => {
    e.preventDefault();
    const amt = Number(flow.amount);
    if (!flow.date || !flow.type || !Number.isFinite(amt)) {
      alert("date/type/montant requis");
      return;
    }
    onSave?.({ ...flow, amount: amt });
    setOpen(false);
    setFlow({
      date: new Date().toISOString().slice(0, 10),
      type: "deposit",
      amount: "",
      ccy,
      note: "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Ajouter un flux"
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
          <span>type</span>
          <select
            className="sel"
            value={flow.type}
            onChange={(e) =>
              setFlow((f) => ({ ...f, type: e.target.value }))
            }
          >
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-label">
          <span>date</span>
          <input
            className="sel"
            type="date"
            value={flow.date}
            onChange={(e) =>
              setFlow((f) => ({ ...f, date: e.target.value }))
            }
          />
        </label>

        <label className="form-label">
          <span>devise</span>
          <select
            className="sel"
            value={flow.ccy}
            onChange={(e) =>
              setFlow((f) => ({ ...f, ccy: e.target.value }))
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
            value={flow.amount}
            onChange={(e) =>
              setFlow((f) => ({ ...f, amount: e.target.value }))
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
            value={flow.note}
            onChange={(e) =>
              setFlow((f) => ({ ...f, note: e.target.value }))
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

