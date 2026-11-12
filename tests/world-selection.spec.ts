import { test, expect } from "@playwright/test";
for (const width of [390, 1440])
  test(`world cards select scenery without opening a story at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/");
    const world = page.locator(".world-section");
    await world.scrollIntoViewIfNeeded();
    for (const [id, name] of [
      ["forest", "ForestBook"],
      ["ice", "IceBook"],
      ["holo", "HoloBook"],
      ["classic", "ClassicBook"],
    ]) {
      const button = page.getByRole("button", {
        name: `${name} olamini tanlash`,
        exact: true,
      });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(page).toHaveURL(/\/#\/$/);
      await expect(
        page.getByRole("heading", { name: "O‘z olamingni tanla", exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", id);
      expect(
        await button
          .locator("img")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      ).toBe(true);
      if (id !== "classic") {
        await expect(
          page.locator('.world-backdrop img[data-active="true"]'),
        ).toHaveAttribute(
          "src",
          `/worlds/${id === "ice" || id === "holo" ? `${id}-garden` : id}.webp`,
        );
        await expect
          .poll(() =>
            page
              .locator('.world-backdrop img[data-active="true"]')
              .evaluate(
                (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
      } else
        await expect(
          page.locator('.world-backdrop img[data-active="true"]'),
        ).toHaveAttribute("src", "/worlds/classic.webp");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page
      .getByRole("button", { name: "HoloBook olamini tanlash", exact: true })
      .click();
    await page.reload();
    await expect(
      page.getByRole("button", {
        name: "HoloBook olamini tanlash",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/\/#\/$/);
  });
test("HoloBook is live transparent glass over the world, and missing scenery has a safe fallback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/story/oy-dosti?theme=holo");
  await page.getByRole("button", { name: "O‘qishni boshlash" }).click();
  await expect(
    page.locator('.world-backdrop img[data-active="true"]'),
  ).toBeVisible();
  const glass = await page.locator(".book-page").evaluate((e) => ({
    filter: getComputedStyle(e).backdropFilter,
    background: getComputedStyle(e).backgroundColor,
  }));
  expect(glass.filter).toContain("blur");
  expect(glass.background).toContain("rgba");
  expect(glass.background).not.toContain(", 1)");
  await expect(page.locator(".book-material-frame")).toHaveCount(0);
  await page.route("**/worlds/**", (r) => r.abort());
  await page.reload();
  await expect(page.locator(".page-number")).toHaveText("1");
  await expect(
    page.getByRole("button", { name: "Keyingi", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(page.locator(".page-number")).toHaveText("2");
});
