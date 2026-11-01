/* Verification of the 3 gap features: mail template editing, DB backup, custom colors */
const BASE = "http://localhost:3000";
let cookie = "";
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log("  PASS:", msg); }
  else { fail++; console.log("  FAIL:", msg); }
}
async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}), ...(opts.headers || {}) },
  });
  const setc = res.headers.get("set-cookie");
  if (setc) cookie = setc.split(";")[0];
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { res, body };
}

async function main() {
  console.log("== admin login ==");
  let r = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "mdnematullah1343@gmail.com", password: "darulhuda" }) });
  ok(r.res.status === 200, "admin login");

  console.log("== 1. custom colors ==");
  r = await api("/api/settings", { method: "PUT", body: JSON.stringify({ colorPrimary: "#8b1e3f" }) });
  ok(r.res.status === 200, "custom primary color saved");
  let html = await (await fetch(BASE + "/")).text();
  ok(html.includes("#8b1e3f"), "custom color present in homepage CSS vars");
  ok(html.includes("--primary:#8b1e3f"), "--primary overridden");
  // reset
  r = await api("/api/settings", { method: "PUT", body: JSON.stringify({ colorPrimary: "" }) });
  ok(r.res.status === 200, "custom color reset");
  html = await (await fetch(BASE + "/")).text();
  ok(!html.includes("#8b1e3f"), "reset → preset color back");

  console.log("== 2. mail template editing ==");
  const customBody = "محترم جناب [مصنف کا نام] صاحب،\nآپ کی تحریر **’’[تحریر کا عنوان]‘‘** [سائٹ کا نام] پر شائع ہو گئی ہے۔\n[لنک]\n[وجہ]";
  r = await api("/api/settings", { method: "PUT", body: JSON.stringify({ mailTpl_PUBLISHED_subject: "کسٹم اشاعت اطلاع", mailTpl_PUBLISHED_body: customBody }) });
  ok(r.res.status === 200, "custom PUBLISHED template saved");
  // settings GET must return template keys so editor can load them
  r = await api("/api/settings");
  ok(r.body?.mailTpl_PUBLISHED_subject === "کسٹم اشاعت اطلاع", "template readable via settings API");

  // trigger publish flow: register a user, verify, submit, publish
  const email = `tpl${Date.now()}@testmail.pk`;
  r = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "ٹیمپلیٹ مصنف", email, password: "Parol123!" }) });
  ok(r.res.status === 201, "register user for template test");
  const newUserId = r.body?.id;
  // admin manually verify
  if (newUserId) {
    const saved = cookie; cookie = "";
    await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "mdnematullah1343@gmail.com", password: "darulhuda" }) });
    r = await api("/api/users-actions", { method: "POST", body: JSON.stringify({ op: "verify", id: newUserId }) });
    ok(r.res.status === 200, "admin verified user");
    cookie = saved;
  } else {
    ok(false, "register response contained user id");
  }
  // login as user
  cookie = "";
  r = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: "Parol123!" }) });
  ok(r.res.status === 200, "user login");
  r = await api("/api/articles", { method: "POST", body: JSON.stringify({ title: "ٹیمپلیٹ آزمائشی مضمون", content: "یہ متن صرف ٹیمپلیٹ جانچ کے لیے ہے۔", category: "ادبی مضامین", authorName: "ٹیمپلیٹ مصنف" }) });
  ok(r.res.status === 201, "user submitted article");
  const artId = r.body?.id ?? r.body?.article?.id;

  // admin publishes with message
  cookie = "";
  await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "mdnematullah1343@gmail.com", password: "darulhuda" }) });
  r = await api(`/api/articles`, { method: "PATCH", body: JSON.stringify({ id: artId, status: "PUBLISHED", feedback: "بہت خوب! اعزازی اشاعت۔" }) });
  ok(r.res.status === 200, "published with admin message");

  // latest mail for the user should use the CUSTOM template with placeholders replaced
  const mails = (await api("/api/mail")).body;
  const row = (mails?.logs ?? []).find((m) => m.toEmail === email && m.kind === "PUBLISHED");
  if (row) {
    ok(row.subject === "کسٹم اشاعت اطلاع", "custom subject used");
    // fetch full body via the single-mail preview endpoint
    const detail = (await api(`/api/mail?id=${row.id}`)).body;
    const body = detail?.bodyHtml ?? "";
    ok(body.includes("ٹیمپلیٹ مصنف"), "placeholder [مصنف کا نام] replaced with author name");
    ok(body.includes("ٹیمپلیٹ آزمائشی مضمون"), "placeholder [تحریر کا عنوان] replaced with title");
    ok(body.includes("پیامِ ادب"), "placeholder [سائٹ کا نام] replaced with site name");
    ok(body.includes("<b>’’ٹیمپلیٹ آزمائشی مضمون‘‘</b>"), "**bold** rendered");
    ok(body.includes("بہت خوب! اعزازی اشاعت۔"), "admin message [وجہ] rendered");
    ok(body.includes("http"), "reading link present");
    ok(!body.includes("[مصنف کا نام]"), "no raw placeholder left");
  } else {
    ok(false, "PUBLISHED mail row found for custom template check");
  }

  // restore original template
  r = await api("/api/settings", { method: "PUT", body: JSON.stringify({ mailTpl_PUBLISHED_subject: "", mailTpl_PUBLISHED_body: "" }) });
  ok(r.res.status === 200, "template restored to built-in");

  console.log("== 3. database backup ==");
  // unauthenticated must be blocked
  const savedCookie = cookie; cookie = "";
  r = await api("/api/backup", { method: "POST" });
  ok(r.res.status === 403, "unauthenticated backup blocked (403)");
  cookie = savedCookie;

  r = await api("/api/backup", { method: "POST" });
  ok(r.res.status === 200 && r.body?.ok, "backup created via POST");
  const bkName = r.body?.name;
  ok(/^payameadab-\d{4}-\d{2}-\d{2}-\d{6}\.db$/.test(bkName ?? ""), "backup file name format");

  r = await api("/api/backup");
  ok(r.res.status === 200 && (r.body?.backups ?? []).some((b) => b.name === bkName), "backup listed");

  const dl = await fetch(`${BASE}/api/backup?file=${encodeURIComponent(bkName)}`, { headers: { cookie } });
  ok(dl.status === 200, "backup download 200");
  const buf = Buffer.from(await dl.arrayBuffer());
  ok(buf.length > 10000 && buf.slice(0, 15).toString().startsWith("SQLite format 3"), `backup is a valid SQLite file (${buf.length} bytes)`);

  // traversal guard
  r = await api(`/api/backup?file=../.env`, { method: "GET" });
  ok(r.res.status === 404, "path traversal blocked");

  r = await api(`/api/backup?file=${encodeURIComponent(bkName)}`, { method: "DELETE" });
  ok(r.res.status === 200, "backup deleted");

  console.log("== cleanup ==");
  // delete test article + user + maillogs
  await api(`/api/articles/${artId}`, { method: "DELETE" });
  const { PrismaClient } = require("@prisma/client");
  const p = new PrismaClient();
  await p.mailLog.deleteMany({ where: { toEmail: email } });
  const tu = await p.user.findUnique({ where: { email } });
  if (tu) await p.user.delete({ where: { id: tu.id } });
  // remove backup artifacts from test-vacuum
  await p.$disconnect();
  console.log("cleanup done");

  console.log("==========================================");
  console.log(`RESULTS: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
