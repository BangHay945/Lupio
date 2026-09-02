"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Wifi, LogOut, Settings, ShieldCheck, PanelLeft, ExternalLink, Sun, Moon, User, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/services/api";
import { logoutUser } from "@/lib/auth";
import { toast } from "@/components/ui/toast";

const pageMeta: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Overview", sub: "System & streams at a glance" },
  "/analytics": { title: "Analytics", sub: "Uptime, data transmission & reports" },
  "/streams": { title: "Streams", sub: "Manage active broadcasts" },
  "/media": { title: "Media", sub: "Video & audio library" },
  "/playlists": { title: "Playlists", sub: "Build your stream queues" },
  "/schedule": { title: "Schedule", sub: "Plan upcoming broadcasts" },
  "/channels": { title: "Channels", sub: "RTMP destinations" },
  "/logs": { title: "Logs", sub: "System & FFmpeg output" },
  "/settings": { title: "Settings", sub: "Configuration" },
};

export function Topbar({ 
  onToggleSidebar, 
  sidebarCollapsed 
}: { 
  onToggleSidebar?: () => void; 
  sidebarCollapsed?: boolean; 
}) {
  const pathname = usePathname();
  const router = useRouter();
  const segment = "/" + pathname.split("/")[1];
  const meta = pageMeta[segment] ?? { title: segment.replace("/", ""), sub: "" };

  const [bandwidth, setBandwidth] = useState<number>(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "error" | "warn">("all");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Admin Profile State
  const [userName, setUserName] = useState("Admin Operator");
  const [userEmail, setUserEmail] = useState("admin@lupio.local");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const loadProfile = () => {
    const name = localStorage.getItem("lupio_user_name");
    if (name) setUserName(name);
    const email = localStorage.getItem("lupio_user_email");
    if (email) setUserEmail(email);
  };

  useEffect(() => {
    loadProfile();
    window.addEventListener("lupio_profile_updated", loadProfile);
    return () => window.removeEventListener("lupio_profile_updated", loadProfile);
  }, []);

  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      (toast as any)({ title: "Validation Error", description: "Name and email cannot be empty.", type: "error" });
      return;
    }
    const cleanName = editName.trim();
    const cleanEmail = editEmail.trim();

    localStorage.setItem("lupio_user_name", cleanName);
    localStorage.setItem("lupio_user_email", cleanEmail);
    setUserName(cleanName);
    setUserEmail(cleanEmail);

    try {
      await apiService.updateSettings({ adminName: cleanName, adminEmail: cleanEmail });
    } catch (e) {}

    window.dispatchEvent(new Event("lupio_profile_updated"));
    setIsEditProfileOpen(false);

    (toast as any)({
      title: "Profile Saved! 👤",
      description: `Updated profile for "${cleanName}".`,
      type: "success",
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem("lupio_theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
      if (saved === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("lupio_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
    (toast as any)({
      title: `${nextTheme === "dark" ? "Dark Mode 🌙" : "Light Mode ☀️"}`,
      description: `Switched app theme to ${nextTheme}.`,
      type: "info",
    });
  };

  const handleLogout = () => {
    logoutUser();
    (toast as any)({
      title: "Logged Out 👋",
      description: "Your session has ended successfully.",
      type: "info",
    });
    router.push("/login");
  };

  const loadData = async () => {
    try {
      const metrics = await apiService.getSystemMetrics();
      if (metrics && typeof metrics.uploadBandwidth === "number") {
        setBandwidth(metrics.uploadBandwidth);
      }

      const logs = await apiService.getLogs();
      if (Array.isArray(logs)) {
        setRecentLogs(logs.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-6 border-b border-white/10 bg-transparent">
        {/* Left — Panel Toggle + Separator + Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-white/70 transition-colors"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-white/10 shrink-0" />

          <div className="flex items-baseline gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-none tracking-tight truncate">
              {meta.title}
            </h1>
            {meta.sub && (
              <span className="hidden sm:inline text-xs text-white/40 truncate">— {meta.sub}</span>
            )}
          </div>
        </div>

        {/* Right Widgets */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Network Bandwidth Indicator */}
          <div
            title="Dynamic Live Upload Throughput"
            className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-3.5 py-1.5"
          >
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-foreground font-mono">{bandwidth} Mbps</span>
          </div>

          {/* Theme Dark/Light Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-transparent text-foreground transition-colors hover:bg-white/10"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-500" />}
          </button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-transparent text-foreground transition-colors hover:bg-white/10">
              <Bell className="h-4 w-4" />
              {recentLogs.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 border-white/10 bg-zinc-950 p-2 rounded-2xl">
              <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground flex items-center justify-between">
                <span>Notification Center</span>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 text-[10px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setLogFilter("all"); }}
                    className={`px-2.5 py-0.5 rounded-full font-medium ${logFilter === "all" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLogFilter("warn"); }}
                    className={`px-2.5 py-0.5 rounded-full font-medium ${logFilter === "warn" ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground"}`}
                  >
                    Warn
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLogFilter("error"); }}
                    className={`px-2.5 py-0.5 rounded-full font-medium ${logFilter === "error" ? "bg-red-500/20 text-red-400" : "text-muted-foreground"}`}
                  >
                    Err
                  </button>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />

              <div className="space-y-1.5 py-1 max-h-60 overflow-y-auto">
                {recentLogs.filter(l => logFilter === "all" || l.level === logFilter).length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">No alerts matching filter.</div>
                ) : (
                  recentLogs
                    .filter(l => logFilter === "all" || l.level === logFilter)
                    .map((log, idx) => (
                      <div key={log.id || idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className={`font-semibold uppercase ${log.level === "error" ? "text-red-400" : log.level === "warn" ? "text-amber-400" : "text-emerald-400"}`}>
                            {log.source || "System"}
                          </span>
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-xs text-foreground truncate">{log.message}</p>
                      </div>
                    ))
                )}
              </div>

              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => router.push("/logs")}
                className="text-xs text-center justify-center text-emerald-400 cursor-pointer font-medium"
              >
                View Full System Logs →
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin Avatar Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold transition-colors hover:bg-emerald-500/25 border border-emerald-500/20">
              {userInitials}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 border-white/10 bg-zinc-950 p-1.5">
              <div className="font-normal p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {userName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />

              <DropdownMenuItem
                onClick={() => {
                  setEditName(userName);
                  setEditEmail(userEmail);
                  setIsEditProfileOpen(true);
                }}
                className="cursor-pointer text-xs"
              >
                <User className="mr-2 h-3.5 w-3.5 text-emerald-400" /> Edit Profile
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer text-xs">
                <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Settings & System
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-red-400 focus:text-red-400">
                <LogOut className="mr-2 h-3.5 w-3.5" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Quick Edit Profile Modal Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white/98 dark:bg-zinc-950/98 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-400" /> Edit Admin Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold uppercase text-muted-foreground">Full Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Admin Operator"
                className="bg-white/5 border-white/10 h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase text-muted-foreground">Email Address</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="admin@lupio.local"
                className="bg-white/5 border-white/10 h-10 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs">
                Save Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
