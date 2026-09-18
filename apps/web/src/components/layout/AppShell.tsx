"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/toast";
import { LanguageProvider } from "@/lib/i18n/language-context";

const AUTH_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_ROUTES.includes(pathname);
  const [collapsed, setCollapsed] = useState(false);

  // Route protection is handled server-side by middleware.ts.
  // AppShell only manages the UI shell layout.

  if (isAuth) {
    return (
      <LanguageProvider>
        <div className="flex h-full w-full items-center justify-center bg-background transition-colors duration-200">
          {children}
        </div>
        <Toaster />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background p-3 pb-0 gap-3">
        {/* Left Floating Card Sidebar */}
        <Sidebar collapsed={collapsed} />

        {/* Right Main Container - Pure Black Content Page */}
        <div className="flex flex-col flex-1 min-w-0 rounded-t-2xl rounded-b-none border border-b-0 border-white/10 bg-black backdrop-blur-xl overflow-hidden">
          <Topbar 
            onToggleSidebar={() => setCollapsed(!collapsed)} 
            sidebarCollapsed={collapsed} 
          />
          <main className="flex-1 overflow-y-auto py-6 px-4 md:px-6 bg-black">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </LanguageProvider>
  );
}
