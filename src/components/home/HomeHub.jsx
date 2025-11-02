import React from "react";

export default function HomeHub({ setView, t, subtitle }) {
  console.log(">>> RENDER HomeHub VERSION TEST 9 <<<"); // DOIT apparaître dans la console du navigateur

  function CardBlock({ title, subtitle, goto }) {
    const [hover, setHover] = React.useState(false);

    return (
      <button
        onClick={() => setView(goto)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: "100%",
          textAlign: "left",
          borderRadius: 20,
          padding: 16,
          cursor: "pointer",

          background: hover
            ? "radial-gradient(circle at 0% 0%, rgba(32,227,214,0.12) 0%, rgba(10,11,15,0.8) 60%)"
            : "radial-gradient(circle at 0% 0%, rgba(106,169,255,0.08) 0%, rgba(10,11,15,0.6) 60%)",

          border: hover
            ? "1px solid rgba(32,227,214,0.8)"
            : "1px solid rgba(106,169,255,0.4)",

          boxShadow: hover
            ? "0 0 12px rgba(32,227,214,0.6), 0 30px 60px rgba(0,0,0,0.9)"
            : "0 0 20px rgba(106,169,255,0.25), 0 30px 60px rgba(0,0,0,0.8)",

          transform: hover ? "scale(1.03)" : "scale(1)",
          transition:
            "all 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s",
        }}
      >
        {/* Titre: en majuscules forcées ici */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: 6,
            color: hover
              ? "var(--green, #20e3d6)"
              : "var(--accent, #6aa9ff)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </div>

        {/* Sous-texte */}
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

  return (
    <div
      className="home-wrap"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px 16px 80px",
        color: "var(--text, #c5ccd3)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "var(--white,#fff)",
              lineHeight: 1.1,
            }}
          >
            {t?.brand || "ZooProjectVision"}
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.8,
              color: "var(--text,#c5ccd3)",
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            {subtitle || "Monitoring global multi-prop / multi-stratégies"}
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
            fontSize: 12,
            lineHeight: 1.4,
            minWidth: 160,
            color: "var(--text,#c5ccd3)",
          }}
        >
          <div>ZooProjectVision • v5.1.1 • 2025</div>
          <div style={{ opacity: 0.6 }}>
            Designed & Built by ZooProjectVision
          </div>
        </div>
      </div>

      {/* GRID des 4 blocs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <CardBlock
          title="Centre de Contrôle"
          subtitle="Vue complète: filtres, equity, corrélation, calendrier, activité."
          goto="control"
        />

        <CardBlock
          title="Comptabilité d’Entreprise"
          subtitle="Suivi des flux (payouts, frais, dépôts), catégories et exports."
          goto="compta"
        />

        <CardBlock
          title="Gestion du Risque"
          subtitle="Seuils, limites et recommandations d’ajustement."
          goto="risk"
        />

        <CardBlock
          title="Darwin VYU"
          subtitle="Performance live du Darwin. [Widget Darwinex intégré ici]"
          goto="darwin"
        />
      </div>

      {/* FOOTER LOCAL */}
      <div
        style={{
          textAlign: "center",
          fontSize: 12,
          opacity: 0.4,
          color: "var(--text,#c5ccd3)",
          marginTop: 40,
        }}
      >
        Designed & Built by ZooProjectVision V5.1.1 @ 2025
      </div>
    </div>
  );
}
