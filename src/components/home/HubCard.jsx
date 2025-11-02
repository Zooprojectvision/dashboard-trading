import React from "react";

export default function HubCard({ title, subtitle, goto, onNav }) {
  // on garde un ref local pour pouvoir remettre les styles au mouseleave
  const baseShadow =
    "0 0 20px rgba(106,169,255,0.25), 0 30px 60px rgba(0,0,0,0.8)";
  const hoverShadow =
    "0 0 28px rgba(32,227,214,0.4), 0 40px 80px rgba(0,0,0,0.9)";

  return (
    <button
      onClick={() => onNav(goto)}
      style={{
        width: "100%",
        textAlign: "left",

        /* --- nouveau look bloc --- */
        borderRadius: 20,
        padding: 16,
        border: "1px solid rgba(106,169,255,0.4)",
        background:
          "radial-gradient(circle at 0% 0%, rgba(20,30,50,0.6) 0%, rgba(10,11,15,0.6) 60%)",
        boxShadow: baseShadow,

        cursor: "pointer",
        display: "block",

        /* animations douces */
        transition:
          "transform 0.18s ease-out, box-shadow 0.18s ease-out, border 0.18s ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.03)";
        e.currentTarget.style.boxShadow = hoverShadow;
        e.currentTarget.style.border =
          "1px solid rgba(32,227,214,0.6)"; // turquoise
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = baseShadow;
        e.currentTarget.style.border =
          "1px solid rgba(106,169,255,0.4)"; // bleu back normal
      }}
    >
      {/* Titre */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#6aa9ff",
          marginBottom: 6,

          /* panneau pro */
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          lineHeight: 1.2,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter','Roboto','Segoe UI'",
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
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter','Roboto','Segoe UI'",
        }}
      >
        {subtitle}
      </div>
    </button>
  );
}
