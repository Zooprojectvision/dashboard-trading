import React from "react";

export default function App() {
  // ----- Navigation -----
  const [view, setView] = React.useState("home"); // "home" | "control" | "compta" | "risk"

  const safeSetView = (next) => {
    const v = String(next || "").toLowerCase();
    if (v === "home" || v === "control" || v === "compta" || v === "risk") {
      setView(v);
    } else {
      setView("home");
    }
  };

  // ----- Petit composant local: une "carte" cliquable -----
  function HubCard({ title, subtitle, goto }) {
    return (
      <button
        onClick={() => safeSetView(goto)}
        style={{
          width: "100%",
          textAlign: "left",
          border: "1px solid #2a2f3a",
          background: "#111318",
          borderRadius: 16,
          padding: 16,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#6aa9ff", // bleu
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.4,
            color: "#c5ccd3",
            opacity: 0.9,
          }}
        >
          {subtitle}
        </div>
      </button>
    );
  }

  // ----- Page d'accueil locale -----
  function HomeScreen() {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "#c5ccd3",
        }}
      >
        {/* Titre principal */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#ffffff",
            margin: 0,
            textAlign: "center",
          }}
        >
          ZooProjectVision
        </h1>

        {/* Sous-titre */}
        <p
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.4,
            color: "#c5ccd3",
            opacity: 0.9,
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          Le tableau de bord de performance trading Edouard & Michel Jimenez
        </p>

        {/* Grille des cartes */}
        <div
          style={{
            marginTop: 24,
            width: "100%",
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <HubCard
            title="Centre de Contrôle"
            subtitle="Vue complète: filtres, equity, corrélation, calendrier, activité."
            goto="control"
          />

          <HubCard
            title="Comptabilité d’Entreprise"
            subtitle="Suivi des flux (payouts, frais, dépôts), catégories et exports."
            goto="compta"
          />

          <HubCard
            title="Gestion du Risque"
            subtitle="Seuils, limites et recommandations d’ajustement."
            goto="risk"
          />

          <div
            style={{
              border: "1px solid #2a2f3a",
              background: "#111318",
              borderRadius: 16,
              padding: 16,
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#6aa9ff",
                  marginBottom: 6,
                }}
              >
                Darwin VYU
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: "#c5ccd3",
                  opacity: 0.9,
                  marginBottom: 12,
                }}
              >
                Performance live du Darwin.
              </div>
            </div>
            <div
              style={{
                background: "#0f1115",
                borderRadius: 12,
                border: "1px solid #2a2f3a",
                padding: 12,
                textAlign: "center",
                fontSize: 12,
                color: "#c5ccd3",
              }}
            >
              {/* Ici normalement <img ... /> venant de Darwinex */}
              <span style={{ opacity: 0.7 }}>
                [Widget Darwinex intégré ici]
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----- Header interne pour les pages autres que home -----
  function InternalHeader() {
    return (
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #2a2f3a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#0a0b0f",
        }}
      >
        <button
          onClick={() => safeSetView("home")}
          style={{
            background: "transparent",
            border: "1px solid #2a2f3a",
            color: "#c5ccd3",
            fontSize: 13,
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          ← Accueil
        </button>

        <div
          style={{
            fontSize: 12,
            color: "#c5ccd3",
            opacity: 0.8,
          }}
        >
          {view === "control"
            ? "Centre de contrôle"
            : view === "compta"
            ? "Comptabilité entreprise"
            : "Gestion du risque"}
        </div>
      </div>
    );
  }

  // ----- Contenu page interne -----
  function PageStub({ title, children }) {
    return (
      <div
        style={{
          padding: 24,
          maxWidth: 1200,
          margin: "0 auto",
          color: "#c5ccd3",
        }}
      >
        <div
          style={{
            background: "#111318",
            border: "1px solid #2a2f3a",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 1.4,
              opacity: 0.8,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ----- Footer local -----
  function LocalFooter() {
    return (
      <div
        style={{
          textAlign: "center",
          color: "#c5ccd3",
          opacity: 0.6,
          fontSize: 12,
          marginTop: 40,
          paddingBottom: 40,
        }}
      >
        Designed &amp; Built by ZooProjectVision V5.1.1 @{" "}
        {new Date().getFullYear()}
      </div>
    );
  }

  // ----- Rendu global -----
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0b0f", // fond sombre
        color: "#c5ccd3",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {view === "home" ? (
        <>
          <HomeScreen />
          <LocalFooter />
        </>
      ) : (
        <>
          <InternalHeader />

          {view === "control" && (
            <>
              <PageStub title="Centre de contrôle">
                Contenu trading / dashboard (équity, PnL, corrélation...) sera
                réinjecté ici.
              </PageStub>
              <LocalFooter />
            </>
          )}

          {view === "compta" && (
            <>
              <PageStub title="Comptabilité entreprise">
                Récap flux, revenus, charges, exports CSV.
              </PageStub>
              <LocalFooter />
            </>
          )}

          {view === "risk" && (
            <>
              <PageStub title="Analyse de risque">
                Seuils, limites, recommandations d’ajustement.
              </PageStub>
              <LocalFooter />
            </>
          )}
        </>
      )}
    </div>
  );
}
