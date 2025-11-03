import React from "react";

export default function App() {
  return (
    <div style={{
      padding: 24,
      margin: 24,
      background: "#111",
      color: "#00FF88",
      border: "3px solid #FF00FF",
      borderRadius: 12,
      fontSize: 20
    }}>
      <h1>🔎 DIAGNOSTIC</h1>
      <p>Si tu vois ce bloc vert fluo, React fonctionne. Le souci venait du Router ou du CSS.</p>
    </div>
  );
}
