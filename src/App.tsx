
import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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
import { QueryProvider } from "./providers/QueryProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
    <ErrorBoundary>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryProvider>
          <Router>
            <Toaster />
            <DeviceProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <Index />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                
                <Route path="/devices" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DevicesPage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                
                <Route path="/devices/:id" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DeviceDetailPage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <SettingsPage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                
                <Route path="/test-api" element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <TestApiPage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DeviceProvider>
          </Router>
        </QueryProvider>
      </NextThemesProvider>
    </ErrorBoundary>
  );
}

export default App;
