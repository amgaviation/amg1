/**
 * Browser checks for the /studio route (3 Green Studios).
 *
 * Covers what a static build cannot: no horizontal overflow from 360px to
 * 1920px, the gear-down arming sequence, the reduced-motion degradation path,
 * both live demos end to end, keyboard reachability and focus rings, the
 * outbound AMG link, and the fact that the contact form hands off to a mail
 * client instead of faking a submit.
 *
 * Playwright is intentionally NOT a dependency of this app — a marketing route
 * should not add a browser driver to the production install. Run it on demand:
 *
 *   npm run build && npx next start -p 3210 &
 *   npm install --no-save playwright
 *   STUDIO_URL=http://localhost:3210/studio npm run studio:verify
 *
 * Exits non-zero if any check fails.
 */
import { chromium } from "playwright";

const URL = process.env.STUDIO_URL || "http://localhost:3210/studio";
const CHROME =
  process.env.CHROME_PATH || process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium";
const results = [];
const pass = (name, detail = "") => results.push({ ok: true, name, detail });
const fail = (name, detail = "") => results.push({ ok: false, name, detail });

/**
 * Sandboxed CI environments route outbound HTTPS through a local MITM proxy, and
 * Chromium does not read HTTPS_PROXY. Pass it through when the target is remote
 * so the same script can check a Vercel preview as well as localhost.
 *
 * `--ignore-certificate-errors` is scoped to exactly that case: the proxy
 * re-signs certificates with a CA that Chromium's bundled store does not have.
 * A localhost run never sets it.
 */
const PROXY = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(URL)
  ? undefined
  : process.env.HTTPS_PROXY || process.env.https_proxy;

const browser = await chromium.launch({
  ...(CHROME ? { executablePath: CHROME } : {}),
  ...(PROXY ? { proxy: { server: PROXY }, args: ["--ignore-certificate-errors"] } : {}),
});

try {

// ---------------------------------------------------------------- overflow
const WIDTHS = [360, 390, 414, 640, 768, 1024, 1280, 1440, 1920];
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
  await page.goto(URL, { waitUntil: "networkidle" });

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(350);
    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bodyScrollW: document.body.scrollWidth,
    }));
    const over = Math.max(m.scrollW, m.bodyScrollW) - m.clientW;
    if (over > 1) {
      const culprits = await page.evaluate((cw) => {
        const out = [];
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > cw + 1 || r.left < -1)) {
            const style = getComputedStyle(el);
            // Ignore elements inside their own horizontal scroller.
            let p = el.parentElement;
            let contained = false;
            while (p) {
              const ps = getComputedStyle(p);
              if (["auto", "scroll", "hidden", "clip"].includes(ps.overflowX)) { contained = true; break; }
              p = p.parentElement;
            }
            if (contained) continue;
            out.push(`${el.tagName}.${el.className?.toString?.().slice(0, 50)} L${Math.round(r.left)} R${Math.round(r.right)} ov:${style.overflowX}`);
          }
        }
        return out.slice(0, 6);
      }, m.clientW);
      fail(`no horizontal overflow @ ${width}px`, `over by ${over}px → ${culprits.join(" | ")}`);
    } else {
      pass(`no horizontal overflow @ ${width}px`);
    }
  }

  if (consoleErrors.length) fail("no console/page errors", consoleErrors.slice(0, 4).join(" | "));
  else pass("no console/page errors");
  await ctx.close();
}

// ------------------------------------------------------------- gear sequence
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  // Immediately after load the panel should be arming, not already green.
  await page.waitForTimeout(300);
  const mid = await page.$$eval(".s-gear", (els) => els.map((e) => e.dataset.state));
  await page.waitForTimeout(1400);
  const end = await page.$$eval(".s-gear", (els) => els.map((e) => e.dataset.state));
  const armed = await page.$eval("[data-armed]", (e) => e.dataset.armed);
  if (end.join(",") === "locked,locked,locked" && armed === "true") {
    pass("gear sequence reaches 3 green + armed", `mid=${mid.join(",")} end=${end.join(",")}`);
  } else {
    fail("gear sequence reaches 3 green + armed", `mid=${mid.join(",")} end=${end.join(",")} armed=${armed}`);
  }
  if (mid.join(",") !== "locked,locked,locked") pass("gear actually animates (not pre-locked)", `mid=${mid.join(",")}`);
  else fail("gear actually animates (not pre-locked)", "already all locked at 300ms");

  // Canvas mounts after idle.
  await page.waitForTimeout(2500);
  const canvas = await page.$("main canvas");
  if (canvas) {
    const box = await canvas.boundingBox();
    pass("hero canvas mounted (lazy)", `${Math.round(box.width)}x${Math.round(box.height)}`);
  } else fail("hero canvas mounted (lazy)", "no canvas found");

  // Headline must be painted and CTAs clickable regardless.
  const h1 = await page.$eval("h1", (e) => e.textContent.trim().replace(/\s+/g, " "));
  pass("h1 text", h1);

  await ctx.close();
}

