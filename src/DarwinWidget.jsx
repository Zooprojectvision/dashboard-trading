import React from "react";

export default function DarwinWidget() {
  return (
    <div
      style={{
        backgroundColor: "var(--panel, #111318)",
        border: "1px solid var(--border, #1f2937)",
        borderRadius: "16px",
        padding: "16px",
        maxWidth: "360px",
        width: "100%",
        color: "var(--text, #c5ccd3)",
        fontFamily: "inherit",
        textAlign: "center",
      }}
    >
      {/* Titre du bloc */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--white, #ffffff)",
          marginBottom: "12px",
        }}
      >
        Notre Darwin en Gestion
      </div>

      {/* Le widget Darwinex que tu m'as donné */}
      <a
        href="https://www.darwinex.com/invest/VYU?utm_source=WidgetDarwin&utm_medium=Referral&utm_campaign=WidgetChart&utm_content=fxzooinvest"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block" }}
      >
        <img
          src="https://prodx-widgets.s3-eu-west-1.amazonaws.com/VYU.5.3-widgets-darwin-chart-darwin-all-bg-darkest-l-fr.png"
          alt="VYU"
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "12px",
            display: "block",
          }}
        />
      </a>

      {/* Légende / CTA */}
      <div
        style={{
          fontSize: "12px",
          lineHeight: 1.4,
          opacity: 0.8,
          marginTop: "10px",
        }}
      >
        Accès investisseur Darwinex (VYU)
      </div>
    </div>
  );
}
