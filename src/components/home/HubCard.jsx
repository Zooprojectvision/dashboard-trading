import React from "react";

export default function HubCard({ title, subtitle, onNav, goto }) {
  return (
    <button
      onClick={() => onNav(goto)}
      style={{
        width: "100%",
        textAlign: "left",

        // CARD LOOK
        background:
          "radial-gradient(circle at 0% 0%, rgba(30,40,60,0.6) 0%, rgba(10,11,15,0) 70%) , #0f1115",
        border: "1px solid rgba(106,169,255,0.4)",
        borderRadius: 20,
        padding: "16px 18px",

        // TEXT / LAYOUT
        display: "flex",
        flexDirection: "column",
        gap: 6,

        // INTERACTION
        cursor: "pointer",
        boxShadow:
          "0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(106,169,255,0.15)",
        transition:
          "box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 30px 60px rgba(0,0,0,0.9), 0 0 32px rgba(106,169,255,0.45)";
        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
        e.currentTarget.style.borderColor = "rgba(32,227,214,0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(106,169,255,0.15)";
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.borderColor = "rgba(106,169,255,0.4)";
      }}
    >
      {/* Titre */}
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.2,
          letterSpacing: "0.08em",
          fontWeight: 500,
          color: "#6aa9ff",
          textTransform: "uppercase",
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
