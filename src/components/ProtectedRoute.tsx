
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsAuthenticated(isLoggedIn);
    };
    
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    // Still checking auth status
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
