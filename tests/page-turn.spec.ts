import { test, expect } from "@playwright/test";
for (const width of [390, 1440])
  test(`ClassicBook bends paper in both directions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.install();
    await page.goto("/#/read/oy-dosti");
    await expect(page.locator(".page-number")).toHaveText("1");
    await page.getByRole("button", { name: "Keyingi", exact: true }).click();
    await expect(page.locator(".book-page")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(page.locator(".paper-strip")).toHaveCount(16);
    await expect(
      page.getByRole("button", { name: "Keyingi", exact: true }),
    ).toBeDisabled();
    await page.clock.runFor(400);
    const transforms = await page
      .locator(".paper-strip")
      .evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLElement).style.transform),
      );
    expect(new Set(transforms).size).toBe(16);
    expect(transforms.every((t) => t.includes("rotateY(-"))).toBe(true);
    await expect(page.locator(".page-number")).toHaveText("1");
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("iqro.progress.v1")!).reading[
            "oy-dosti"
          ].page,
      ),
    ).toBe(0);
    // Inputs during a turn must never skip pages or award completion.
    await page.keyboard.press("ArrowRight");
    await page.clock.runFor(1000);
    await expect(page.locator(".page-number")).toHaveText("2");
    await expect(page.locator(".paper-turn")).toHaveCount(0);
    await page.getByRole("button", { name: "Oldingi", exact: true }).click();
    await page.clock.runFor(400);
    await expect(page.locator(".paper-turn-previous")).toBeAttached();
    await page.clock.runFor(1000);
    await expect(page.locator(".page-number")).toHaveText("1");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("paper corners and swipe use the same renderer; vertical scrolling does not turn pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.clock.install();
  await page.goto("/#/read/oy-dosti");
  await page
    .getByRole("button", { name: "Keyingi sahifani varaqlash" })
    .click();
  await page.clock.runFor(1500);
  await expect(page.locator(".page-number")).toHaveText("2");
  const swipe = async (x: number, y: number) => {
    await page.locator(".book-page").evaluate(
      (el, { x, y }) => {
        el.dispatchEvent(
          new TouchEvent("touchstart", {
            bubbles: true,
            touches: [
              new Touch({
                identifier: 0,
                target: el,
                clientX: 260,
                clientY: 300,
              }),
            ],
          }),
        );
        el.dispatchEvent(
          new TouchEvent("touchend", {
            bubbles: true,
            changedTouches: [
              new Touch({ identifier: 0, target: el, clientX: x, clientY: y }),
            ],
          }),
        );
      },
      { x, y },
    );
  };
  await swipe(100, 100);
  await expect(page.locator(".paper-turn")).toHaveCount(0);
  await expect(page.locator(".page-number")).toHaveText("2");
  await swipe(100, 310);
  await expect(page.locator(".paper-turn-next")).toBeAttached();
  await page.clock.runFor(1500);
  await expect(page.locator(".page-number")).toHaveText("3");
});
test("reduced motion, resize and leaving mid-turn never trap navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/read/oy-dosti");
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(page.locator(".paper-turn")).toBeAttached();
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect(page.locator(".page-number")).toHaveText("2");
  await expect(page.locator(".paper-turn")).toHaveCount(0);
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".page-number")).toHaveText("3");
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(page.locator(".page-number")).toHaveText("4");
  await expect(page.locator(".paper-turn")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await page
    .getByRole("link", { name: "Hikoya tafsilotlariga qaytish" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Oyga maktub", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
