import React from "react"
import { APP_VERSION } from "../../version" // ⚠ adapte le chemin si version.js n'est pas encore déplacé

export default function Footer() {
  return (
    <div
      className="footer"
      style={{
        textAlign: "center",
        color: "var(--text)",
        opacity: 0.7,
        fontSize: 12,
        marginTop: 20,
      }}
    >
      Designed &amp; Built by ZooProjectVision V{APP_VERSION} @{" "}
      {new Date().getFullYear()}
    </div>
  )
}

