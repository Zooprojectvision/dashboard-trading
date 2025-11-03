<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ZOOPROJECTVISION – test</title>
    <style>
      /* on force un fond CLAIR pour vérifier que ce n'est pas le CSS */
      html, body, #root { height: 100%; }
      body { margin: 0; background: #ffffff; color: #111; font-family: system-ui, Arial, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root">🧪 Si tu vois ce texte, React n'est PAS encore monté.</div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
