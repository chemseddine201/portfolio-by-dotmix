// Verifies the built portfolio (dist/) in headless Chrome through `mix preview`, with the CDP client
// that ships in @dotmix/cli (no extra dependency). Run `npm run build` first.
// Usage: npm run verify            (screenshots go to .verify/, git-ignored)
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const portfolioDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const screenshotDirectory = path.join(portfolioDirectory, ".verify");
const cliDistDirectory = path.dirname(fileURLToPath(import.meta.resolve("@dotmix/cli")));
const { launchBrowser } = await import(new URL("browser/cdp.js", import.meta.resolve("@dotmix/cli")).href);
fs.mkdirSync(screenshotDirectory, { recursive: true });

const port = await new Promise((resolve) => {
  const server = net.createServer();
  server.listen(0, "127.0.0.1", () => {
    const { port: freePort } = server.address();
    server.close(() => resolve(freePort));
  });
});
const preview = spawn(process.execPath, [path.join(cliDistDirectory, "bin.js"), "preview", "dist", "--port", String(port), "--host", "127.0.0.1"], {
  cwd: portfolioDirectory,
  stdio: "pipe",
});
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    if ((await fetch(`http://127.0.0.1:${port}/`)).ok) break;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

const browser = await launchBrowser();
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

async function inspectRoute(page, routePath, width, height) {
  await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  page.clearConsoleErrors();
  await page.goto(`http://127.0.0.1:${port}${routePath}`);
  await page.waitForSelector("#main", { timeout: 10000 });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const state = await page.evaluate(() => ({
    title: document.title,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null,
    heading: document.querySelector("h1")?.textContent?.trim().slice(0, 60) ?? null,
    sections: document.querySelectorAll("main section").length,
    footer: document.querySelector(".site-footer")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) ?? null,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    mailLinks: document.querySelectorAll('a[href^="mailto:"]').length,
    whatsappLinks: document.querySelectorAll('a[href*="wa.me"]').length,
    facebookLinks: document.querySelectorAll('a[href*="facebook.com"]').length,
    brokenImages: Array.from(document.images).filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute("src")),
  }));
  const screenshot = await page.send("Page.captureScreenshot", { format: "png" });
  const screenshotName = `${routePath === "/" ? "home" : routePath.replaceAll("/", "")}-${width}.png`;
  fs.writeFileSync(path.join(screenshotDirectory, screenshotName), Buffer.from(screenshot.result.data, "base64"));
  const errors = page.getConsoleErrors();
  console.log(JSON.stringify({ routePath, width, ...state, errors }));
  expect(errors.length === 0, `${routePath}@${width}: console/page errors ${JSON.stringify(errors)}`);
  expect(state.overflow <= 0, `${routePath}@${width}: horizontal overflow ${state.overflow}px`);
  return state;
}

try {
  const page = await browser.newPage();
  for (const width of [1440, 390]) {
    const home = await inspectRoute(page, "/", width, 900);
    expect(home.title === "Chemseddine Z. — Fullstack Developer", `home title: ${home.title}`);
    expect(home.robots === "index, follow", `home robots: ${home.robots}`);
    expect(/last build \d{4}-\d{2}-\d{2}/.test(home.footer ?? ""), `home footer: ${home.footer}`);
    const samplers = await inspectRoute(page, "/samplers", width, 900);
    expect(samplers.title.startsWith("Samplers"), `samplers title: ${samplers.title}`);
    expect(samplers.robots === "noindex", `samplers robots: ${samplers.robots}`);
    const missing = await inspectRoute(page, "/no-such-page", width, 900);
    expect(missing.title.startsWith("Not found"), `404 title: ${missing.title}`);
    expect(missing.heading === "404", `404 heading: ${missing.heading}`);
  }

  // An in-page anchor must scroll within the same page: no route change, no re-render.
  await page.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForSelector("#main");
  const anchorResult = await page.evaluate(async () => {
    const anchor = document.querySelector('a[href^="#"]:not([href="#"]):not([href="#main"])');
    if (!anchor) return { anchor: null };
    const mainBefore = document.getElementById("main");
    anchor.click();
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      anchor: anchor.getAttribute("href"),
      sameMain: document.getElementById("main") === mainBefore,
      path: location.pathname,
      hash: location.hash,
      scrolled: window.scrollY > 0,
    };
  });
  console.log(JSON.stringify({ anchorResult }));
  expect(anchorResult.anchor === null || (anchorResult.sameMain && anchorResult.path === "/"), `anchor navigation: ${JSON.stringify(anchorResult)}`);
  expect(page.getConsoleErrors().length === 0, `anchor errors: ${JSON.stringify(page.getConsoleErrors())}`);
} finally {
  await browser.close();
  preview.kill();
}

console.log(failures.length === 0 ? "RESULT: PASS" : `RESULT: FAIL\n- ${failures.join("\n- ")}`);
process.exitCode = failures.length === 0 ? 0 : 1;
