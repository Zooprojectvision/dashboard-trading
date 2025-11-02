import React from "react";

export default function PropFirmsPage() {
  return (
    <div className="page-outer">
      <div className="page-content">
        <div className="card" style={{ padding: 16 }}>
          <div className="block-head">
            <div className="block-title cap">Prop Firms</div>
          </div>

          <p style={{ marginTop: 8, opacity: 0.8, fontSize: 14, lineHeight: 1.5 }}>
            • Comptes prop actifs (FTMO, etc.).<br/>
            • Payouts déjà encaissés.<br/>
            • Frais de challenge payés (coûts d’acquisition).<br/>
            • Reste dans l’entreprise vs retiré perso vs réinjecté dans le capital propre.<br/>
          </p>
        </div>
      </div>
    </div>
  );
}

