import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440])
  test(`WCAG A/AA automated checks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const route of [
      "/",
      "/story/oy-dosti",
      "/quiz",
      "/quiz/general",
      "/rewards",
      "/parent",
    ]) {
      await page.goto("/#" + route);
      await expect(page.locator("main")).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations, `Violations on ${route}`).toEqual([]);
    }
    for (const theme of ["ClassicBook", "ForestBook", "IceBook", "HoloBook"]) {
      await page.goto("/#/story/oy-dosti");
      await page.getByRole("button", { name: theme, exact: true }).click();
      await page
        .getByRole("button", { name: /O‘qishni boshlash|O‘qishni davom ettir/ })
        .click();
      await expect(page.locator(".book-page")).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations, `Violations in ${theme}`).toEqual([]);
    }
  });
