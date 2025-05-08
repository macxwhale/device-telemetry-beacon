
import { FC } from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { LayoutDashboard, Smartphone, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const TelemetrySidebar: FC = () => {
  const location = useLocation();
  
  return (
    <Sidebar>
      <SidebarHeader className="py-4">
        <Link to="/" className="flex items-center px-4 gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
            <Smartphone size={20} />
          </div>
          <div className="font-semibold text-lg">Device Telemetry</div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/" 
                    className={location.pathname === "/" ? "bg-sidebar-accent" : ""}
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/devices" 
                    className={location.pathname === "/devices" || location.pathname.startsWith("/device/") ? "bg-sidebar-accent" : ""}
                  >
                    <Smartphone size={18} />
                    <span>Devices</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link 
                    to="/settings" 
                    className={location.pathname === "/settings" ? "bg-sidebar-accent" : ""}
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 text-sm text-sidebar-foreground/70">
        <p>v1.0.0</p>
      </SidebarFooter>
    </Sidebar>
  );
};
