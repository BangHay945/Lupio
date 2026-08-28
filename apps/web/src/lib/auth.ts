"use client";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return true;

  const cookieStr = document.cookie || "";
  const hasCookie = cookieStr.includes("lupio_session=authenticated");
  const hasLocal = localStorage.getItem("lupio_session") === "authenticated";

  return hasCookie || hasLocal;
}

export function loginUser(email: string, pass: string): { success: boolean; message: string } {
  if (!email || !pass) {
    return { success: false, message: "Please fill in email and password." };
  }

  // Set Cookie & LocalStorage
  document.cookie = "lupio_session=authenticated; path=/; max-age=86400";
  localStorage.setItem("lupio_session", "authenticated");
  localStorage.setItem("lupio_user_email", email);

  return { success: true, message: "Login successful!" };
}

export function logoutUser(): void {
  document.cookie = "lupio_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  localStorage.removeItem("lupio_session");
  localStorage.removeItem("lupio_user_email");
}
