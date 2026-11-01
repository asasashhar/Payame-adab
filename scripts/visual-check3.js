// Visual check: homepage with ads + new design, admin mail center, ads page
const { chromium } = require("playwright");

(async () => {
  // --- setup via plain fetch ---
  const loginRes = await fetch("http://localhost:3000/api/auth/admin-login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mdnematullah1343@gmail.com", password: "darulhuda" }),
  });
  const cookie = (loginRes.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const adImg = Buffer.from(
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAHgAtoBAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==",
    "base64"
  );
  const upFd = new FormData();
  upFd.append("file", new File([adImg], "ad.jpg", { type: "image/jpeg" }));
  const up = await fetch("http://localhost:3000/api/upload", { method: "POST", body: upFd, headers: { cookie } });
  const upData = await up.json();
  await fetch("http://localhost:3000/api/ads", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ title: "ویژوئل ٹیسٹ اشتہار", imageUrl: upData.url, linkUrl: "https://example.com", slot: "RIGHT", active: true }),
  });

  // --- browser checks ---
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1720, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/render/home-wide.png" });

  const adVisible = await page.locator('img[alt="ویژوئل ٹیسٹ اشتہار"]').isVisible().catch(() => false);
  const heroH1 = await page.locator("h1").first().textContent();
  console.log("ad visible:", adVisible, "| hero h1:", (heroH1 || "").trim().slice(0, 40));

  await page.goto("http://localhost:3000/admin/ads", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/render/admin-ads.png" });
  await page.goto("http://localhost:3000/admin/mail", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/render/admin-mail.png" });
  await page.goto("http://localhost:3000/admin/users", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/render/admin-users.png" });

  const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mp.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await mp.screenshot({ path: "/tmp/render/home-mobile.png" });

  console.log("JS errors:", errors.length === 0 ? "none" : errors);
  await browser.close();
})();
