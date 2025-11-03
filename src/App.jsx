import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomeHubPage from "./pages/HomeHubPage.jsx";
import ControlPage from "./pages/ControlPage.jsx";
import Footer from "./components/common/Footer.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeHubPage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}



