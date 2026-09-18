"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Radio, Lock } from "lucide-react";
import { loginUser } from "@/lib/auth";
import { toast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminEmail, setAdminEmail] = useState("admin@lupio.local");

  // Fetch the configured admin email so we can show it as a hint
  useEffect(() => {
    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((d) => {
        if (d.adminEmail) setAdminEmail(d.adminEmail);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);

    const res = await loginUser(email, password);
    setLoading(false);

    if (res.success) {
      (toast as any)({
        title: "Welcome Back! 👋",
        description: "Authenticated successfully. Loading dashboard...",
        type: "success",
      });
      window.location.href = "/dashboard";
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="relative w-full max-w-sm px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="login-card relative rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="4 3 14 12 4 21 4 3" fill="currentColor" stroke="none" />
              <path d="M14 7a7 7 0 0 1 0 10" />
              <path d="M18 4a11 11 0 0 1 0 16" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Lupio</span>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Radio className="h-3 w-3" />
            <span>24/7 Engine</span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
          <p className="text-xs text-muted-foreground mt-1">Access your streaming control panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              placeholder={adminEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="login-input bg-black/40 border-white/10 text-sm h-10"
              required
            />
            {/* Show configured email as hint */}
            <p className="text-[10px] text-muted-foreground opacity-70">
              Admin: <span className="font-mono">{adminEmail}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="login-input bg-black/40 border-white/10 text-sm h-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-10 gap-2 mt-2 text-xs"
          >
            <Lock className="h-3.5 w-3.5 fill-black" />
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}
