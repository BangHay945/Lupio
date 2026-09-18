/**
 * Server-side session management for Lupio.
 * Uses cryptographically random tokens stored in db.json with in-memory cache,
 * with an HttpOnly cookie on the client and support for API Key authentication & RBAC.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readDB, writeDB, db } from "./db";

export const SESSION_COOKIE = "lupio_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

export interface Session {
  token: string;
  email: string;
  role: "Admin" | "Operator";
  createdAt: number; // unix ms
  expiresAt: number; // unix ms
  isApiKey?: boolean;
}

// In-memory session cache to avoid hammering disk on high-frequency API polling
const sessionMemoryCache: Map<string, Session> = new Map();

// ─── Token generation ────────────────────────────────────────────────────────

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ─── Session CRUD (server-side, db.json + in-memory cache) ────────────────────

export function createSession(email: string, role: "Admin" | "Operator" = "Admin"): string {
  const token = generateSessionToken();
  const now = Date.now();
  const session: Session = {
    token,
    email,
    role,
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE * 1000,
  };

  sessionMemoryCache.set(token, session);

  const data = readDB();
  (data as any).sessions = (data as any).sessions || [];
  (data as any).sessions.push(session);

  // Prune expired sessions
  (data as any).sessions = (data as any).sessions.filter(
    (s: Session) => s.expiresAt > now
  );

  writeDB(data);
  return token;
}

export function getSession(token: string): Session | null {
  if (!token) return null;

  // 1. Check in-memory cache first
  const cached = sessionMemoryCache.get(token);
  if (cached) {
    if (cached.expiresAt < Date.now()) {
      sessionMemoryCache.delete(token);
      return null;
    }
    return cached;
  }

  // 2. Fallback to DB
  const data = readDB();
  const sessions: Session[] = (data as any).sessions || [];
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;

  sessionMemoryCache.set(token, session);
  return session;
}

export function destroySession(token: string): void {
  sessionMemoryCache.delete(token);
  const data = readDB();
  (data as any).sessions = ((data as any).sessions || []).filter(
    (s: Session) => s.token !== token
  );
  writeDB(data);
}

// ─── API Route Guards ────────────────────────────────────────────────────────

/**
 * Call at the top of API route handlers.
 * Returns the session if valid (via Cookie or API Key), or a 401 NextResponse if not.
 */
export async function requireAuth(
  req: NextRequest
): Promise<Session | NextResponse> {
  // 1. Check HttpOnly cookie
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  if (token) {
    const session = getSession(token);
    if (session) return session;
  }

  // 2. Check API Key header (Authorization: Bearer <KEY> or X-API-Key)
  const authHeader = req.headers.get("authorization") || "";
  let apiKeyCandidate = "";
  if (authHeader.startsWith("Bearer ")) {
    apiKeyCandidate = authHeader.substring(7).trim();
  } else {
    apiKeyCandidate = req.headers.get("x-api-key")?.trim() || "";
  }

  if (apiKeyCandidate) {
    const activeKeys = db.getApiKeys();
    const matched = activeKeys.find((k) => k.key === apiKeyCandidate);
    if (matched) {
      return {
        token: matched.key,
        email: `apikey:${matched.name}`,
        role: "Admin",
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        isApiKey: true,
      };
    }
  }

  return NextResponse.json(
    { error: "Unauthorized. Please log in or provide a valid API Key." },
    { status: 401 }
  );
}

/**
 * Enforces Admin role for sensitive administrative operations (system settings, user management, API keys).
 */
export async function requireAdmin(
  req: NextRequest
): Promise<Session | NextResponse> {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Allowed if is an authorized API key or role is Admin
  if (auth.isApiKey || auth.role === "Admin" || auth.email === "admin@lupio.local") {
    return auth;
  }

  return NextResponse.json(
    { error: "Forbidden. Admin privileges required." },
    { status: 403 }
  );
}
