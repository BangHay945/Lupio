"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/toast";
import { isAuthenticated } from "@/lib/auth";

const AUTH_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuth = AUTH_ROUTES.includes(pathname);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const authed = isAuthenticated();
    if (!authed && !isAuth) {
      router.push("/login");
    } else if (authed && isAuth) {
      router.push("/dashboard");
    }
  }, [pathname, isAuth, router]);

  if (isAuth) {
    return (
      <>
        <div className="flex h-full w-full items-center justify-center bg-black">
          {children}
        </div>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-background p-2 pb-0 gap-2">
        {/* Left Floating Card Sidebar */}
        <Sidebar collapsed={collapsed} />

        {/* Right Main Container - Pure Black Content Page */}
        <div className="flex flex-col flex-1 min-w-0 rounded-t-2xl rounded-b-none border border-b-0 border-white/10 bg-black backdrop-blur-xl overflow-hidden">
          <Topbar 
            onToggleSidebar={() => setCollapsed(!collapsed)} 
            sidebarCollapsed={collapsed} 
          />
          <main className="flex-1 overflow-y-auto p-6 bg-black">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
