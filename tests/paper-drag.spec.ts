import { test, expect } from "@playwright/test";
for (const width of [390, 1440])
  test(`paper follows the held pointer, commits or returns at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.install();
    await page.goto("/#/read/oy-dosti");
    const book = page.locator(".book-page");
    await expect(page.locator(".page-number")).toHaveText("1");
    const box = (await book.boundingBox())!;
    const x = box.x + box.width * 0.85,
      y = box.y + box.height * 0.6;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - box.width * 0.1, y, { steps: 6 });
    await page.clock.runFor(100);
    await expect(page.locator(".paper-turn")).toBeAttached();
    const held = await page
      .locator(".paper-strip")
      .nth(10)
      .getAttribute("style");
    await page.clock.runFor(2000);
    expect(
      await page.locator(".paper-strip").nth(10).getAttribute("style"),
    ).toBe(held);
    await expect(page.locator(".page-number")).toHaveText("1");
    await page.mouse.move(x - box.width * 0.5, y, { steps: 8 });
    await page.clock.runFor(40);
    expect(
      await page.locator(".paper-strip").nth(10).getAttribute("style"),
    ).not.toBe(held);
    await page.mouse.up();
    await page.clock.runFor(1600);
    await expect(page.locator(".page-number")).toHaveText("2");
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("iqro.progress.v1")!).reading[
            "oy-dosti"
          ].page,
      ),
    ).toBe(1);
    // Let go before the middle: the leaf returns, and saved progress stays put.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - box.width * 0.1, y, { steps: 4 });
    await page.clock.runFor(600);
    await page.mouse.up();
    await page.clock.runFor(1600);
    await expect(page.locator(".page-number")).toHaveText("2");
    await expect(page.locator(".paper-turn")).toHaveCount(0);
    // Previous page can also be grabbed and pulled back across the spine.
    const left = box.x + box.width * 0.15;
    await page.mouse.move(left, y);
    await page.mouse.down();
    await page.mouse.move(left + box.width * 0.5, y, { steps: 8 });
    await page.clock.runFor(100);
    await page.mouse.up();
    await page.clock.runFor(1600);
    await expect(page.locator(".page-number")).toHaveText("1");
  });
test("touch drag follows the finger and advances exactly one page", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto("http://127.0.0.1:5173/#/read/oy-dosti");
  await expect(page.locator(".page-number")).toHaveText("1");
  const box = (await page.locator(".book-page").boundingBox())!;
  const x = box.x + box.width * 0.85,
    y = box.y + box.height * 0.6;
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x - 70, y, id: 1 }],
  });
  await page.clock.runFor(150);
  await expect(page.locator(".paper-turn")).toBeAttached();
  await expect(page.locator(".page-number")).toHaveText("1");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x - 180, y, id: 1 }],
  });
  await page.clock.runFor(100);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.clock.runFor(1600);
  await expect(page.locator(".page-number")).toHaveText("2");
  await expect(page.locator(".paper-turn")).toHaveCount(0);
  await context.close();
});
test("first-entry hand demonstration disappears and never repeats after refresh", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/read/oy-dosti");
  await expect(page.locator(".page-drag-hint")).toBeAttached();
  await page.clock.runFor(4000);
  await expect(page.locator(".page-drag-hint")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".page-number")).toHaveText("1");
  await expect(page.locator(".page-drag-hint")).toHaveCount(0);
  await page.goto("/#/read/bulut-kemasi");
  await expect(page.locator(".page-number")).toHaveText("1");
  await expect(page.locator(".page-drag-hint")).toHaveCount(0);
});
test("pointer cancellation restores the page and reduced-motion drag changes instantly on release", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/read/oy-dosti");
  await expect(page.locator(".page-number")).toHaveText("1");
  const box = (await page.locator(".book-page").boundingBox())!;
  const x = box.x + box.width * 0.8,
    y = box.y + box.height * 0.6;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 200, y, { steps: 5 });
  await page.clock.runFor(100);
  await page
    .locator(".book-stage")
    .evaluate((el) =>
      el.dispatchEvent(
        new PointerEvent("pointercancel", { bubbles: true, pointerId: 1 }),
      ),
    );
  await page.mouse.up();
  await page.clock.runFor(1600);
  await expect(page.locator(".page-number")).toHaveText("1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 300, y, { steps: 5 });
  await expect(page.locator(".paper-turn")).toHaveCount(0);
  await expect(page.locator(".page-number")).toHaveText("1");
  await page.mouse.up();
  await expect(page.locator(".page-number")).toHaveText("2");
});