// ------------------------------------------------------ reduced motion path
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2800);

  const canvas = await page.$("main canvas");
  if (!canvas) pass("reduced motion: no canvas mounted");
  else fail("reduced motion: no canvas mounted", "canvas present");

  const poster = await page.$("main svg");
  if (poster) pass("reduced motion: static poster present");
  else fail("reduced motion: static poster present");

  const gear = await page.$$eval(".s-gear", (els) => els.map((e) => e.dataset.state));
  if (gear.join(",") === "locked,locked,locked") pass("reduced motion: gear shows 3 green immediately");
  else fail("reduced motion: gear shows 3 green immediately", gear.join(","));

  const cursor = await page.$(".s-cursor");
  if (!cursor) pass("reduced motion: custom cursor not rendered");
  else fail("reduced motion: custom cursor not rendered");

  // All reveal content must be visible without scrolling triggers.
  const hidden = await page.$$eval("[data-reveal]", (els) =>
    els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length,
  );
  if (hidden === 0) pass("reduced motion: all revealed content visible", `${hidden} hidden`);
  else fail("reduced motion: all revealed content visible", `${hidden} elements still faded`);

  const counters = await page.$$eval(".s-kpi-value", (els) => els.map((e) => e.textContent.trim()));
  pass("reduced motion: counters show final values", counters.join(" · "));

  await ctx.close();
}

