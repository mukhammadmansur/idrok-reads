import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const themes = [
  ["classic", "ClassicBook"],
  ["forest", "ForestBook"],
  ["ice", "IceBook"],
  ["holo", "HoloBook"],
] as const;
for (const width of [390, 1440])
  test(`theme selection immediately changes the whole app and survives navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const backgrounds = new Set<string>();
    for (const [id, name] of themes) {
      await page.goto("/#/story/oy-dosti");
      await page.getByRole("button", { name, exact: true }).click();
      await expect(page.locator(".app-shell")).toHaveAttribute(
        "data-theme",
        id,
      );
      await expect(page.locator("html")).toHaveAttribute("data-theme", id);
      backgrounds.add(
        await page
          .locator("body")
          .evaluate((e) => getComputedStyle(e).backgroundColor),
      );
      await page
        .getByRole("link", { name: "Savol-javob", exact: true })
        .click();
      await expect(page.locator(".app-shell")).toHaveAttribute(
        "data-theme",
        id,
      );
      await page.reload();
      await expect(page.locator(".app-shell")).toHaveAttribute(
        "data-theme",
        id,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    expect(backgrounds.size).toBe(4);
  });
for (const [id, name] of themes)
  test(`readable structured pages and app contrast in ${name}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/story/oy-dosti");
    await page.getByRole("button", { name, exact: true }).click();
    for (const route of [
      "/story/oy-dosti",
      "/",
      "/quiz",
      "/rewards",
      "/parent",
    ]) {
      await page.goto("/#" + route);
      await expect(page.locator("main")).toBeVisible();
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        route,
      ).toEqual([]);
    }
    await page.goto("/#/read/oy-dosti");
    await expect(page.locator(".reader")).toHaveClass(
      new RegExp(`theme-${id}`),
    );
    if (id !== "classic") {
      await expect(
        page.locator('.world-backdrop img[data-active="true"]'),
      ).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator('.world-backdrop img[data-active="true"]')
            .evaluate(
              (e: HTMLImageElement) => e.complete && e.naturalWidth > 0,
            ),
        )
        .toBe(true);
      await expect(page.locator(".book-material-frame")).toHaveCount(0);
    }
    await page.getByRole("button", { name: "Keyingi", exact: true }).click();
    await expect(page.locator(".book-page .inline-scene")).toHaveCount(1);
    await expect(page.locator(".live-book p")).toHaveCount(1);
    await expect(page.locator(".live-book .narration-leaf p")).toBeVisible();
    await page.getByRole("button", { name: "Keyingi", exact: true }).click();
    await page.getByRole("button", { name: "Keyingi", exact: true }).click();
    await expect(
      page.getByRole("img", {
        name: "Tulkixon va Quyonvoy maysalar ustida qog‘oz samolyot yasashyapti.",
      }),
    ).toBeVisible();
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(scan.violations).toEqual([]);
    for (let i = 0; i < 4; i++)
      await page.getByRole("button", { name: "Keyingi", exact: true }).click();
    await page.getByRole("button", { name: "Yakunlash", exact: true }).click();
    for (const route of ["/completed/oy-dosti", "/rewards", "/parent"]) {
      await page.goto("/#" + route);
      await expect(page.locator("main")).toBeVisible();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        route,
      ).toEqual([]);
    }
  });
