import crypto from "crypto";
import { cookies } from "next/headers";

const VISITOR_COOKIE = "pea_vid";

/**
 * Reads or creates the anonymous visitor id (cookie-based).
 * Used for like dedupe and unique-visitor analytics.
 * When a new id is minted inside a GET handler the cookie is attached to the
 * response by Next automatically (cookies().set works in route handlers).
 */
export async function getOrCreateVisitorId(): Promise<string> {
  try {
    const store = await cookies();
    const existing = store.get(VISITOR_COOKIE)?.value;
    if (existing) return existing;
    const vid = crypto.randomUUID();
    store.set(VISITOR_COOKIE, vid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return vid;
  } catch {
    return "anonymous";
  }
}
