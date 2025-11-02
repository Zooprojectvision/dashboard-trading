import React from "react";
import DarwinWidget from "../components/home/DarwinWidget.jsx";

export default function DarwinexPage() {
  return (
    <div className="page-outer">
      <div className="page-content" style={{ display: "grid", gap: 16 }}>
        {/* Bloc résumé business Darwinex */}
        <div className="card" style={{ padding: 16 }}>
          <div className="block-head">
            <div className="block-title cap">Gestion pour Tiers (Darwinex / Axi)</div>
          </div>
          <p style={{ marginTop: 8, opacity: 0.8, fontSize: 14, lineHeight: 1.5 }}>
            • Capital alloué par des tiers (copy trading / incubation).<br/>
            • Performance réalisée pour eux.<br/>
            • Management fees perçus (%, montants).<br/>
            • Durée d’allocation / conditions.<br/>
          </p>
        </div>

        {/* Bloc widget Darwinex en mode vitrine */}
        <div
          className="card"
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div className="block-head" style={{ marginBottom: 12 }}>
            <div className="block-title cap">Aperçu Public (Darwin)</div>
          </div>

          <DarwinWidget />

          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.6, lineHeight: 1.4 }}>
            Indicateur marketing / crédibilité pour investisseurs potentiels.
          </p>
        </div>
      </div>
    </div>
  );
}

