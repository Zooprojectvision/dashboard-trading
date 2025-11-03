import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomeHubPage from "./pages/HomeHubPage.jsx";
import Footer from "./components/common/Footer.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeHubPage />} />
        {/* Les routes suivantes seront branchées quand on ajoutera les pages */}
        <Route path="/control" element={<div style={{padding:24}}>Control (à venir)</div>} />
        <Route path="/trading" element={<div style={{padding:24}}>Trading (à venir)</div>} />
        <Route path="/darwinex" element={<div style={{padding:24}}>Darwinex (à venir)</div>} />
        <Route path="/compta" element={<div style={{padding:24}}>Compta (à venir)</div>} />
        <Route path="/prop" element={<div style={{padding:24}}>Prop Firms (à venir)</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

