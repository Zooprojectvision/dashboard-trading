import React from "react";

export default function Footer() {
  return (
    <footer style={{
      marginTop: 32,
      padding: "16px 24px",
      borderTop: "1px solid #1a1f2a",
      opacity: 0.8
    }}>
      <small>© {new Date().getFullYear()} — ZOOPROJECTVISION</small>
    </footer>
  );
}
