import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side gate for /admin/* — verifies the HMAC session cookie BEFORE the
 * page renders and redirects unauthenticated visitors to /admin/login.
 * (Role checks + data access remain enforced on every admin API via requireAdmin.)
 */
const COOKIE = "pea_session";
const SECRET = process.env.AUTH_SECRET || "payam-e-adab-secret-key-2024";
const MAX_AGE_MS = 60 * 60 * 24 * 30 * 1000;

function b64urlToBuf(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function hexToBuf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expected = new Uint8Array(mac);
    const given = hexToBuf(sig);
    if (expected.length !== given.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ given[i];
    if (diff !== 0) return false;
    const data = JSON.parse(new TextDecoder().decode(b64urlToBuf(payload)));
    return typeof data.ts === "number" && Date.now() - data.ts < MAX_AGE_MS;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(COOKIE)?.value;
    const valid = token ? await verifyToken(token) : false;
    if (!valid) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    // already authenticated admins skip the login page
    const token = req.cookies.get(COOKIE)?.value;
    const valid = token ? await verifyToken(token) : false;
    if (valid) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
