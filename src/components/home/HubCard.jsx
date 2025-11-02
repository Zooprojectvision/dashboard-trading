import React from "react";

export default function HubCard({ title, subtitle, goto, onNav }) {
  return (
    <button
      onClick={() => onNav(goto)}
      className="hub-card"
      style={{
        // bloc visuel de base
        width: "100%",
        textAlign: "left",
        borderRadius: 20,
        padding: 16,
        cursor: "pointer",
        border: "1px solid rgba(106,169,255,0.4)", // halo bleu
        background:
          "radial-gradient(circle at 0% 0%, rgba(20,30,50,0.6) 0%, rgba(10,11,15,0.6) 60%)",
        boxShadow:
          "0 0 20px rgba(106,169,255,0.25), 0 30px 60px rgba(0,0,0,0.8)",
        display: "block",

        // animation hover (on prépare ici, le hover sera en CSS inline JS avec onMouseEnter/onMouseLeave)
        transition:
          "transform 0.18s ease-out, box-shadow 0.18s ease-out, border 0.18s ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.03)";
        e.currentTarget.style.boxShadow =
          "0 0 28px rgba(32,227,214,0.4), 0 40px 80px rgba(0,0,0,0.9)";
        e.currentTarget.style.border = "1px solid rgba(32,227,214,0.6)"; // turquoise
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow =
          "0 0 20px rgba(106,169,255,0.25), 0 30px 60px rgba(0,0,0,0.8)";
        e.currentTarget.style.border =
          "1px solid rgba(106,169,255,0.4)"; // back to bleu
      }}
    >
      {/* Titre */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#6aa9ff",
          marginBottom: 6,
          letterSpacing: "0.05em",
          textTransform: "uppercase", // ← maintenant toujours uppercase
          fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Roboto', 'Segoe UI'",
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
          fontWeight: 400,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Roboto', 'Segoe UI'",
        }}
      >
        {subtitle}
      </div>
    </button>
  );
}
