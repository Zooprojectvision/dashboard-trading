import React from "react";

export default function HomeHubPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: "0 0 8px" }}>🏠 Home Hub</h1>
      <p>Projet neuf opérationnel. On va réintégrer tes pages étape par étape.</p>

      <div style={{
        marginTop: 24,
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
      }}>
        <a href="/control" style={cardStyle}>Aller à Control</a>
        <a href="/trading" style={cardStyle}>Aller à Trading</a>
        <a href="/darwinex" style={cardStyle}>Aller à Darwinex</a>
        <a href="/compta" style={cardStyle}>Aller à Compta</a>
        <a href="/prop" style={cardStyle}>Aller à Prop Firms</a>
      </div>
    </main>
  );
}

const cardStyle = {
  display: "block",
  padding: 16,
  borderRadius: 12,
  border: "1px solid #1a1f2a",
  background: "#111318",
  color: "inherit",
  textDecoration: "none",
  textAlign: "center"
};

