import { expect, test, type Request } from "@playwright/test";

const BACKEND = /\/companion\/|\/director\/|:8000|:8781/;

test.describe("Haven Deck kiosk (demo mode)", () => {
  test("loads the starter pack and shows Live, the scene rail, and Demo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("deck-shell")).toBeVisible();
    await expect(page.getByTestId("connection-badge")).toHaveText("Demo");
    await expect(page.getByTestId("tab-live")).toBeVisible();
    await expect(page.getByTestId("tab-sounds")).toBeVisible();
    await expect(page.getByTestId("tab-setup")).toBeVisible();
    const rail = page.getByTestId("scene-rail");
    await expect(rail.getByTestId("key-sc-game")).toBeVisible();
    await expect(rail.getByTestId("key-sc-chat")).toBeVisible();
    await expect(rail.getByTestId("key-sc-brb")).toBeVisible();
    await expect(rail.getByTestId("key-sc-start")).toBeVisible();
    await expect(rail.getByTestId("key-sc-end")).toBeVisible();
    await expect(page.getByTestId("key-go-live")).toBeVisible();
    await expect(page.getByTestId("key-stop-all")).toBeVisible();
  });

  test("switches tabs to Sounds and Setup", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("tab-sounds").click();
    await expect(page.getByTestId("key-tap")).toBeVisible();
    await expect(page.getByTestId("key-confirm")).toBeVisible();
    await expect(page.getByTestId("scene-rail").getByTestId("key-sc-game")).toBeVisible();

    await page.getByTestId("tab-setup").click();
    await expect(page.getByTestId("setup-page")).toBeVisible();
    await expect(page.getByText("Haven Deck Starter (6 clips)")).toBeVisible();
    await expect(page.getByText("Demo mode (no network actions)")).toBeVisible();
  });

  test("pages the Sounds grid when the page size is smaller than the pack", async ({ page }) => {
    await page.goto("/?gridPageSize=3");
    await page.getByTestId("tab-sounds").click();
    const pager = page.getByTestId("pager");
    await expect(pager).toBeVisible();
    await expect(pager).toContainText("1 / 2");
    await expect(page.getByTestId("key-tap")).toBeVisible();
    await expect(page.getByTestId("key-stop")).toHaveCount(0);
    await pager.getByRole("button", { name: /next/i }).click();
    await expect(pager).toContainText("2 / 2");
    await expect(page.getByTestId("key-stop")).toBeVisible();
    await pager.getByRole("button", { name: /prev/i }).click();
    await expect(pager).toContainText("1 / 2");
  });

  test("Go Live requires a second tap, then stays in demo", async ({ page }) => {
    await page.goto("/");
    const go = page.getByTestId("key-go-live");
    await go.click();
    await expect(go).toContainText("Tap again");
    await expect(page.getByTestId("status-msg")).toHaveText("Tap again to confirm");
    await expect(page.getByTestId("connection-badge")).toHaveText("Demo");
    await go.click();
    await expect(page.getByTestId("status-msg")).toHaveText("Demo: Go Live");
    await expect(go).toContainText("Go Live");
  });

  test("demo mode makes no Companion or Director network calls", async ({ page }) => {
    const forbidden: string[] = [];
    const onRequest = (req: Request) => {
      const url = req.url();
      if (BACKEND.test(url)) forbidden.push(`${req.method()} ${url}`);
    };
    page.on("request", onRequest);
    await page.goto("/");
    await page.getByTestId("key-go-live").click();
    await page.getByTestId("key-go-live").click();
    await page.getByTestId("key-sc-game").click();
    await page.getByTestId("key-stop-all").click();
    await page.getByTestId("tab-sounds").click();
    await page.getByTestId("key-tap").click();
    page.off("request", onRequest);
    expect(forbidden, `unexpected backend requests: ${forbidden.join(", ")}`).toEqual([]);
  });
});
