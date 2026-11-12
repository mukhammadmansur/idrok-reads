import { test, expect } from "@playwright/test";
async function noOverflow(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
test("reading, resume, completion, recap and separate quiz survive refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Hikoyani kashf et" }).click();
  await expect(
    page.getByRole("heading", { name: "Oyga maktub", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ForestBook", exact: true }).click();
  await page.getByRole("button", { name: "O‘qishni boshlash" }).click();
  await expect(page.locator(".reader")).toHaveClass(/theme-forest/);
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(page.locator(".page-number")).toHaveText("3");
  await page
    .getByRole("link", { name: "Hikoya tafsilotlariga qaytish" })
    .click();
  await page.getByRole("button", { name: "O‘qishni davom ettir" }).click();
  await expect(page.locator(".page-number")).toHaveText("3");
  await page.reload();
  await expect(page.locator(".page-number")).toHaveText("3");
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await page.getByRole("button", { name: "Yakunlash", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Barakalla, kitobxon!" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /savol|quiz/i })).toHaveCount(
    0,
  );
  const completedAt = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("iqro.progress.v1")!).reading["oy-dosti"]
        .completedAt,
  );
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("iqro.progress.v1")!).reading[
          "oy-dosti"
        ].completedAt,
    ),
  ).toBe(completedAt);
  await page.route("**/www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html lang='en'><title>Test video</title><body>Player fixture</body></html>",
    }),
  );
  await page
    .getByRole("button", { name: "Videoni ko‘rish", exact: true })
    .click();
  await expect(page.locator(".youtube-stage iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie.com\/embed\/aqz-KE-bpKQ/,
  );
  await page.getByRole("link", { name: "Savol-javob", exact: true }).click();
  await page.getByRole("link", { name: /3 TA SAVOL Oyga maktub/ }).click();
  const answers = ["Oyga", "Qog‘oz samolyot", "Do‘stlarining yonida bo‘lishi"];
  for (let i = 0; i < 3; i++) {
    await page.getByRole("radio", { name: new RegExp(answers[i]) }).check();
    await page.getByRole("button", { name: "Javobni tekshirish" }).click();
    await expect(page.getByRole("status")).toContainText("To‘ppa-to‘g‘ri!");
    await page
      .getByRole("button", {
        name: i === 2 ? "Natijani ko‘rish" : "Keyingi savol",
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Ajoyib, bilimdon!" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".score-display")).toContainText("3 / 3");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("iqro.progress.v1")!).quizzes[
          "oy-dosti"
        ].attempts,
    ),
  ).toBe(1);
  await page
    .getByRole("link", { name: "Ota-onalar uchun", exact: true })
    .click();
  await expect(page.locator(".activity-title")).toContainText("Tugatilgan");
  await expect(page.locator(".quiz-results-list")).toContainText("3 / 3");
  await expect(page.locator(".stat-card").nth(1).locator("strong")).toHaveText(
    "1",
  );
});
test("general quiz is independent, wrong answers are supportive and retry preserves best", async ({
  page,
}) => {
  await page.goto("/#/quiz");
  await expect(
    page.getByRole("heading", { name: "Har bir hikoyaning o‘z savoli bor" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Umumiy savollar", exact: true })
    .click();
  await page.getByRole("link", { name: /Kichik kashfiyotchilar/ }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Javobni tekshirish" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page
      .getByRole("button", {
        name: i === 2 ? "Natijani ko‘rish" : "Keyingi savol",
      })
      .click();
  }
  await expect(page.locator(".score-display")).toContainText("1 / 3");
  await page.getByRole("button", { name: "Yana sinab ko‘rish" }).click();
  await expect(
    page.getByRole("button", { name: "Javobni tekshirish" }),
  ).toBeDisabled();
});
for (const width of [320, 390, 768, 1024, 1440])
  test(`responsive discovery and all reader themes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await noOverflow(page);
    await expect(
      page.getByRole("link", { name: "Hikoyani kashf et" }),
    ).toBeInViewport();
    for (const theme of ["classic", "forest", "ice", "holo"]) {
      await page.goto(`/#/story/oy-dosti?theme=${theme}`);
      await page
        .getByRole("button", { name: /O‘qishni boshlash|O‘qishni davom ettir/ })
        .click();
      await expect(page.locator(".reader")).toHaveClass(
        new RegExp(`theme-${theme}`),
      );
      await expect(page.locator(".live-book .narration-leaf p")).toBeVisible();
      await noOverflow(page);
      await page.getByRole("button", { name: "Keyingi", exact: true }).click();
      await expect(page.locator(".page-number")).not.toHaveText("1");
    }
    for (const route of ["quiz", "rewards", "parent", "story/oy-dosti"]) {
      await page.goto(`/#/${route}`);
      await noOverflow(page);
    }
  });
for (const slug of ["oy-dosti", "bulut-kemasi", "dengiz-siri"])
  test(`all pages and themes work for ${slug}`, async ({ page }) => {
    await page.clock.install();
    for (const theme of ["ClassicBook", "ForestBook", "IceBook", "HoloBook"]) {
      await page.goto(`/#/story/${slug}`);
      await page.getByRole("button", { name: theme, exact: true }).click();
      await page
        .getByRole("button", {
          name: /O‘qishni boshlash|O‘qishni davom ettir|Yana o‘qish/,
        })
        .click();
      await expect(page.locator(".page-number")).toHaveText("1");
      for (let i = 2; i <= 8; i++) {
        await page
          .getByRole("button", { name: "Keyingi", exact: true })
          .click();
        await page.clock.runFor(1500);
        await expect(page.locator(".page-number")).toHaveText(String(i));
      }
      await page
        .getByRole("button", { name: "Yakunlash", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Barakalla, kitobxon!" }),
      ).toBeVisible();
    }
    expect(
      await page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem("iqro.progress.v1")!).reading[id]
            .completedAt,
        slug,
      ),
    ).toBeTruthy();
  });
test("search, missing story, corrupt storage and broken images degrade gracefully", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("iqro.progress.v1", "not-json"),
  );
  await page.route("**/art/**", (r) => r.abort());
  await page.goto("/");
  await expect(page.locator(".hero .art-fallback")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Hikoya qidirish" })
    .fill("no-such-story");
  await expect(
    page.getByRole("heading", { name: "Bu hikoya hali topilmadi" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Barchasini ko‘rish" }).click();
  await expect(page.locator(".story-card")).toHaveCount(3);
  await page.goto("/#/story/missing");
  await expect(
    page.getByRole("heading", { name: "Bu sahifa topilmadi" }),
  ).toBeVisible();
});
test("keyboard navigation, swipe and reduced motion work", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/read/oy-dosti");
  await expect(page.locator(".page-number")).toHaveText("1");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".page-number")).toHaveText("2");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".page-number")).toHaveText("1");
  await page.locator(".book-page").evaluate((element) =>
    element.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        touches: [new Touch({ identifier: 0, target: element, clientX: 280 })],
      }),
    ),
  );
  await page.locator(".book-page").evaluate((element) =>
    element.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        changedTouches: [
          new Touch({ identifier: 0, target: element, clientX: 90 }),
        ],
      }),
    ),
  );
  await expect(page.locator(".page-number")).toHaveText("2");
  expect(
    await page
      .locator(".live-book .narration-leaf p")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});
