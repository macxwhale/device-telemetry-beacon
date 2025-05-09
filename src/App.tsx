import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import DevicesPage from "./pages/Devices";
import DeviceDetailPage from "./pages/DeviceDetail";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import TestApiPage from "./pages/TestApiPage";

function App() {
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/devices/:id" element={<DeviceDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/test-api" element={<TestApiPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
