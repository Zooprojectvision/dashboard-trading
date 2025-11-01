import React from "react";
import Modal from "./Modal.jsx";

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
            return /[",;\n]/.test(s)
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashflows_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
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
      <table className="table" style={{ width: "100%", fontSize: 13 }}>
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
                <span
                  className="val"
                  style={{
                    color:
                      Number(r.amount) < 0
                        ? "var(--pink)"
                        : "var(--text)",
                  }}
                >
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
                style={{ textAlign: "center", opacity: 0.8 }}
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

