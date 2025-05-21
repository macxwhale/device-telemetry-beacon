
import { FC, ReactNode } from "react";
import { TelemetrySidebar } from "./TelemetrySidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <TelemetrySidebar />
            <main className="flex-1 overflow-x-hidden">
              <div className="container p-4 md:p-6">
                <SidebarTrigger className="mb-4 md:hidden" />
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </ThemeProvider>
    </NextThemesProvider>
  );
};
