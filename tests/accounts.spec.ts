import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const password = "browser-fixture-only-long-passphrase";
const address = () => `parent-${crypto.randomUUID()}@example.invalid`;
async function openAccount(page: Page) {
  await page.goto("http://127.0.0.1:5173/#/account");
  await page
    .locator(".parent-gate input, #parent-email, .account-heading")
    .first()
    .waitFor();
  if (await page.getByLabel("Akkaunt paroli", { exact: true }).isVisible()) {
    await page.getByLabel("Akkaunt paroli", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Bo‘limni ochish", exact: true })
      .click();
    await page.locator(".account-heading").waitFor();
  }
}
async function register(page: Page, email: string, name = "Kitobxon") {
  await openAccount(page);
  await page
    .getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true })
    .click();
  await page.getByLabel("Ota-onaning e-maili").fill(email);
  await page.getByLabel("Parol", { exact: true }).fill(password);
  await page
    .getByLabel("Parolni qayta kiriting", { exact: true })
    .fill(password);
  await page
    .getByRole("button", { name: "Akkaunt yaratish", exact: true })
    .click();
  await page.getByLabel("Bolaning ismi").fill(name);
  await page
    .getByRole("button", { name: "Profilni yaratish", exact: true })
    .click();
  await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}
async function session(page: Page) {
  return (await page.request.get("/api/session")).json();
}
async function readingPage(page: Page, index: number) {
  await page.goto("/#/read/oy-dosti");
  for (let i = 1; i < index; i++)
    await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(page.locator(".page-number")).toHaveText(String(index));
}
async function savedPage(page: Page, child: string) {
  const r = await page.request.get(`/api/children/${child}/progress`);
  return (await r.json()).progress.reading["oy-dosti"]?.page;
}

