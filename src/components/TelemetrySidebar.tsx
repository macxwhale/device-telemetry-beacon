
import { useState } from "react";
import { Activity, BarChart3, LogOut, MenuIcon, PlayCircle, Settings, Smartphone, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSidebar } from "./ui/sidebar";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SidebarLink({ to, icon, children }: SidebarLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center space-x-3 rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary hover:text-foreground",
        isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

interface MobileMenuToggleProps {
  open: boolean;
  onClick: () => void;
}

function MobileMenuToggle({ open, onClick }: MobileMenuToggleProps) {
  return (
    <button
      className="absolute right-4 top-4 text-gray-600 lg:hidden"
      onClick={onClick}
    >
      {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
    </button>
  );
}

export function TelemetrySidebar() {
  const { toggleSidebar, openMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };
  
  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform",
      openMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="px-3 py-4">
          <MobileMenuToggle 
            open={openMobile} 
            onClick={() => setOpenMobile(!openMobile)}
          />
          <div className="mb-10 flex items-center rounded-lg px-3 py-2">
            <Activity className="mr-2 h-6 w-6" />
            <span className="text-lg font-semibold">Telemetry</span>
          </div>
          
          {user && (
            <div className="mb-6 px-4 py-2">
              <p className="text-sm font-medium text-muted-foreground">Signed in as:</p>
              <p className="text-sm font-semibold truncate">{user.email}</p>
            </div>
          )}
          
          <nav className="space-y-8">
            <div>
              <h4 className="mb-2 px-4 text-sm font-semibold">Dashboard</h4>
              <SidebarLink to="/" icon={<BarChart3 className="h-5 w-5" />}>
                Overview
              </SidebarLink>
              <SidebarLink to="/devices" icon={<Smartphone className="h-5 w-5" />}>
                Devices
              </SidebarLink>
              <SidebarLink to="/test-api" icon={<PlayCircle className="h-5 w-5" />}>
                Test API
              </SidebarLink>
            </div>
            
            <div>
              <h4 className="mb-2 px-4 text-sm font-semibold">Settings</h4>
              <SidebarLink to="/settings" icon={<Settings className="h-5 w-5" />}>
                Preferences
              </SidebarLink>
            </div>
            
            <div className="mt-auto">
              <button 
                onClick={handleLogout}
                className="flex w-full items-center space-x-3 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}
