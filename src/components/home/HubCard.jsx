import React from "react";

export default function HubCard({ title, subtitle, goto, onNav }) {
  const [hover, setHover] = React.useState(false);

  return (
    <button
      onClick={() => onNav(goto)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 20,
        padding: 16,
        cursor: "pointer",

        // background (radial avec halo bleu léger)
        background: hover
          ? "radial-gradient(circle at 0% 0%, rgba(32,227,214,0.12) 0%, rgba(10,11,15,0.8) 60%)"
          : "radial-gradient(circle at 0% 0%, rgba(106,169,255,0.08) 0%, rgba(10,11,15,0.6) 60%)",

        // bordure fine bleu clair
        border: hover
          ? "1px solid rgba(32,227,214,0.8)"
          : "1px solid rgba(106,169,255,0.4)",

        // ombres / glow
        boxShadow: hover
          ? "0 0 12px rgba(32,227,214,0.6), 0 30px 60px rgba(0,0,0,0.9)"
          : "0 0 20px rgba(106,169,255,0.25), 0 30px 60px rgba(0,0,0,0.8)",

        // scale léger au hover
        transform: hover ? "scale(1.03)" : "scale(1)",
        transition:
          "all 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s",
      }}
    >
      {/* TITRE */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.2,
          marginBottom: 6,
          color: hover ? "var(--green, #20e3d6)" : "var(--accent, #6aa9ff)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </div>

      {/* DESCRIPTION */}
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.4,
          color: "#c5ccd3",
          opacity: 0.9,
          textAlign: "left",
        }}
      >
        {subtitle}
      </div>
    </button>
  );
}
