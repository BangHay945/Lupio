"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Radio, Lock } from "lucide-react";
import { loginUser } from "@/lib/auth";
import { toast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lupio.local");
  const [password, setPassword] = useState("admin123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const res = loginUser(email, password);
    setLoading(false);

    if (res.success) {
      (toast as any)({
        title: "Welcome Back! 👋",
        description: "Authenticated successfully. Loading dashboard...",
        type: "success",
      });
      router.push("/dashboard");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="relative w-full max-w-sm px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <img src="/lupio-icon.jpg" alt="Lupio Icon" className="h-7 w-7 object-contain shrink-0" />
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
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="bg-black/40 border-white/10 text-sm h-10"
            />
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
                className="bg-black/40 border-white/10 text-sm h-10 pr-10"
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
