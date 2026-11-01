// Visual check v2: proper ad images in both slots + admin pages with browser login
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  // setup: login + create ads in both slots with the proper 300x600 test image
  const loginRes = await fetch("http://localhost:3000/api/auth/admin-login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mdnematullah1343@gmail.com", password: "darulhuda" }),
  });
  const cookie = (loginRes.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");

  const upFd = new FormData();
  upFd.append("file", new File([fs.readFileSync("/tmp/test-ad.png")], "ad.png", { type: "image/png" }));
  const up = await fetch("http://localhost:3000/api/upload", { method: "POST", body: upFd, headers: { cookie } });
  const upData = await up.json();

  // clean old test ads, create fresh ones in both slots
  const adsRes = await fetch("http://localhost:3000/api/ads");
  const existing = await adsRes.json();
  for (const ad of [...(existing.left ?? []), ...(existing.right ?? [])]) {
    await fetch(`http://localhost:3000/api/ads?id=${ad.id}`, { method: "DELETE", headers: { cookie } });
  }
  await fetch("http://localhost:3000/api/ads", {
    method: "POST", headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ title: "دایاں اشتہار (ٹیسٹ)", imageUrl: upData.url, slot: "RIGHT", active: true }),
  });
  await fetch("http://localhost:3000/api/ads", {
    method: "POST", headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ title: "بایاں اشتہار (ٹیسٹ)", imageUrl: upData.url, slot: "LEFT", active: true }),
  });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1720, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // homepage with both ad rails
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/render/home-wide2.png" });

  // admin: browser login then pages
  await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"], input[name="email"]', "mdnematullah1343@gmail.com");
  await page.fill('input[type="password"]', "darulhuda");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 15000 }).catch(() => {});
  await page.goto("http://localhost:3000/admin/ads", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/render/admin-ads2.png" });
  await page.goto("http://localhost:3000/admin/mail", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/render/admin-mail2.png" });

  console.log("JS errors:", errors.length === 0 ? "none" : errors);
  await browser.close();
})();
