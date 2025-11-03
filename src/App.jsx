import React from "react";
import { HashRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";

function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ margin: "0 0 8px", color: "#fff" }}>🐾 ZOOPROJECTVISION</h1>
      <p>Accueil ok. Test navigation :</p>
      <div style={{ marginTop: 16 }}>
        <Link to="/control" style={linkStyle}>Aller à Control</Link>
      </div>
    </main>
  );
}

function Control() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ color: "#fff" }}>Control — Rapport</h1>
      <p>Page de test Control.</p>
    </main>
  );
}

const linkStyle = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #2a3142",
  background: "#111318",
  color: "#fff",
  textDecoration: "none"
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/control" element={<Control />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
