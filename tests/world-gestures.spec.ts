import { test, expect } from "@playwright/test";
for (const theme of ["forest", "ice", "holo"]) {
  for (const width of [390, 1440]) {
    test(`${theme} follows a held drag, cancels and saves only a settled page at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.clock.install();
      await page.goto(`/#/story/oy-dosti?theme=${theme}`);
      await page
        .getByRole("button", { name: "O‘qishni boshlash", exact: true })
        .click();
      const box = (await page.locator(".book-page").boundingBox())!;
      const x = box.x + box.width * 0.8,
        y = box.y + Math.min(200, box.height * 0.4);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x - box.width * 0.1, y, { steps: 5 });
      await page.clock.runFor(1000);
      const overlay = page.locator(
        theme === "holo" ? ".hologram-reveal" : ".paper-turn",
      );
      await expect(overlay).toBeAttached();
      await expect(page.locator(".page-number")).toHaveText("1");
      if (theme === "holo")
        await expect(page.locator(".paper-turn")).toHaveCount(0);
      if (theme === "holo") {
        await expect(overlay).toHaveClass(/hologram-reveal/);
        expect(await overlay.evaluate((el) => el.style.clipPath)).toContain(
          "inset",
        );
        expect(
          await overlay.evaluate((el) => el.style.transform),
        ).not.toContain("rotate");
      }
      await page.mouse.up();
      await page.clock.runFor(1600);
      await expect(overlay).toHaveCount(0);
      await expect(page.locator(".page-number")).toHaveText("1");
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x - box.width * 0.5, y, { steps: 8 });
      await page.clock.runFor(100);
      await page.mouse.up();
      await page.clock.runFor(1600);
      await expect(page.locator(".page-number")).toHaveText("2");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("iqro.progress.v1")!).reading[
                "oy-dosti"
              ].page,
          ),
        )
        .toBe(1);
      const nextBox = (await page.locator(".book-page").boundingBox())!;
      await page.mouse.move(nextBox.x + nextBox.width * 0.15, y);
      await page.mouse.down();
      await page.mouse.move(nextBox.x + nextBox.width * 0.7, y, { steps: 8 });
      await page.clock.runFor(100);
      await page.mouse.up();
      await page.clock.runFor(1600);
      await expect(page.locator(".page-number")).toHaveText("1");
      await page.getByRole("button", { name: "Keyingi", exact: true }).click();
      await page.clock.runFor(1600);
      await expect(page.locator(".page-number")).toHaveText("2");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
  }
}
test("touch swipes work in all three worlds, vertical touch scroll never changes page", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.clock.install();
  const cdp = await context.newCDPSession(page);
  for (const theme of ["forest", "ice", "holo"]) {
    await page.goto(
      `http://127.0.0.1:5173/#/story/bulut-kemasi?theme=${theme}`,
    );
    await page
      .getByRole("button", { name: /O‘qishni boshlash|O‘qishni davom ettir/ })
      .click();
    const before = await page.locator(".page-number").textContent();
    const box = (await page.locator(".book-page").boundingBox())!;
    const x = box.x + box.width * 0.8,
      y = box.y + 150;
    const touch = async (type: string, px: number, py: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x: px, y: py, id: 1 }],
      });
    await touch("touchStart", x, y);
    await touch("touchMove", x, y - 90);
    await touch("touchEnd", x, y - 90);
    await page.clock.runFor(1000);
    await expect(page.locator(".page-number")).toHaveText(before!);
    await page.evaluate(() => scrollTo(0, 0));
    await touch("touchStart", x, y);
    await touch("touchMove", x - 180, y);
    await page.clock.runFor(100);
    await touch("touchEnd", x - 180, y);
    await page.clock.runFor(1600);
    await expect(page.locator(".page-number")).toHaveText(
      String(Number(before) + 1),
    );
  }
  await context.close();
});
