/**
 * End-to-end acceptance test for the Payam-e-Adab upgrade:
 * ads, email pipeline, verification, moderation messages, permissions,
 * books-on-homepage, dashboard flows.
 */
const BASE = "http://localhost:3000";
let PASS = 0, FAIL = 0;
function check(name, expected, actual) {
  const ok = JSON.stringify(expected) === JSON.stringify(actual);
  console.log(`  ${ok ? "PASS" : "FAIL"}: ${name}${ok ? "" : ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`);
  ok ? PASS++ : FAIL++;
}

async function api(path, opts = {}, cookie) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}), ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* html */ }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, body, setCookie };
}

(async () => {
  console.log("== 1. admin login ==");
  const login = await api("/api/auth/admin-login", { method: "POST", body: JSON.stringify({ email: "mdnematullah1343@gmail.com", password: "darulhuda" }) });
  const adminCookie = login.setCookie.map((c) => c.split(";")[0]).join("; ");
  check("admin login", 200, login.status);

  console.log("== 2. books publish → homepage (regression fix) ==");
  const bookRes = await api("/api/books", { method: "POST", body: JSON.stringify({ title: "آزمائشی کتاب — E2E", author: "ٹیسٹ مصنف", category: "تحقیق", description: "خودکار جانچ کے لیے بنائی گئی کتاب۔" }) }, adminCookie);
  check("book created via admin API (was 404)", 201, bookRes.status);
  const homeHtml = await (await fetch(BASE + "/")).text();
  check("new book visible on homepage", true, homeHtml.includes("آزمائشی کتاب — E2E"));
  const bookEdit = await api(`/api/books/${bookRes.body.id}`, { method: "PATCH", body: JSON.stringify({ title: "آزمائشی کتاب — E2E (ترمیم)" }) }, adminCookie);
  check("book edit reflected", "آزمائشی کتاب — E2E (ترمیم)", bookEdit.body?.title);
  const homeHtml2 = await (await fetch(BASE + "/")).text();
  check("edited title on homepage", true, homeHtml2.includes("آزمائشی کتاب — E2E (ترمیم)"));

  console.log("== 3. upload endpoint (was 404) ==");
  const pngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  const fd = new FormData();
  fd.append("file", new File([Buffer.from(pngB64, "base64")], "t.png", { type: "image/png" }));
  const up = await fetch(BASE + "/api/upload", { method: "POST", body: fd, headers: { cookie: adminCookie } });
  const upData = await up.json();
  check("upload works", 201, up.status);
  check("upload returns url", true, typeof upData.url === "string" && upData.url.startsWith("/uploads/"));
  const upFetch = await fetch(BASE + upData.url);
  check("uploaded file served", 200, upFetch.status);

  console.log("== 4. registration + email verification flow ==");
  const email = `writer${Date.now()}@testmail.pk`;
  const reg = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "آزمائشی مصنف", email, password: "test@1234" }) });
  check("register 201", 201, reg.status);
  check("needsVerification true", true, reg.body?.needsVerification === true);
  const userCookie = reg.setCookie.map((c) => c.split(";")[0]).join("; ");

  // unverified user blocked from submitting
  const blocked = await api("/api/articles", { method: "POST", body: JSON.stringify({ title: "X", content: "Y" }) }, userCookie);
  check("unverified submit blocked 403", 403, blocked.status);

  // verification email logged
  const mail1 = await api("/api/mail", {}, adminCookie);
  const verifyMail = mail1.body.logs.find((l) => l.kind === "VERIFY" && l.toEmail === email);
  check("VERIFY email logged", true, !!verifyMail);
  check("email status PENDING (no SMTP yet)", "PENDING", verifyMail?.status);

  // extract token from stored mail body via DB-ish trick: use admin users list + manual verify path instead
  const users = await api("/api/users?all=1", {}, adminCookie);
  const newUser = (users.body ?? []).find((u) => u.email === email);
  check("user appears in admin users list", true, !!newUser);
  check("user shows unverified", false, newUser?.emailVerified);
  const verifyOp = await api("/api/users-actions", { method: "POST", body: JSON.stringify({ id: newUser.id, op: "verify" }) }, adminCookie);
  check("admin manual verify ok", 200, verifyOp.status);

  // me now verified
  const me = await api("/api/auth/me", {}, userCookie);
  check("me.emailVerified true", true, me.body?.emailVerified === true);

  console.log("== 5. submission → moderation message → email ==");
  const art = await api("/api/articles", { method: "POST", body: JSON.stringify({ title: "آزمائشی مضمون — E2E", content: "یہ خودکار جانچ کا مضمون ہے۔ " .repeat(5), category: "ادبی مضامین" }) }, userCookie);
  check("verified user can submit", 201, art.status);

  // reject without message must fail
  const noMsg = await api("/api/articles", { method: "PATCH", body: JSON.stringify({ id: art.body.id, status: "REJECTED" }) }, adminCookie);
  check("reject without message → 400", 400, noMsg.status);

  // publish with personal message
  const pub = await api("/api/articles", { method: "PATCH", body: JSON.stringify({ id: art.body.id, status: "PUBLISHED", feedback: "بہت خوبصورت تحریر ہے — شائع کر دی گئی۔ مبارک ہو!" }) }, adminCookie);
  check("publish with message 200", 200, pub.status);

  // publication email logged with the admin's message
  const mail2 = await api("/api/mail", {}, adminCookie);
  const pubMail = mail2.body.logs.find((l) => l.kind === "PUBLISHED" && l.toEmail === email);
  check("PUBLISHED email logged", true, !!pubMail);
  const mailRowFull = (await api(`/api/mail`, {}, adminCookie)).body.logs.find((l) => l.id === pubMail?.id);
  check("email subject correct", "آپ کی تحریر پیامِ ادب پر شائع ہو گئی!", mailRowFull?.subject);

  // content visible publicly
  const artPage = await fetch(`${BASE}/articles/${art.body.id}`);
  check("published article page 200", 200, artPage.status);
  const artHtml = await artPage.text();
  check("article on public page", true, artHtml.includes("آزمائشی مضمون — E2E"));
  const homeHtml3 = await (await fetch(BASE + "/")).text();
  check("published article on homepage تازہ مضامین", true, homeHtml3.includes("آزمائشی مضمون — E2E"));

  console.log("== 6. pending content stays hidden ==");
  const draft = await api("/api/articles", { method: "POST", body: JSON.stringify({ title: "چھپا ہوا مضمون E2E", content: "خفیہ متن" }) }, userCookie);
  const homeHtml4 = await (await fetch(BASE + "/")).text();
  check("pending article NOT on homepage", false, homeHtml4.includes("چھپا ہوا مضمون E2E"));
  const draftPage = await fetch(`${BASE}/articles/${draft.body.id}`);
  check("pending article detail 404", 404, draftPage.status);

  console.log("== 7. advertisements ==");
  const ad = await api("/api/ads", { method: "POST", body: JSON.stringify({ title: "آزمائشی اشتہار", imageUrl: upData.url, linkUrl: "https://example.com", slot: "RIGHT", sortOrder: 0, active: true }) }, adminCookie);
  check("ad created", 201, ad.status);
  const homeHtml5 = await (await fetch(BASE + "/")).text();
  check("ad image on homepage", true, homeHtml5.includes(upData.url));
  await api("/api/ads", { method: "PATCH", body: JSON.stringify({ id: ad.body.id, active: false }) }, adminCookie);
  const homeHtml6 = await (await fetch(BASE + "/")).text();
  check("deactivated ad hidden", false, homeHtml6.includes(upData.url));

  console.log("== 8. admin permissions ==");
  const a4 = await api("/api/admins", { method: "POST", body: JSON.stringify({ op: "create", email: `perm${Date.now()}@payameadab.com`, name: "محدود ایڈمن", permissions: "content,submissions" }) }, adminCookie);
  check("restricted admin created", 201, a4.status);
  const a4login = await api("/api/auth/admin-login", { method: "POST", body: JSON.stringify({ email: a4.body.email, password: "darulhuda" }) });
  const a4cookie = a4login.setCookie.map((c) => c.split(";")[0]).join("; ");
  check("restricted admin login", 200, a4login.status);
  const a4ads = await api("/api/ads", { method: "POST", body: JSON.stringify({ title: "X", imageUrl: "/uploads/x.png" }) }, a4cookie);
  check("restricted admin blocked from ads (403)", 403, a4ads.status);
  const a4mail = await api("/api/mail", {}, a4cookie);
  check("restricted admin blocked from mail (403)", 403, a4mail.status);
  const a4book = await api("/api/books", { method: "POST", body: JSON.stringify({ title: "اجازت شدہ کتاب", author: "X" }) }, a4cookie);
  check("restricted admin CAN manage content", 201, a4book.status);
  const a4admins = await api("/api/admins", { method: "POST", body: JSON.stringify({ op: "create", email: "z@z.com", name: "Z" }) }, a4cookie);
  check("restricted admin blocked from admins (403)", 403, a4admins.status);

  console.log("== 9. mail resend + test ==");
  const testMail = await api("/api/mail", { method: "POST", body: JSON.stringify({ op: "send-test", to: "admin@testmail.pk" }) }, adminCookie);
  check("test mail op ok", 200, testMail.status);
  const resend = await api("/api/mail", { method: "POST", body: JSON.stringify({ op: "resend", id: pubMail.id }) }, adminCookie);
  check("resend op ok", 200, resend.status);

  console.log("== 10. cleanup ==");
  await api(`/api/books/${bookRes.body.id}`, { method: "DELETE" }, adminCookie);
  await api(`/api/books/${a4book.body.id}`, { method: "DELETE" }, adminCookie);
  await api(`/api/articles/${art.body.id}`, { method: "DELETE" }, adminCookie);
  await api(`/api/articles/${draft.body.id}`, { method: "DELETE" }, adminCookie);
  await api(`/api/ads?id=${ad.body.id}`, { method: "DELETE" }, adminCookie);
  await api("/api/admins", { method: "POST", body: JSON.stringify({ op: "revoke", id: a4.body.id }) }, adminCookie);
  console.log("  cleanup done");

  console.log(`\n==========================================`);
  console.log(`RESULTS: ${PASS} passed, ${FAIL} failed`);
  process.exit(FAIL ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
