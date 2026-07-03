import { expect, test } from "@playwright/test";

const approvedEmail = process.env.AMG_E2E_PORTAL_EMAIL ?? process.env.E2E_PORTAL_EMAIL ?? "";
const approvedPassword = process.env.AMG_E2E_PORTAL_PASSWORD ?? process.env.E2E_PORTAL_PASSWORD ?? "";
const pendingEmail = process.env.AMG_E2E_PENDING_EMAIL ?? "";
const pendingPassword = process.env.AMG_E2E_PENDING_PASSWORD ?? "";

const roleDashboardPattern = /\/portal\/(?:client|crew|admin|partner)\/dashboard/;

async function signIn(page, email, password) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
}

test.describe("AMG Connect portal intro", () => {
  test.skip(!approvedEmail || !approvedPassword, "Set AMG_E2E_PORTAL_EMAIL and AMG_E2E_PORTAL_PASSWORD to run approved-user portal intro tests.");

  test("login routes approved users to their dashboard and shows the intro", async ({ page }) => {
    await signIn(page, approvedEmail, approvedPassword);

    await expect(page).toHaveURL(roleDashboardPattern);
    await expect(page.getByTestId("portal-intro")).toBeVisible();
    await expect(page.getByTestId("portal-intro-skip")).toBeVisible({ timeout: 2_500 });
  });

  test("skip completes the intro and it does not replay in the same session", async ({ page }) => {
    await signIn(page, approvedEmail, approvedPassword);
    await expect(page).toHaveURL(roleDashboardPattern);

    await page.getByTestId("portal-intro-skip").click();
    await expect(page.getByTestId("portal-intro")).toBeHidden();
    await expect(page.locator("#portal-main-content")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("portal-intro")).toBeHidden();
  });

  test("query parameter replays the intro after it has been seen", async ({ page }) => {
    await signIn(page, approvedEmail, approvedPassword);
    await expect(page).toHaveURL(roleDashboardPattern);

    await page.getByTestId("portal-intro-skip").click();
    await expect(page.getByTestId("portal-intro")).toBeHidden();

    const dashboardUrl = new URL(page.url());
    dashboardUrl.searchParams.set("intro", "1");
    await page.goto(dashboardUrl.toString());

    await expect(page.getByTestId("portal-intro")).toBeVisible();
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("uses the short static path and releases the dashboard", async ({ page }) => {
      await signIn(page, approvedEmail, approvedPassword);
      await expect(page).toHaveURL(roleDashboardPattern);

      await expect(page.getByTestId("portal-intro")).toBeHidden({ timeout: 2_500 });
      await expect(page.locator("#portal-main-content")).toBeVisible();
    });
  });
});

test.describe("AMG Connect unapproved portal users", () => {
  test.skip(!pendingEmail || !pendingPassword, "Set AMG_E2E_PENDING_EMAIL and AMG_E2E_PENDING_PASSWORD to run pending-user intro tests.");

  test("pending users are routed away without seeing the portal intro", async ({ page }) => {
    await signIn(page, pendingEmail, pendingPassword);

    await expect(page).toHaveURL(/\/pending-approval/);
    await expect(page.getByTestId("portal-intro")).toHaveCount(0);
  });
});
