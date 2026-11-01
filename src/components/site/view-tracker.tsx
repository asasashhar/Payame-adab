"use client";

import { useEffect } from "react";

export function ViewTracker({
  type,
  id,
  path,
}: {
  type?: "poem" | "article" | "book" | "news";
  id?: string;
  path?: string;
}) {
  useEffect(() => {
    const key = `viewed-${type ?? "page"}-${id ?? path ?? ""}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const payload: Record<string, string> = {
      path: path ?? (typeof window !== "undefined" ? window.location.pathname : "/"),
    };
    if (type && id) {
      payload.type = type;
      payload.id = id;
    }
    if (document.referrer) payload.referrer = document.referrer;
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [type, id, path]);
  return null;
}

/** Site-wide page-view tracker (no resource) — include once in the site shell. */
export function PageViewTracker() {
  useEffect(() => {
    const path = window.location.pathname;
    const key = `viewed-page-${path}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const payload: Record<string, string> = { path };
    if (document.referrer) payload.referrer = document.referrer;
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, []);
  return null;
}
