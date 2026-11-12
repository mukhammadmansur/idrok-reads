import { test, expect } from "@playwright/test";
import { stories } from "../src/data/stories";
for (const width of [390, 1440]) {
  test(`picture-book art and a single intact passage give clear reading order at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1050 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const story of stories) {
      await page.goto(`/#/read/${story.slug}`);
      for (let index = 0; index < story.pages.length; index++) {
        const book = page.locator(".live-book");
        await expect(book.locator("p")).toHaveCount(1);
        await expect(book.locator("p")).toHaveText(story.pages[index].text);
        await expect(book.locator(".chapter-label")).toHaveCount(0);
        await expect(book.locator(".inline-scene img")).toHaveCount(1);
        await expect
          .poll(() =>
            book
              .locator(".inline-scene img")
              .evaluate(
                (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
        const size = await book.locator(".inline-scene img").boundingBox();
        expect(size!.height).toBeGreaterThanOrEqual(width < 600 ? 220 : 340);
        if (index < story.pages.length - 1)
          await page
            .getByRole("button", { name: "Keyingi", exact: true })
            .click();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}
test("each active world really moves; reduced motion disables environmental movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/");
  for (const name of ["ClassicBook", "ForestBook", "IceBook", "HoloBook"]) {
    await page
      .getByRole("button", { name: `${name} olamini tanlash`, exact: true })
      .click();
    const image = page.locator('.world-backdrop img[data-active="true"]');
    await expect
      .poll(() => image.evaluate((el) => getComputedStyle(el).animationName))
      .toBe("living-world-drift");
    const before = await image.evaluate((el) => getComputedStyle(el).transform);
    await expect
      .poll(() => image.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(before);
  }
  await expect(
    page.locator('.world-backdrop img[data-active="true"]'),
  ).toHaveAttribute("src", "/worlds/holo-city.webp");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator('.world-backdrop img[data-active="true"]')
        .evaluate((el) => getComputedStyle(el).animationName),
    )
    .toBe("none");
});
