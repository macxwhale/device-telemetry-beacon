
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import DevicesPage from "./pages/DevicesPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import TestApiPage from "./pages/TestApiPage";
import { DeviceProvider } from "./contexts/DeviceContext";

function App() {
  return (
    <Router>
      <Toaster />
      <DeviceProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/devices/:id" element={<DeviceDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/test-api" element={<TestApiPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DeviceProvider>
    </Router>
  );
}

export default App;