test("a parent can continue the same child on an independent device and logout revokes the session", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const email = address();
  await register(page, email, "Quyoshvoy");
  const account = await session(page);
  const child = account.selectedChildId;
  await readingPage(page, 4);
  await expect.poll(() => savedPage(page, child)).toBe(3);
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const second = await context.newPage();
  await openAccount(second);
  await second.getByLabel("Ota-onaning e-maili").fill(email);
  await second.getByLabel("Parol", { exact: true }).fill(password);
  await second
    .getByRole("button", { name: "Akkauntga kirish", exact: true })
    .click();
  await expect(second.getByText(email, { exact: true })).toBeVisible();
  await second.goto("http://127.0.0.1:5173/#/read/oy-dosti");
  await expect(second.locator(".page-number")).toHaveText("4");
  const cookie = (await context.cookies()).find(
    (c) => c.name === "wbooks_session",
  )!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Lax");
  expect(
    await second.evaluate(() =>
      Object.values(localStorage).some((value) =>
        value.includes("browser-fixture-only-long-passphrase"),
      ),
    ),
  ).toBe(false);
  await openAccount(second);
  await second.getByRole("button", { name: "Chiqish", exact: true }).click();
  await expect(
    second.getByRole("button", { name: "Akkauntga kirish", exact: true }),
  ).toBeVisible();
  expect(
    (await second.request.get("http://127.0.0.1:5173/api/session")).status(),
  ).toBe(200);
  expect(
    (
      await (
        await second.request.get("http://127.0.0.1:5173/api/session")
      ).json()
    ).user,
  ).toBeNull();
  await context.close();
});
test("switching siblings resets the reader and another parent cannot load their progress", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await register(page, address(), "Birinchi");
  const first = (await session(page)).selectedChildId;
  await readingPage(page, 3);
  await expect.poll(() => savedPage(page, first)).toBe(2);
  await openAccount(page);
  await page
    .getByRole("button", { name: "Bola qo‘shish", exact: true })
    .click();
  await page.getByLabel("Bolaning ismi").fill("Ikkinchi");
  await page
    .getByRole("button", { name: "Profilni yaratish", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ikkinchi", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/#/read/oy-dosti");
  await expect(page.locator(".page-number")).toHaveText("1");
  await openAccount(page);
  await page.getByRole("button", { name: "Birinchi", exact: true }).click();
  await page.goto("/#/read/oy-dosti");
  await expect(page.locator(".page-number")).toHaveText("3");
  const context = await browser.newContext();
  const stranger = await context.newPage();
  await stranger.goto("http://127.0.0.1:5173");
  await openAccount(stranger);
  await stranger
    .getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true })
    .click();
  await stranger.getByLabel("Ota-onaning e-maili").fill(address());
  await stranger.getByLabel("Parol", { exact: true }).fill(password);
  await stranger
    .getByLabel("Parolni qayta kiriting", { exact: true })
    .fill(password);
  await stranger
    .getByRole("button", { name: "Akkaunt yaratish", exact: true })
    .click();
  await expect(
    stranger.getByText("Birinchi bola profilini qo‘shing", { exact: true }),
  ).toBeVisible();
  expect(
    (
      await stranger.request.get(
        `http://127.0.0.1:5173/api/children/${first}/progress`,
      )
    ).status(),
  ).toBe(404);
  await context.close();
});
test("offline events survive reload and sync exactly once after reconnect", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await register(page, address(), "Bardosh");
  const child = (await session(page)).selectedChildId;
  await readingPage(page, 2);
  await expect.poll(() => savedPage(page, child)).toBe(1);
  await page.route("**/api/children/*/events", (route) => route.abort());
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(page.locator(".page-number")).toHaveText("3");
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.keys(localStorage).some((key) =>
          key.startsWith("wbooks.pending.v1:"),
        ),
      ),
    )
    .toBe(true);
  await page.reload();
  await expect(page.locator(".page-number")).toHaveText("3");
  await page.unroute("**/api/children/*/events");
  await page.evaluate(() => dispatchEvent(new Event("online")));
  await expect.poll(() => savedPage(page, child)).toBe(2);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(localStorage).filter((key) =>
            key.startsWith("wbooks.pending.v1:"),
          ).length,
      ),
    )
    .toBe(0);
});
test("guest reading stays separate until the parent explicitly imports it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("guest-seeded")) {
      localStorage.setItem("guest-seeded", "1");
      localStorage.setItem(
        "iqro.progress.v1",
        JSON.stringify({
          version: 1,
          theme: "classic",
          reading: {
            "oy-dosti": {
              page: 0,
              startedAt: "2026-11-12T00:00:00Z",
              completedAt: "2026-11-12T00:01:00Z",
            },
          },
          quizzes: {},
        }),
      );
    }
  });
  await register(page, address(), "Mehr");
  const child = (await session(page)).selectedChildId;
  const before = await (
    await page.request.get(`/api/children/${child}/progress`)
  ).json();
  expect(before.progress.reading).toEqual({});
  await page
    .getByRole("button", {
      name: "Mahalliy o‘qishlarni shu profilga qo‘shish",
      exact: true,
    })
    .click();
  await expect
    .poll(async () => {
      const r = await (
        await page.request.get(`/api/children/${child}/progress`)
      ).json();
      return !!r.progress.reading["oy-dosti"]?.completedAt;
    })
    .toBe(true);
  expect(await savedPage(page, child)).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("iqro.progress.v1")!).reading[
          "oy-dosti"
        ].completedAt,
    ),
  ).toBe("2026-11-12T00:01:00Z");
});
test("account forms and signed-in profile controls remain accessible at mobile width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openAccount(page);
  await expect(page.getByLabel("Ota-onaning e-maili")).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await register(page, address(), "Yulduz");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("a quiz completed during a write outage is saved once with server-graded answers", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await register(page, address(), "Bilimdon");
  const child = (await session(page)).selectedChildId;
  await page.goto("/#/quiz/general");
  await page.route("**/api/children/*/events", (route) => route.abort());
  for (const answer of ["Suv va quyosh nuri", "Uni tinglash", "Kit"]) {
    await page.getByRole("radio", { name: new RegExp(answer) }).check();
    await page
      .getByRole("button", { name: "Javobni tekshirish", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: answer === "Kit" ? "Natijani ko‘rish" : "Keyingi savol",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".score-display")).toContainText("3 / 3");
  await page.reload();
  await expect(page.locator(".score-display")).toContainText("3 / 3");
  await page.unroute("**/api/children/*/events");
  await page.evaluate(() => dispatchEvent(new Event("online")));
  await expect
    .poll(async () => {
      const result = await (
        await page.request.get(`/api/children/${child}/progress`)
      ).json();
      return result.progress.quizzes.general;
    })
    .toMatchObject({ score: 3, total: 3, attempts: 1 });
  await page.reload();
  await expect(page.locator(".score-display")).toContainText("3 / 3");
});
test("an expired session never exposes its child as the guest and pending work resumes on login", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const email = address();
  await register(page, email, "SirliProfil");
  const child = (await session(page)).selectedChildId;
  await readingPage(page, 2);
  await expect.poll(() => savedPage(page, child)).toBe(1);
  await page.request.post("/api/auth/logout", {
    headers: { Origin: "http://127.0.0.1:5173", "X-WBooks-Client": "web" },
    data: {},
  });
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect.poll(async () => !(await session(page)).user).toBe(true);
  await openAccount(page);
  await expect(page.getByLabel("Ota-onaning e-maili")).toBeVisible();
  await expect(page.getByText("SirliProfil", { exact: true })).toHaveCount(0);
  await page.getByLabel("Ota-onaning e-maili").fill(email);
  await page.getByLabel("Parol", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Akkauntga kirish", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "SirliProfil", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => savedPage(page, child)).toBe(2);
});
test("one tab cannot discard another tab’s durable pending reading events", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await register(page, address(), "IkkiOyna");
  const child = (await session(page)).selectedChildId;
  await readingPage(page, 1);
  await expect.poll(() => savedPage(page, child)).toBe(0);
  const second = await context.newPage();
  await second.emulateMedia({ reducedMotion: "reduce" });
  await second.goto("/#/read/oy-dosti");
  await expect(second.locator(".page-number")).toHaveText("1");
  await page.route("**/api/children/*/events", (r) => r.abort());
  await second.route("**/api/children/*/events", (r) => r.abort());
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(page.locator(".page-number")).toHaveText("2");
  await second.getByRole("button", { name: "Keyingi", exact: true }).click();
  await second.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(second.locator(".page-number")).toHaveText("3");
  await second.close();
  await page.unroute("**/api/children/*/events");
  await page.evaluate(() => dispatchEvent(new Event("online")));
  await expect.poll(() => savedPage(page, child)).toBe(2);
});