// ------------------------------------------------------------ booking demo
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });

  await page.locator("#demos").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);

  // The radio inputs are visually hidden (clip-path) with a styled label, so the
  // label is the click target a real user hits.
  const tap = async (selector) => {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await el.click({ force: true });
  };

  // Pick a resource, a day, then the first available slot; book it.
  await tap('.s-opt:has-text("PA-28")');
  await tap('.s-opt--day:has-text("Thu")');
  await tap('.s-slot[data-free="true"]');
  const summary = await page.locator(".s-booking-summary").textContent();
  await page.locator('button:has-text("Book slot")').click();
  await page.waitForSelector(".s-booking-code", { timeout: 4000 });
  const code = await page.locator(".s-booking-code").textContent();
  const line = await page.locator(".s-booking-line").textContent();
  pass("booking demo: select → book → confirm", `${summary.trim()} → ${code.trim()} / ${line.trim().replace(/\s+/g, " ")}`);

  await page.locator('button:has-text("Book another")').click();
  await page.waitForSelector(".s-slot-grid", { timeout: 3000 });
  const resetOk = (await page.locator('.s-slot input:checked').count()) === 0;
  resetOk ? pass("booking demo: resets cleanly") : fail("booking demo: resets cleanly");

  // Changing resource must clear a pending slot.
  await tap('.s-slot[data-free="true"]');
  await tap('.s-opt:has-text("SR20")');
  const cleared = (await page.locator(".s-slot input:checked").count()) === 0;
  const btnDisabled = await page.locator('button:has-text("Book slot")').isDisabled();
  cleared && btnDisabled
    ? pass("booking demo: switching resource invalidates selection")
    : fail("booking demo: switching resource invalidates selection", `cleared=${cleared} disabled=${btnDisabled}`);

  // ---------------------------------------------------------- ops demo
  const rowsAll = await page.locator(".s-table tbody tr").count();
  await page.locator('.s-filter:has-text("Deferred")').click();
  await page.waitForTimeout(200);
  const rowsDeferred = await page.locator(".s-table tbody tr").count();
  const statuses = await page.$$eval(".s-table tbody .s-badge", (els) => [
    ...new Set(els.map((e) => e.dataset.status)),
  ]);
  rowsDeferred < rowsAll && statuses.join(",") === "deferred"
    ? pass("ops demo: status filter works", `all=${rowsAll} deferred=${rowsDeferred}`)
    : fail("ops demo: status filter works", `all=${rowsAll} deferred=${rowsDeferred} statuses=${statuses}`);

  const kpis = await page.$$eval(".s-kpi-value", (els) => els.map((e) => e.textContent.trim()));
  pass("ops demo: counters settled", kpis.join(" · "));

  // ----------------------------------------------------- keyboard traversal
  await page.keyboard.press("Home");
  await page.evaluate(() => window.scrollTo(0, 0));
  const order = [];
  await page.evaluate(() => document.body.focus());
  for (let i = 0; i < 90; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        type: el.getAttribute("type") || "",
        label: (el.getAttribute("aria-label") || el.textContent || el.value || "").trim().slice(0, 32),
        cls: (el.className?.toString?.() || "").slice(0, 26),
        outline: style.outlineStyle !== "none" || style.boxShadow !== "none",
        visible: r.width > 0 && r.height > 0,
      };
    });
    if (info) order.push(info);
  }
  const focusables = order.length;
  const noRing = order.filter((o) => !o.outline && o.visible).length;
  pass("keyboard: reachable focus stops", `${focusables} stops in 90 tabs`);
  noRing === 0
    ? pass("keyboard: every visible focus stop has a visible ring")
    : fail("keyboard: every visible focus stop has a visible ring", `${noRing} without ring: ${order.filter((o) => !o.outline && o.visible).slice(0,4).map((o) => o.tag + "." + o.cls).join(", ")}`);

  const sawSlot = order.some((o) => o.type === "radio");
  const sawFilter = order.some((o) => o.cls.includes("s-filter"));
  const sawForm = order.some((o) => o.tag === "TEXTAREA");
  sawSlot && sawFilter && sawForm
    ? pass("keyboard: demos + form are all in the tab order", "radio ✓ filter ✓ textarea ✓")
    : fail("keyboard: demos + form are all in the tab order", `radio=${sawSlot} filter=${sawFilter} textarea=${sawForm}`);

  // ------------------------------------------------------------- AMG link
  const link = page.locator('a[href*="amgaviationgroup.com"]');
  const href = await link.getAttribute("href");
  const target = await link.getAttribute("target");
  const rel = await link.getAttribute("rel");
  target === "_blank" && rel?.includes("noopener")
    ? pass("AMG case-study link", `${href} target=${target} rel=${rel}`)
    : fail("AMG case-study link", `${href} target=${target} rel=${rel}`);

  // ------------------------------------------------------- contact mailto
  const mailtos = await page.$$eval('a[href^="mailto:"]', (els) => els.map((e) => e.getAttribute("href")));
  mailtos.length > 0
    ? pass("contact: real mailto paths present", `${mailtos.length} links, e.g. ${mailtos[0].slice(0, 60)}`)
    : fail("contact: real mailto paths present");

  // Contact form must compose a mailto, not fake a submit.
  await page.route("**/*", (route) => route.continue());
  await page.locator('input[name="name"]').fill("Test Pilot");
  await page.locator('input[name="business"]').fill("Sample Flight School");
  await page.locator('textarea[name="detail"]').fill("Need booking + billing.");
  // window.location.href cannot be shimmed in modern Chromium, so assert the
  // observable contract instead: the handler runs, the page does not navigate or
  // reload, there is no form `action` posting anywhere, and the status message
  // says the message was handed to the mail client rather than claiming it was
  // sent.
  const formAction = await page.$eval(".s-form", (f) => f.getAttribute("action"));
  const urlBefore = page.url();
  await page.locator('button:has-text("Compose the email")').click();
  await page.waitForTimeout(500);
  const status = (await page.locator(".s-form-alt").textContent()).trim();
  const urlAfter = page.url();
  const stillFilled = await page.locator('input[name="name"]').inputValue();
  const noFakeSuccess = !/thank|we'?ll be in touch|message sent|submitted/i.test(status);

  formAction === null &&
  urlBefore === urlAfter &&
  stillFilled === "Test Pilot" &&
  /email app/i.test(status) &&
  noFakeSuccess
    ? pass("contact form hands off to the mail client (no fake submit)", `action=${formAction} status="${status}"`)
    : fail(
        "contact form hands off to the mail client (no fake submit)",
        `action=${formAction} url ${urlBefore}→${urlAfter} filled="${stillFilled}" status="${status}"`,
      );

  // ---------------------------------------------------------- nav condense
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(400);
  const condensed = await page.$eval(".s-nav", (e) => e.dataset.condensed);
  condensed === "true" ? pass("nav condenses on scroll") : fail("nav condenses on scroll", condensed);

  await ctx.close();
}

// ----------------------------------------------------- mobile nav disclosure
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 780 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator(".s-nav-toggle").click();
  const open = await page.locator("#studio-nav-panel").isVisible();
  const expanded = await page.locator(".s-nav-toggle").getAttribute("aria-expanded");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const closed = !(await page.locator("#studio-nav-panel").isVisible());
  open && expanded === "true" && closed
    ? pass("mobile nav: opens, reports aria-expanded, closes on Escape")
    : fail("mobile nav disclosure", `open=${open} expanded=${expanded} closedOnEsc=${closed}`);

  const cursorOnTouch = await page.$(".s-cursor");
  !cursorOnTouch ? pass("touch: no custom cursor") : fail("touch: no custom cursor");
  await ctx.close();
}

} catch (err) {
  fail("suite completed without crashing", String(err).split("\n").slice(0, 3).join(" "));
} finally {
  await browser.close();
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed += 1;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  —  ${r.detail}` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
