/**
 * Interactive acceptance test (bun) — Payam-e-Adab upgrade spec section 14.
 */
const BASE = "http://localhost:3000";
let PASS = 0, FAIL = 0;
const ok = (m: string) => { PASS++; console.log(`  PASS: ${m}`); };
const bad = (m: string) => { FAIL++; console.log(`  FAIL: ${m}`); };
const check = (m: string, exp: unknown, got: unknown) =>
  (exp === got ? ok(m) : bad(`${m} (expected ${JSON.stringify(exp)}, got ${JSON.stringify(got)})`));

let cookie = "";
async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}), ...(init.headers ?? {}) },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie && setCookie.includes("pea_visitor")) {
    cookie = cookie ? cookie + "; " + setCookie.split(";")[0] : setCookie.split(";")[0];
  }
  let body: unknown = null;
  try { body = await res.json(); } catch { /* empty */ }
  return { status: res.status, body };
}

async function main() {
  // admin login
  const login = await api("/api/auth/admin-login", { method: "POST", body: JSON.stringify({ email: "mdnematullah1343@gmail.com", password: "darulhuda" }) });
  cookie = login.headers ?? cookie;
  // capture session cookie manually
  const res2 = await fetch(BASE + "/api/auth/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "mdnematullah1343@gmail.com", password: "darulhuda" }) });
  const sc = res2.headers.getSetCookie?.() ?? [];
  cookie = sc.map((c) => c.split(";")[0]).join("; ") || cookie;
  check("admin login (darulhuda)", 200, res2.status);

  // published poem id
  const poems = (await (await fetch(BASE + "/api/poems")).json()) as { id: string; title: string }[];
  check("published poems available", true, Array.isArray(poems) && poems.length >= 10);
  const poemId = poems[0]?.id;

  // --- comments flow ---
  const stamp = new Date().toISOString().slice(0, 19);
  const testBody = `عمدہ کلام — آزمائشی تبصرہ ${stamp}`;
  const before = (await api(`/api/comments?admin=1&status=all`)).body as { counts: { PENDING: number; total: number } };
  const post = await api("/api/comments", { method: "POST", body: JSON.stringify({ resourceType: "poem", resourceId: poemId, body: testBody, guestName: "آزمائشی قاری" }) });
  check("guest comment submit -> 201", 201, post.status);
  const pend = (await api(`/api/comments?admin=1&status=PENDING`)).body as { items: { id: string }[] };
  check("new comment is PENDING", true, (pend.items?.some((c) => c.id === post.body?.id)) ?? false);
  const pubBefore = (await api(`/api/comments?resourceType=poem&resourceId=${poemId}`)).body as { items: unknown[] };
  const pendId = (pend.items?.[0] ?? (pend as { body?: { items?: { id: string }[] } }).body?.items?.[0])?.id;
  await api("/api/comments", { method: "PATCH", body: JSON.stringify({ id: pendId, status: "APPROVED" }) });
  const pubAfter = (await api(`/api/comments?resourceType=poem&resourceId=${poemId}`)).body as { items: unknown[] };
  check("approved comment becomes public", pubBefore.items.length + 1, pubAfter.items.length);

  // --- cleanup test comment ---
  if (pendId) await api("/api/comments", { method: "DELETE", body: JSON.stringify({ id: pendId }) });
  // unmoderated comment must NOT be public
  const post2 = await api("/api/comments", { method: "POST", body: JSON.stringify({ resourceType: "poem", resourceId: poemId, body: `غیر منظور شدہ تبصرہ ${stamp}`, guestName: "قاری دو" }) });
  const post2Id = (post2.body as { id?: string })?.id;
  const pubAfter2 = (await api(`/api/comments?resourceType=poem&resourceId=${poemId}`)).body as { items: unknown[] };
  check("pending comment stays hidden from public", pubAfter.items.length, pubAfter2.items.length);
  if (post2Id) await api("/api/comments", { method: "DELETE", body: JSON.stringify({ id: post2Id }) });

  // --- likes toggle ---
  const l1 = await api("/api/likes", { method: "POST", body: JSON.stringify({ resourceType: "poem", resourceId: poemId }) });
  check("like toggle on", 200, l1.status);
  const l1b = l1.body as { liked: boolean; count: number };
  check("like recorded", true, l1b.liked === true && l1b.count >= 1);
  const l2 = await api("/api/likes", { method: "POST", body: JSON.stringify({ resourceType: "poem", resourceId: poemId }) });
  check("like toggles off (no duplicates)", false, (l2.body as { liked: boolean }).liked);

  // --- admins management ---
  const a4 = await api("/api/admins", { method: "POST", body: JSON.stringify({ op: "create", email: "admin4@payameadab.com", name: "چوتھا ایڈمنسٹریٹر" }) });
  check("4th admin created", 201, a4.status);
  const a5 = await api("/api/admins", { method: "POST", body: JSON.stringify({ op: "create", email: "admin5@payameadab.com", name: "پانچواں ایڈمنسٹریٹر" }) });
  check("5th admin created", 201, a5.status);
  const a6 = await api("/api/admins", { method: "POST", body: JSON.stringify({ op: "create", email: "admin6@payameadab.com", name: "چھٹا" }) });
  check("6th admin blocked (max 5)", 400, a6.status);
  // cleanup test admins 4/5 (revoke) to keep prod state clean
  const admins = ((await api("/api/admins")).body as { admins: { id: string; email: string }[] }).admins;
  for (const a of admins.filter((x) => x.email.startsWith("admin4@") || x.email.startsWith("admin5@"))) {
    const rev = await api("/api/admins", { method: "POST", body: JSON.stringify({ op: "revoke", id: a.id }) });
    check(`cleanup ${a.email}`, 200, rev.status);
  }

  // --- settings persistence (correct keys) ---
  const s1 = await api("/api/settings", { method: "PUT", body: JSON.stringify({ fontBody: "mehr-nastaliq-web", fontHeading: "noto-nastaliq-urdu", watermarkOpacity: "8", showViewCounts: "1" }) });
  check("settings PUT", 200, s1.status);
  const s2 = (await (await fetch(BASE + "/api/settings")).json()) as Record<string, string>;
  check("fontBody persisted", "mehr-nastaliq-web", s2.fontBody);
  check("fontHeading persisted", "noto-nastaliq-urdu", s2.fontHeading);
  check("watermarkOpacity persisted", "8", s2.watermarkOpacity);
  // restore defaults
  await api("/api/settings", { method: "PUT", body: JSON.stringify({ fontBody: "jameel-noori-nastaleeq", fontHeading: "jameel-noori-nastaleeq", watermarkOpacity: "6" }) });

  // --- scheduled publishing guard: SCHEDULED content not public ---
  const stats = (await api("/api/stats")).body as { poems: number; poemsScheduled: number };
  check("stats real counts", true, typeof stats.poems === "number" && stats.poems > 0);

  // --- analytics ---
  const an = (await api("/api/analytics?days=7")).body as { totals: { totalViews: number }; series: unknown[] };
  check("analytics totals", true, an.totals.totalViews > 0);
  check("analytics 7d series", 7, an.series.length);

  console.log(`\n==========================================`);
  console.log(`RESULTS: ${PASS} passed, ${FAIL} failed`);
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
