const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  // 1. login as admin
  await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "mdnematullah1343@gmail.com");
  await page.fill('input[type="password"]', "darulhuda");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 15000 });

  // 2. screenshot key admin pages
  const adminPages = ["analytics", "appearance", "homepage", "settings", "admins", "submissions", "comments"];
  for (const p of adminPages) {
    await page.goto(`http://localhost:3000/admin/${p}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/tmp/pea-admin-${p}.png` });
    console.log(`admin/${p} ✓`);
  }
  await browser.close();

  // 3. print page -> PDF (verify watermark embedded in downloadable output)
  const b2 = await chromium.launch();
  const poems = await (await fetch("http://localhost:3000/api/poems")).json();
  const p2 = await b2.newPage();
  await p2.goto(`http://localhost:3000/poetry/${poems[0].id}/print`, { waitUntil: "networkidle" });
  await p2.waitForTimeout(1500);
  await p2.pdf({ path: "/tmp/pea-print-test.pdf", format: "A4", printBackground: true });
  await b2.close();
  console.log("print PDF generated");
})().catch((e) => { console.error(e); process.exit(1); });
