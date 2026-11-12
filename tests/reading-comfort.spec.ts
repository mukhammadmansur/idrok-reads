import { test, expect } from "@playwright/test";
for (const width of [320, 390, 1440]) {
  test(`all pages keep the book and controls stable without clipped content at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const slug of ["oy-dosti", "bulut-kemasi", "dengiz-siri"]) {
      for (const theme of ["classic", "forest", "ice", "holo"]) {
        await page.goto(`/#/story/${slug}?theme=${theme}`);
        await page
          .getByRole("button", {
            name: /O‘qishni boshlash|O‘qishni davom ettir|Yana o‘qish/,
          })
          .click();
        const heights: number[] = [];
        for (let i = 1; i <= 8; i++) {
          await expect(page.locator(".page-number")).toHaveText(String(i));
          await expect(page.locator(".live-book > .reader-leaf")).toHaveCount(
            2,
          );
          heights.push(
            (await page.locator(".live-book").boundingBox())!.height,
          );
          expect(
            await page
              .locator(".live-book .reader-leaf")
              .evaluateAll((leaves) =>
                leaves.every((el) => el.scrollHeight <= el.clientHeight + 2),
              ),
            `${slug} ${theme} page ${i}`,
          ).toBe(true);
          if (i < 8)
            await page
              .getByRole("button", { name: "Keyingi", exact: true })
              .click();
        }
        expect(
          Math.max(...heights) - Math.min(...heights),
          `${slug} ${theme}`,
        ).toBeLessThanOrEqual(1);
        await page
          .getByRole("button", { name: "Yakunlash", exact: true })
          .click();
      }
    }
  });
}
test("large text fits a stable mobile book and theme transition preserves position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/read/oy-dosti");
  await page.getByRole("button", { name: "Katta matn" }).click();
  const heights: number[] = [];
  for (let i = 1; i <= 8; i++) {
    heights.push((await page.locator(".live-book").boundingBox())!.height);
    expect(
      await page
        .locator(".live-book .reader-leaf")
        .evaluateAll((leaves) =>
          leaves.every((el) => el.scrollHeight <= el.clientHeight + 2),
        ),
    ).toBe(true);
    if (i < 8)
      await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  }
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "O‘qish muhitini tanlash" }).click();
  await page.getByRole("button", { name: "Kelajak", exact: true }).click();
  await expect(page.locator(".page-number")).toHaveText("8");
  expect(
    await page
      .locator(".live-book .reader-leaf")
      .evaluateAll((leaves) =>
        leaves.every((el) => el.scrollHeight <= el.clientHeight + 2),
      ),
  ).toBe(true);
});
test("completed details explain video and replay; replay starts at one and preserves the badge", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "iqro.progress.v1",
      JSON.stringify({
        version: 1,
        theme: "holo",
        reading: {
          "oy-dosti": {
            page: 7,
            startedAt: "2026-11-12T00:00:00Z",
            completedAt: "2026-11-12T00:01:00Z",
          },
        },
        quizzes: {},
      }),
    ),
  );
  await page.goto("/#/story/oy-dosti");
  await expect(
    page.getByText("Bu kitobni o‘qib bo‘lgansan!", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Videoni ko‘rish", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Boshqa kitob tanlash", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Qayta o‘qish", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sinov videosi", { exact: true })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.route("**/www.youtube-nocookie.com/**", (r) => r.abort());
  await page
    .getByRole("button", { name: "Videoni ko‘rish", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "YouTube’da ochish" }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=aqz-KE-bpKQ");
  await page.getByRole("button", { name: "Qayta o‘qish", exact: true }).click();
  await expect(page.locator(".page-number")).toHaveText("1");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("iqro.progress.v1")!).reading[
          "oy-dosti"
        ].completedAt,
    ),
  ).toBe("2026-11-12T00:01:00Z");
});
test("turning leaves retain the live book material, typography and size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.clock.install();
  const appearance = (leaf: Element) => {
    const style = getComputedStyle(leaf),
      text = getComputedStyle(leaf.querySelector("p")!);
    return {
      background: style.backgroundColor,
      padding: style.padding,
      font: text.fontFamily,
      size: text.fontSize,
      line: text.lineHeight,
    };
  };
  for (const theme of ["classic", "forest", "ice"]) {
    await page.goto(`/#/story/oy-dosti?theme=${theme}`);
    await page
      .getByRole("button", { name: /O‘qishni boshlash|O‘qishni davom ettir/ })
      .click();
    await page.clock.runFor(800);
    const before = await page
      .locator(".live-book .leaf-right")
      .evaluate(appearance);
    const height = (await page.locator(".live-book").boundingBox())!.height;
    await page.getByRole("button", { name: "Keyingi", exact: true }).click();
    await page.clock.runFor(400);
    const animated = await page
      .locator(".paper-face-front > .reader-leaf")
      .first()
      .evaluate(appearance);
    expect(animated).toEqual(before);
    expect((await page.locator(".live-book").boundingBox())!.height).toBe(
      height,
    );
    await page.clock.runFor(1000);
    await expect(page.locator(".live-book > .reader-leaf")).toHaveCount(2);
    expect((await page.locator(".live-book").boundingBox())!.height).toBe(
      height,
    );
  }
});
