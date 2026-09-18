"use client";

/**
 * Client-side auth helpers.
 * Session is now managed server-side via HttpOnly cookie.
 * These functions are thin wrappers around the /api/auth/* endpoints.
 */

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  if (!email || !password) {
    return { success: false, message: "Mohon isi email dan password." };
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (res.ok) {
      return { success: true, message: "Login berhasil!" };
    }

    const data = await res.json().catch(() => ({}));
    return { success: false, message: data.error || "Email atau password salah." };
  } catch {
    return { success: false, message: "Tidak dapat terhubung ke server." };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network errors — cookie will expire anyway
  } finally {
    // Clean up any remaining client-side storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("lupio_user_name");
      localStorage.removeItem("lupio_user_email");
      localStorage.removeItem("lupio_session");
      // Do NOT remove lupio_theme — user preference should persist
    }
  }
}

/**
 * Lightweight check: does the session cookie exist?
 * Real validation is server-side. This is only used by AppShell
 * for optimistic client-side rendering decisions.
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return true;
  // We can no longer read HttpOnly cookies from JS.
  // Return true by default; middleware.ts enforces real protection.
  return true;
}
