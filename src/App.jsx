import React from "react";
// Tes composants existants (ne pas modifier les chemins si tu les as déjà créés)
import HomeHub from "./components/home/HomeHub.jsx";
import Footer from "./components/common/Footer.jsx";

export default function App() {
  // Etat de navigation
  const [view, setView] = React.useState("home"); // 'home' | 'control' | 'compta' | 'risk'

  // Setter sécurisé pour éviter les valeurs inattendues
  const safeSetView = React.useCallback((next) => {
    if (!next) return;
    const clean = String(next).trim().toLowerCase();
    if (clean === "home")   return setView("home");
    if (clean === "control")return setView("control");
    if (clean === "compta") return setView("compta");
    if (clean === "risk")   return setView("risk");
    // fallback
    setView("home");
  }, []);

  // Titre lisible selon la vue
  const title =
    view === "control" ? "Centre de contrôle" :
    view === "compta"  ? "Comptabilité entreprise" :
    view === "risk"    ? "Gestion du risque" :
    "";

  return (
    <div className="wrap">
      {view === "home" ? (
        // PAGE D'ACCUEIL
        <HomeHub setView={safeSetView} />
      ) : (
        // PAGES INTERNES (header + contenu)
        <>
          <div
            className="header"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <button className="btn ghost" onClick={() => safeSetView("home")}>← Accueil</button>
            <div style={{ opacity: 0.8, fontSize: 12 }}>{title}</div>
          </div>

          {/* Contenu provisoire pour chaque page (on remettra tes vrais blocs ensuite) */}
          {view === "control" && (
            <div className="page-outer">
              <div className="page-content">
                <div className="card" style={{ padding: 16 }}>
                  <div className="kpi-title">Centre de contrôle</div>
                  <p style={{ marginTop: 8, opacity: .8 }}>
                    Contenu temporaire (dashboard). On réintégrera tes blocs Equity / KPIs / Corrélation ici.
                  </p>
                </div>
              </div>
            </div>
          )}

          {view === "compta" && (
            <div className="page-outer">
              <div className="page-content">
                <div className="card" style={{ padding: 16 }}>
                  <div className="kpi-title">Vue Comptable</div>
                  <p style={{ marginTop: 8, opacity: .8 }}>
                    À venir… (récap flux, revenus, charges, exports)
                  </p>
                </div>
              </div>
            </div>
          )}

          {view === "risk" && (
            <div className="page-outer">
              <div className="page-content">
                <div className="card" style={{ padding: 16 }}>
                  <div className="kpi-title">Analyse de Risque</div>
                  <p style={{ marginTop: 8, opacity: .8 }}>
                    À venir… (seuils, verdicts, reco d’ajustement)
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer global */}
      <Footer year={new Date().getFullYear()} />
    </div>
  );
}