test("parent section requires a six-digit PIN after returning to children and also protects the server endpoint", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await register(page, address(), "Azizbek");
  await page.getByText("Ota-onalar himoyasi", { exact: true }).click();
  await page
    .getByLabel("6 xonali kod yarating", { exact: true })
    .fill("482619");
  await page.getByLabel("Kodni qayta kiriting", { exact: true }).fill("482619");
  await page
    .getByRole("button", { name: "Kodni saqlash", exact: true })
    .click();
  await expect(
    page.getByText("Ota-ona kodi saqlandi.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Kitob o‘qish", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/parent/status")).json()).unlocked,
    )
    .toBe(false);
  expect((await page.request.get("/api/parent/overview")).status()).toBe(403);
  await page.goto("/#/parent");
  await expect(
    page.getByRole("heading", { name: "Bu bo‘lim faqat ota-onalar uchun" }),
  ).toBeVisible();
  await expect(page.locator(".family-grid")).toHaveCount(0);
  await page.getByLabel("6 xonali ota-ona kodi").fill("111111");
  await page.getByRole("button", { name: "Bo‘limni ochish" }).click();
  await expect(page.getByRole("alert")).toContainText("noto‘g‘ri");
  await page.getByLabel("6 xonali ota-ona kodi").fill("482619");
  await page.getByRole("button", { name: "Bo‘limni ochish" }).click();
  await expect(
    page.getByRole("button", { name: "Azizbek — batafsil natijalar" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Azizbek — batafsil natijalar" }),
  ).toBeVisible();
});

test("four named children have clear separate monitoring and accessible mobile details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await register(page, address(), "Azizbek");
  const headers = { Origin: "http://127.0.0.1:5173", "X-WBooks-Client": "web" };
  const first = (await session(page)).selectedChildId;
  await page.request.post(`/api/children/${first}/events`, {
    headers,
    data: {
      events: [
        {
          id: "family-first-completion-0001",
          type: "reading",
          storyId: "oy-dosti",
          page: 7,
          complete: true,
        },
      ],
    },
  });
  for (const name of ["Madina", "Yusuf", "Soliha"]) {
    await page
      .getByRole("button", { name: "Bola qo‘shish", exact: true })
      .click();
    await page.getByLabel("Bolaning ismi", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Profilni yaratish", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.goto("/#/parent");
  await expect(page.locator(".family-child-card")).toHaveCount(4);
  const aziz = page.getByRole("button", {
    name: "Azizbek — batafsil natijalar",
  });
  await expect(aziz).toContainText("1");
  await aziz.click();
  await expect(
    page.getByRole("region", { name: "Azizbek natijalari" }),
  ).toContainText("O‘qib tugatilgan");
  await page
    .getByRole("button", { name: "Madina — batafsil natijalar" })
    .click();
  const madina = page.getByRole("region", { name: "Madina natijalari" });
  await expect(madina).toContainText("Hali boshlanmagan");
  await expect(
    madina.getByRole("heading", { name: "Madina", exact: true }),
  ).toBeInViewport();
  await expect(madina).not.toContainText("O‘qib tugatilgan");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/#/");
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/parent/status")).json()).unlocked,
    )
    .toBe(false);
  await page.goto("/#/parent");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});

test("sign-in and sign-up have distinct routes, descriptions and confirmed new passwords", async ({
  page,
}) => {
  await page.goto("/#/account/login");
  await expect(
    page.getByRole("heading", { name: "Mavjud akkauntga kirish" }),
  ).toBeVisible();
  await expect(page.getByLabel("Parolni qayta kiriting")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true })
    .click();
  await expect(page).toHaveURL(/account\/register/);
  await expect(
    page.getByRole("heading", { name: "Yangi akkaunt yaratish" }),
  ).toBeVisible();
  await page.getByLabel("Ota-onaning e-maili").fill(address());
  await page.getByLabel("Parol", { exact: true }).fill(password);
  await page
    .getByLabel("Parolni qayta kiriting")
    .fill("another-test-only-passphrase");
  await page
    .getByRole("button", { name: "Akkaunt yaratish", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("bir xil");
  await expect(
    page.getByRole("button", { name: "Google orqali davom etish" }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Google orqali kirish hozircha mavjud emas. E-mail orqali davom eting.",
    ),
  ).toBeVisible();
});

test("reading activity stops in hidden and idle tabs and restarts on interaction", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await register(page, address(), "Faol kitobxon");
  const phases: string[] = [];
  await page.route("**/api/children/*/activity", async (route) => {
    phases.push(route.request().postDataJSON().phase);
    await route.continue();
  });
  await page.clock.install();
  await page.goto("/#/read/oy-dosti");
  await expect.poll(() => phases.includes("start")).toBe(true);
  await page.clock.fastForward(16000);
  await expect.poll(() => phases.at(-1)).toBe("pulse");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => phases.at(-1)).toBe("stop");
  const hiddenCount = phases.length;
  await page.clock.fastForward(60000);
  expect(phases.length).toBe(hiddenCount);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => phases.at(-1)).toBe("start");
  await page.clock.fastForward(91000);
  await expect.poll(() => phases.at(-1)).toBe("stop");
  await page.mouse.click(10, 10);
  await expect.poll(() => phases.at(-1)).toBe("start");
});
