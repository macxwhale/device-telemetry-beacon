import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import DevicesPage from "./pages/DevicesPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import TestApiPage from "./pages/TestApiPage";
import { DeviceProvider } from "./contexts/DeviceContext";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider as NextThemesProvider } from "next-themes";

function App() {
  // Check for JWT token expiry or removal
  useEffect(() => {
    const checkLoggedIn = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!isLoggedIn) {
        // User is not logged in, will be handled by ProtectedRoute
        return;
      }
    };
    
    // Check on initial load
    checkLoggedIn();
    
    // Set up storage event listener to handle logout in other tabs
    window.addEventListener("storage", (event) => {
      if (event.key === "isLoggedIn" && event.newValue !== "true") {
        window.location.href = "/login";
      }
    });
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <Toaster />
        <DeviceProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            
            <Route path="/devices" element={
              <ProtectedRoute>
                <DevicesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/devices/:id" element={
              <ProtectedRoute>
                <DeviceDetailPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/test-api" element={
              <ProtectedRoute>
                <TestApiPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DeviceProvider>
      </Router>
    </NextThemesProvider>
  );
}

export default App;
