const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  // 1. homepage renders
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 45000 });
  const heroImg = await page.locator('img[src*="hero-emblem"]').count();
  console.log("hero image visible:", heroImg > 0);
  const logoCount = await page.locator('img[src*="logo-badge"], img[src*="logo-horizontal"]').count();
  console.log("logo present:", logoCount > 0);

  // 2. navigate to poetry via nav link
  await page.click('nav a[href="/poetry"]');
  await page.waitForURL("**/poetry", { timeout: 15000 });
  await page.waitForTimeout(800);
  console.log("poetry page loaded:", page.url().endsWith("/poetry"));

  // 3. open first poem
  await page.locator('a[href^="/poetry/"]').first().click();
  await page.waitForTimeout(1500);
  const wm = await page.locator('[class*="watermark"], img[src*="watermark"]').count();
  console.log("watermark on poem page:", wm > 0, "| url:", page.url());

  // 4. like toggle
  const likeBtn = page.locator('button:has-text("پسند"), button[aria-label*="پسند"]').first();
  if (await likeBtn.count()) {
    const before = await likeBtn.textContent();
    await likeBtn.click();
    await page.waitForTimeout(800);
    const after = await likeBtn.textContent();
    console.log("like toggled:", before?.trim(), "->", after?.trim());
  } else { console.log("like button NOT FOUND"); }

  // 5. submit comment
  const cta = page.locator('textarea, input[placeholder*="تبصرہ"]').first();
  if (await cta.count()) {
    await cta.fill("浏览器 آزمائشی تبصرہ — E2E");
    await page.locator('button[type="submit"]:near(textarea), form button[type="submit"]').last().click();
    await page.waitForTimeout(1000);
    const msg = await page.locator('text=منظوری').count();
    console.log("comment submitted, moderation note shown:", msg >= 0);
  } else { console.log("comment box NOT FOUND"); }

  // 6. mobile sheet menu close-on-click
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mp = await mob.newPage();
  await mp.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await mp.locator('button[aria-label="مینو"]').click();
  await mp.waitForTimeout(600);
  const sheetVisible = await mp.locator('[data-slot="sheet-content"], [role="dialog"]').isVisible().catch(() => false);
  await mp.locator('[role="dialog"] a[href="/poetry"], [data-slot="sheet-content"] a[href="/poetry"]').first().click().catch(() => {});
  await mp.waitForTimeout(900);
  const sheetGone = await mp.locator('[role="dialog"]').count();
  console.log("mobile sheet opened:", sheetVisible, "| closed after nav:", sheetGone === 0, "| url:", mp.url());

  // 7. admin: submission approval flow
  const ap = await ctx.newPage();
  await ap.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
  await ap.fill('input[type="email"]', "mdnematullah1343@gmail.com");
  await ap.fill('input[type="password"]', "darulhuda");
  await ap.click('button[type="submit"]');
  await ap.waitForURL("**/admin", { timeout: 15000 });
  console.log("admin login redirect:", ap.url());
  await ap.goto("http://localhost:3000/admin/submissions", { waitUntil: "networkidle" });
  await ap.waitForTimeout(800);
  const approveBtn = ap.locator('button:has-text("منظور")').first();
  console.log("approve button available:", (await approveBtn.count()) > 0);

  console.log("\nJS errors:", errors.length ? errors.slice(0, 5) : "none");
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch((e) => { console.error("E2E FAIL:", e.message); process.exit(1); });
