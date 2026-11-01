const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const shots = [
    { url: "http://localhost:3000/", name: "home-desktop", vp: { width: 1400, height: 900 } },
    { url: "http://localhost:3000/admin/login", name: "admin-login", vp: { width: 1400, height: 900 } },
    { url: "http://localhost:3000/", name: "home-mobile", vp: { width: 390, height: 844 }, mobile: true },
  ];
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: s.vp, isMobile: !!s.mobile, hasTouch: !!s.mobile });
    const page = await ctx.newPage();
    await page.goto(s.url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `/tmp/pea-${s.name}.png` });
    await ctx.close();
    console.log(`shot: ${s.name}`);
  }
  // admin dashboard requires session — login via UI
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "mdnematullah1343@gmail.com");
  await page.fill('input[type="password"]', "darulhuda");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin**", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log("after login URL:", page.url());
  await page.screenshot({ path: "/tmp/pea-admin-dashboard.png", fullPage: false });
  // poem detail with watermark
  const poems = await (await fetch("http://localhost:3000/api/poems")).json();
  await page.goto(`http://localhost:3000/poetry/${poems[0].id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/pea-poem-detail.png" });
  await ctx.close();
  await browser.close();
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
