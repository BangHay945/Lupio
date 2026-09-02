"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { 
  Save, Settings, Video, Cpu, Globe, CheckCircle2, ShieldCheck, 
  BellRing, ShieldAlert, Type, Key, Users, Copy, Plus, Trash2, Volume2, Activity, User, Lock, Mail, Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/services/api";
import { MediaItem, UserAccount, ApiKey } from "@/lib/mock-data";
import { CustomSelect } from "@/components/ui/select";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "profile" | "ffmpeg" | "streaming" | "webhooks" | "security">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  
  // Feature 6 Data
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Admin Profile & Password Form State
  const [adminName, setAdminName] = useState("Admin Operator");
  const [adminEmail, setAdminEmail] = useState("admin@lupio.local");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);

  // User Add Form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "Operator">("Operator");

  // API Key Add Form
  const [newKeyName, setNewKeyName] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);

  const [settings, setSettings] = useState({
    serverName: "Lupio Production Node 1",
    language: "English",
    ffmpegPath: "ffmpeg",
    hardwareAccel: "None (CPU Only)",
    threadCount: 4,
    defaultResolution: "1080p",
    globalBitrate: "8000",
    reconnectDelay: 10,
    telegramBotToken: "",
    telegramChatId: "",
    discordWebhookUrl: "",
    enableWebhooks: true,
    backupMediaId: "",
    globalWatermarkText: "LUPIO LIVE 24/7",
    enableAutoHealing: true,
    maxWatchdogRetries: 3,
    enableAudioNormalizer: true,
    loudnessLevel: "-16 LUFS (EBU R128)",
  });

  const loadData = async () => {
    try {
      const [real, media, uData, kData] = await Promise.all([
        apiService.getSettings(),
        apiService.getMedia(),
        apiService.getUsers(),
        apiService.getApiKeys(),
      ]);
      if (real && Object.keys(real).length > 0) {
        setSettings((prev) => ({ ...prev, ...real }));
      }
      if (Array.isArray(media)) setMediaList(media);
      if (Array.isArray(uData)) setUsers(uData);
      if (Array.isArray(kData)) setApiKeys(kData);

      // Load saved user profile
      const savedName = localStorage.getItem("lupio_user_name");
      if (savedName) setAdminName(savedName);
      const savedEmail = localStorage.getItem("lupio_user_email");
      if (savedEmail) setAdminEmail(savedEmail);

      if (real && real.adminName) setAdminName(real.adminName);
      if (real && real.adminEmail) setAdminEmail(real.adminEmail);
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateSettings(settings);
      (toast as any)({
        title: "Settings Saved! ⚙️",
        description: "Your system configuration has been updated successfully.",
        type: "success",
      });
    } catch (err: any) {
      (toast as any)({ title: "Save Error", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) {
      (toast as any)({ title: "Validation Error", description: "Name and email cannot be empty.", type: "error" });
      return;
    }
    const cleanName = adminName.trim();
    const cleanEmail = adminEmail.trim();

    localStorage.setItem("lupio_user_name", cleanName);
    localStorage.setItem("lupio_user_email", cleanEmail);

    try {
      await apiService.updateSettings({ adminName: cleanName, adminEmail: cleanEmail });
    } catch (e) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lupio_profile_updated"));
    }

    (toast as any)({
      title: "Profile Updated! 👤",
      description: "Admin profile details saved.",
      type: "success",
    });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) {
      (toast as any)({ title: "Validation Error", description: "Please fill in all password fields.", type: "error" });
      return;
    }
    if (newPass !== confirmPass) {
      (toast as any)({ title: "Validation Error", description: "New password and confirmation do not match.", type: "error" });
      return;
    }
    if (newPass.length < 4) {
      (toast as any)({ title: "Validation Error", description: "Password must be at least 4 characters long.", type: "error" });
      return;
    }

    setUpdatingPass(true);
    try {
      localStorage.setItem("lupio_admin_password", newPass);
      await apiService.updateSettings({ adminPassword: newPass });

      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");

      (toast as any)({
        title: "Password Updated! 🔒",
        description: "Your security password has been changed successfully.",
        type: "success",
      });
    } catch (err: any) {
      (toast as any)({ title: "Update Error", description: err.message, type: "error" });
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      (toast as any)({ title: "Validation Error", description: "Please enter a key name.", type: "error" });
      return;
    }
    try {
      const created = await apiService.createApiKey(newKeyName.trim());
      setApiKeys((prev) => [...prev, created]);
      setNewKeyName("");
      (toast as any)({
        title: "API Key Generated! 🔑",
        description: `Key "${created.name}" created successfully.`,
        type: "success",
      });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await apiService.deleteApiKey(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      (toast as any)({ title: "Key Revoked", description: "API Key has been revoked.", type: "info" });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim()) {
      (toast as any)({ title: "Validation Error", description: "Please enter name and email.", type: "error" });
      return;
    }
    try {
      const created = await apiService.saveUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        status: "Active",
      });
      setUsers((prev) => [...prev, created]);
      setNewUserName("");
      setNewUserEmail("");
      (toast as any)({
        title: "User Created! 👤",
        description: `Added "${created.name}" as ${created.role}.`,
        type: "success",
      });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await apiService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      (toast as any)({ title: "User Removed", description: "User account deleted.", type: "info" });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await fetch("/api/settings/test-webhook", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        (toast as any)({
          title: "Test Alert Sent! 🚀",
          description: "Telegram/Discord notification was dispatched successfully.",
          type: "success",
        });
      } else {
        (toast as any)({
          title: "Webhook Failed",
          description: data.message || "Failed to send test alert.",
          type: "error",
        });
      }
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    } finally {
      setTestingWebhook(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    (toast as any)({ title: "Copied! 📋", description: "API Key copied to clipboard.", type: "success" });
  };

  const adminInitials = adminName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Horizontal Nav Tabs - Rounded-Full Pill Style */}
      <div className="pill-tab-switcher flex flex-wrap items-center gap-1.5 p-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-transparent text-xs w-fit">
        <button
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex items-center gap-2 px-4.5 py-2 rounded-full font-semibold transition-all",
            activeTab === "general"
              ? "bg-emerald-500/20 text-emerald-400 shadow-xs"
              : "text-muted-foreground hover:text-white"
          )}
        >
          <Settings className="h-3.5 w-3.5" /> General
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 px-4.5 py-2 rounded-full font-semibold transition-all",
            activeTab === "profile"
              ? "bg-emerald-500/20 text-emerald-400 shadow-xs"
              : "text-muted-foreground hover:text-white"
          )}
        >
          <User className="h-3.5 w-3.5" /> Edit Admin Profile
        </button>

        <button
          onClick={() => setActiveTab("ffmpeg")}
          className={cn(
            "flex items-center gap-2 px-4.5 py-2 rounded-full font-semibold transition-all",
            activeTab === "ffmpeg"
              ? "bg-emerald-500/20 text-emerald-400 shadow-xs"
              : "text-muted-foreground hover:text-white"
          )}
        >
          <Cpu className="h-3.5 w-3.5" /> FFmpeg & Audio
        </button>

        <button
          onClick={() => setActiveTab("streaming")}
          className={cn(
            "flex items-center gap-2 px-4.5 py-2 rounded-full font-semibold transition-all",
            activeTab === "streaming"
              ? "bg-emerald-500/20 text-emerald-400 shadow-xs"
              : "text-muted-foreground hover:text-white"
          )}
        >
          <Video className="h-3.5 w-3.5" /> Auto-Healing & Backup
        </button>

        <button
          onClick={() => setActiveTab("webhooks")}
          className={cn(
            "flex items-center gap-2 px-4.5 py-2 rounded-full font-semibold transition-all",
            activeTab === "webhooks"
              ? "bg-emerald-500/20 text-emerald-400 shadow-xs"
              : "text-muted-foreground hover:text-white"
          )}
        >
          <BellRing className="h-3.5 w-3.5" /> Telegram & Discord
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex items-center gap-2 px-4.5 py-2 rounded-full font-semibold transition-all",
            activeTab === "security"
              ? "bg-emerald-500/20 text-emerald-400 shadow-xs"
              : "text-muted-foreground hover:text-white"
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Users & REST API Keys
        </button>
      </div>

      {/* Main Settings Card Container - Full Page Width */}
      <Card className="p-8 border-white/10 bg-card/60 backdrop-blur space-y-6 min-h-[500px]">
        {/* Tab 1: General */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">General Settings</h3>
              <p className="text-xs text-muted-foreground">System node identification and default application preferences</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Server Node Name</label>
                <Input
                  value={settings.serverName}
                  onChange={(e) => setSettings({ ...settings, serverName: e.target.value })}
                  className="bg-white/5 border-white/10 text-sm h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dashboard Language</label>
                <Input
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="bg-white/5 border-white/10 text-sm h-11"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Edit Admin Profile */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" /> Admin Profile & Security
              </h3>
              <p className="text-xs text-muted-foreground">Manage your personal operator account details and security password</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Profile Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4 p-6 rounded-2xl border border-white/10 bg-black/40">
                <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shrink-0">
                    {adminInitials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{adminName}</h4>
                    <p className="text-xs text-muted-foreground">{adminEmail}</p>
                    <span className="inline-block mt-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Super Administrator
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-emerald-400" /> Full Name
                  </label>
                  <Input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="bg-white/5 border-white/10 text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-400" /> Email Address
                  </label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-sm h-10"
                  />
                </div>

                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10 gap-1.5">
                  <Save className="h-3.5 w-3.5 fill-black" /> Update Profile Info
                </Button>
              </form>

              {/* Password Form */}
              <form onSubmit={handleUpdatePassword} className="space-y-4 p-6 rounded-2xl border border-white/10 bg-black/40">
                <div className="pb-2 border-b border-white/10">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-400" /> Change Security Password
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Ensure your account uses a strong password</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Current Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••••"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="bg-white/5 border-white/10 text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••••"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="bg-white/5 border-white/10 text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••••"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="bg-white/5 border-white/10 text-sm h-10"
                  />
                </div>

                <Button type="submit" disabled={updatingPass} className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10 gap-1.5">
                  <Lock className="h-3.5 w-3.5 fill-black" />
                  {updatingPass ? "Updating..." : "Update Security Password"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: FFmpeg & Audio Normalizer */}
        {activeTab === "ffmpeg" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-emerald-400" /> FFmpeg & Audio Normalization (EBU R128)
              </h3>
              <p className="text-xs text-muted-foreground">Configure binary paths, thread count, and audio loudness control</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">FFmpeg Binary Path</label>
                <Input
                  value={settings.ffmpegPath}
                  onChange={(e) => setSettings({ ...settings, ffmpegPath: e.target.value })}
                  className="bg-white/5 border-white/10 text-sm h-11 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hardware Acceleration</label>
                <Input
                  value={settings.hardwareAccel}
                  onChange={(e) => setSettings({ ...settings, hardwareAccel: e.target.value })}
                  className="bg-white/5 border-white/10 text-sm h-11"
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-emerald-400" /> Broadcast Audio Normalizer (EBU R128 Standard)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically normalizes audio volume levels across different media files to prevent loudness spikes (-16 LUFS target).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enableAudioNormalizer: !settings.enableAudioNormalizer })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    settings.enableAudioNormalizer
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-white/5 border-white/10 text-muted-foreground"
                  }`}
                >
                  {settings.enableAudioNormalizer ? "AUDIO NORMALIZER ENABLED" : "DISABLED"}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-1 text-xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Target Loudness Preset</label>
                  <Input
                    value={settings.loudnessLevel}
                    onChange={(e) => setSettings({ ...settings, loudnessLevel: e.target.value })}
                    className="bg-white/5 border-white/10 h-10 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Auto-Healing Watchdog & Backup */}
        {activeTab === "streaming" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" /> Auto-Healing Watchdog & Emergency Backup
              </h3>
              <p className="text-xs text-muted-foreground">Continuous monitoring engine that auto-recovers crashed streams 24/7</p>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" /> Auto-Healing Watchdog Daemon (24/7 Protection)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scans active stream processes every 10s. Automatically restarts crashed streams and triggers Webhook alerts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enableAutoHealing: !settings.enableAutoHealing })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    settings.enableAutoHealing
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-white/5 border-white/10 text-muted-foreground"
                  }`}
                >
                  {settings.enableAutoHealing ? "WATCHDOG ACTIVE" : "DISABLED"}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-1 text-xs">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Max Auto-Recovery Retries</label>
                  <Input
                    type="number"
                    value={settings.maxWatchdogRetries}
                    onChange={(e) => setSettings({ ...settings, maxWatchdogRetries: parseInt(e.target.value) || 3 })}
                    className="bg-white/5 border-white/10 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-400" /> Default Emergency Backup Video
              </label>
              <CustomSelect
                value={settings.backupMediaId}
                onChange={(val) => setSettings({ ...settings, backupMediaId: val })}
                placeholder="None (Synthetic Test Pattern)"
                options={[
                  { value: "", label: "None (Synthetic Test Pattern)" },
                  ...mediaList.map((m) => ({
                    value: m.id,
                    label: `${m.filename} (${m.duration})`,
                  })),
                ]}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Webhooks */}
        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Telegram & Discord Webhooks</h3>
              <p className="text-xs text-muted-foreground">Receive instant alerts for stream start, stop, restart, and errors</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telegram Bot Token</label>
                <Input
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={settings.telegramBotToken}
                  onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                  className="bg-white/5 border-white/10 text-xs h-11 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telegram Chat ID</label>
                <Input
                  placeholder="e.g. -100123456789"
                  value={settings.telegramChatId}
                  onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                  className="bg-white/5 border-white/10 text-xs h-11 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discord Webhook URL</label>
                <Input
                  placeholder="https://discord.com/api/webhooks/..."
                  value={settings.discordWebhookUrl}
                  onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })}
                  className="bg-white/5 border-white/10 text-xs h-11 font-mono"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || (!settings.telegramBotToken && !settings.discordWebhookUrl)}
                  className="rounded-full h-10 px-5 font-bold border-white/10 bg-transparent text-xs text-foreground hover:bg-white/10 gap-2"
                >
                  <BellRing className={cn("h-4 w-4 text-emerald-400", testingWebhook && "animate-pulse")} />
                  {testingWebhook ? "Sending Test Alert..." : "Send Test Webhook Alert"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Users & REST API Keys */}
        {activeTab === "security" && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Key className="h-5 w-5 text-emerald-400" /> REST API Key Manager
                </h3>
                <p className="text-xs text-muted-foreground">Generate secret tokens to automate Lupio streams via cURL, OBS, or external scripts</p>
              </div>

              <div className="flex gap-3">
                <Input
                  placeholder="Enter API Key name (e.g. OBS Studio Webhook)..."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="bg-white/5 border-white/10 text-xs h-11 max-w-md"
                />
                <Button onClick={handleCreateApiKey} className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs gap-1.5 h-11 px-5">
                  <Plus className="h-4 w-4" /> Generate Secret Key
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-4 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <span>{k.name}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">Created: {k.createdAt}</span>
                      </div>
                      <div className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit flex items-center gap-2">
                        <span>{k.key}</span>
                        <button onClick={() => copyToClipboard(k.key)} className="hover:text-white transition-colors p-0.5" title="Copy Key">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <Button onClick={() => handleDeleteApiKey(k.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 text-xs">
                      <Trash2 className="h-4 w-4" /> Revoke Key
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-white/10" />

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" /> Multi-User Roles & Permissions
                </h3>
                <p className="text-xs text-muted-foreground">Manage Studio Operators and System Administrator accounts</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Input
                  placeholder="Full Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="bg-white/5 border-white/10 text-xs h-11 w-48"
                />
                <Input
                  placeholder="operator@lupio.local"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-xs h-11 w-64"
                />
                <div className="w-36">
                  <CustomSelect
                    value={newUserRole}
                    onChange={(val) => setNewUserRole(val as any)}
                    options={[
                      { value: "Operator", label: "Operator" },
                      { value: "Admin", label: "Admin" },
                    ]}
                  />
                </div>
                <Button onClick={handleCreateUser} variant="outline" className="text-xs h-11 px-5 border-white/10">
                  <Plus className="h-4 w-4" /> Add User Account
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                {users.map((u) => (
                  <div key={u.id} className="p-4 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === "Admin" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>

                    <button onClick={() => handleDeleteUser(u.id)} className="text-muted-foreground hover:text-red-400 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button */}
        {activeTab !== "profile" && (
          <div className="pt-6 border-t border-white/10 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-2 text-xs h-11 px-8"
            >
              <Save className="h-4 w-4 fill-black" />
              {saving ? "Saving Changes..." : "Save Settings"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
