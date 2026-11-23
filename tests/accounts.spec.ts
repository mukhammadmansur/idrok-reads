import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// These scenarios run against the real API with the isolated in-memory
// database configured in playwright.config.ts. Every test owns a fresh account.
const password = "browser-fixture-only-long-passphrase";
const address = () => `parent-${crypto.randomUUID()}@example.invalid`;
const writeHeaders = {
  Origin: "http://127.0.0.1:5173",
  "X-WBooks-Client": "web",
};

const childButton = (page: Page, name: string) =>
  page
    .getByRole("region", { name: "Kim kitob o‘qiydi?" })
    .getByRole("button", { name });

async function axe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(result.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

async function signUp(page: Page, email: string) {
  await page.goto("/account/register");
  await page.getByLabel("Ota-onaning e-maili").fill(email);
  await page.getByLabel("Parol", { exact: true }).fill(password);
  await page.getByLabel("Parolni qayta kiriting").fill(password);
  await page
    .getByRole("button", { name: "Akkaunt yaratish", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Birinchi profilni qo‘shing" }),
  ).toBeVisible();
}

async function signIn(page: Page, email: string) {
  await page.goto("/account/login");
  await page.getByLabel("Ota-onaning e-maili").fill(email);
  await page.getByLabel("Parol", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Akkauntga kirish", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Oilamizning kutubxonasi" }),
  ).toBeVisible();
}

/** Registers a parent and the first child. The app then enters child mode, which locks parent controls. */
async function register(page: Page, email: string, name = "Kitobxon") {
  await signUp(page, email);
  await page.getByLabel("Bolaning ismi").fill(name);
  const locked = page.waitForResponse(
    (r) => r.url().endsWith("/api/parent/lock") && r.ok(),
  );
  await page
    .getByRole("button", { name: "Profilni yaratish", exact: true })
    .click();
  await expect(page).toHaveURL(/127\.0\.0\.1:5173\/$/);
  await locked;
}

/** Opens the parent section with the account password, as a parent would. */
async function unlock(page: Page) {
  await page.goto("/parent");
  await page.getByLabel("Akkaunt paroli").fill(password);
  await page
    .getByRole("button", { name: "Bo‘limni ochish", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Har bir farzand — o‘z yo‘lida." }),
  ).toBeVisible();
}

/** Requires an unlocked parent section. */
async function addChild(page: Page, name: string) {
  await page.goto("/account");
  await page
    .getByRole("button", { name: "Bola qo‘shish", exact: true })
    .click();
  await page.getByLabel("Bolaning ismi", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Profilni yaratish", exact: true })
    .click();
  await expect(childButton(page, name)).toHaveAttribute("aria-pressed", "true");
}

async function session(page: Page) {
  return (await page.request.get("/api/session")).json();
}

const position = (page: Page) =>
  page.getByRole("progressbar", { name: /o‘qish jarayoni/ });

async function nextPage(page: Page) {
  const before = Number(await position(page).getAttribute("aria-valuenow"));
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect(position(page)).toHaveAttribute(
    "aria-valuenow",
    String(before + 1),
  );
}

/** Opens “Oyga maktub” and turns to the given 1-based page. */
async function readingPage(page: Page, index: number) {
  await page.goto("/read/oy-dosti");
  await expect(position(page)).toHaveAttribute("aria-valuenow", /\d/);
  for (
    let current = Number(await position(page).getAttribute("aria-valuenow"));
    current < index;
    current++
  )
    await nextPage(page);
  await expect(position(page)).toHaveAttribute("aria-valuenow", String(index));
}

async function savedPage(page: Page, child: string) {
  const response = await page.request.get(`/api/children/${child}/progress`);
  return (await response.json()).progress.reading["oy-dosti"]?.page;
}

const pendingKeys = (page: Page) =>
  page.evaluate(
    () =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("wbooks.pending.v1:"),
      ).length,
  );

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("a parent continues the same child on another device and logout revokes the session", async ({
  page,
  browser,
}) => {
  const email = address();
  await register(page, email, "Quyoshvoy");
  const child = (await session(page)).selectedChildId;
  await readingPage(page, 4);
  await expect.poll(() => savedPage(page, child)).toBe(3);

  const context = await browser.newContext({ reducedMotion: "reduce" });
  const second = await context.newPage();
  await signIn(second, email);
  await expect(second.getByText(email, { exact: true })).toBeVisible();
  await second.goto("/read/oy-dosti");
  await expect(position(second)).toHaveAttribute("aria-valuenow", "4");

  const cookie = (await context.cookies()).find(
    (c) => c.name === "wbooks_session",
  )!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Lax");
  expect(
    await second.evaluate(
      (secret) =>
        Object.values(localStorage).some((value) => value.includes(secret)),
      password,
    ),
  ).toBe(false);

  await second.goto("/account");
  await second.getByRole("button", { name: "Chiqish", exact: true }).click();
  await expect(second).toHaveURL(/127\.0\.0\.1:5173\/$/);
  const signedOut = await second.request.get("/api/session");
  expect(signedOut.status()).toBe(200);
  expect((await signedOut.json()).user).toBeNull();
  await context.close();
});

test("switching siblings resets the reader and another parent cannot load their progress", async ({
  page,
  browser,
}) => {
  await register(page, address(), "Birinchi");
  const first = (await session(page)).selectedChildId;
  await readingPage(page, 3);
  await expect.poll(() => savedPage(page, first)).toBe(2);

  await unlock(page);
  await addChild(page, "Ikkinchi");
  await page.goto("/read/oy-dosti");
  await expect(position(page)).toHaveAttribute("aria-valuenow", "1");

  // The reader is child mode, so switching back needs the parent again.
  await unlock(page);
  await page.goto("/account");
  await childButton(page, "Birinchi").click();
  await expect(childButton(page, "Birinchi")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/read/oy-dosti");
  await expect(position(page)).toHaveAttribute("aria-valuenow", "3");

  const context = await browser.newContext();
  const stranger = await context.newPage();
  await signUp(stranger, address());
  expect(
    (await stranger.request.get(`/api/children/${first}/progress`)).status(),
  ).toBe(404);
  await context.close();
});

test("a child cannot switch profiles from child mode without the parent", async ({
  page,
}) => {
  await register(page, address(), "Asal");
  await unlock(page);
  await addChild(page, "Bobur");
  const bobur = (await session(page)).selectedChildId;
  await page.goto("/");
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/parent/status")).json()).unlocked,
    )
    .toBe(false);
  await page
    .getByRole("button", { name: "Bobur Profilni almashtirish" })
    .click();
  const sheet = page.getByRole("dialog", { name: "Profil" });
  await sheet.getByRole("button", { name: "Asal" }).click();
  await expect(sheet.getByRole("alert")).toContainText("Ota-onalar bo‘limini");
  await expect(sheet.getByRole("button", { name: "Bobur" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    sheet.getByRole("link", { name: "Ota-onalar paneli" }),
  ).toBeVisible();
  expect((await session(page)).selectedChildId).toBe(bobur);
});

test("offline events survive reload and sync exactly once after reconnect", async ({
  page,
}) => {
  await register(page, address(), "Bardosh");
  const child = (await session(page)).selectedChildId;
  await readingPage(page, 2);
  await expect.poll(() => savedPage(page, child)).toBe(1);

  await page.route("**/api/children/*/events", (route) => route.abort());
  await nextPage(page);
  await expect.poll(() => pendingKeys(page)).toBeGreaterThan(0);
  await page.reload();
  await expect(position(page)).toHaveAttribute("aria-valuenow", "3");

  await page.unroute("**/api/children/*/events");
  await page.evaluate(() => dispatchEvent(new Event("online")));
  await expect.poll(() => savedPage(page, child)).toBe(2);
  await expect.poll(() => pendingKeys(page)).toBe(0);
});

test("guest reading stays separate until the parent explicitly imports it", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("guest-seeded")) return;
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
  });
  await register(page, address(), "Mehr");
  const child = (await session(page)).selectedChildId;
  const before = await (
    await page.request.get(`/api/children/${child}/progress`)
  ).json();
  expect(before.progress.reading).toEqual({});

  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Mahalliy natijalarni ko‘chirish" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Profilga qo‘shish", exact: true })
    .click();
  await expect
    .poll(async () => {
      const result = await (
        await page.request.get(`/api/children/${child}/progress`)
      ).json();
      return !!result.progress.reading["oy-dosti"]?.completedAt;
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

test("account forms and signed-in pages remain accessible at mobile width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/account/login");
  await expect(page.getByLabel("Ota-onaning e-maili")).toBeVisible();
  await axe(page);
  await noOverflow(page);

  await page.goto("/account/register");
  await expect(page.getByLabel("Parolni qayta kiriting")).toBeVisible();
  await axe(page);
  await noOverflow(page);

  await register(page, address(), "Yulduz");
  await axe(page);
  await noOverflow(page);
  await page.goto("/account");
  await expect(childButton(page, "Yulduz")).toBeVisible();
  await axe(page);
  await noOverflow(page);
});

test("a quiz completed during a write outage is saved once with server-graded answers", async ({
  page,
}) => {
  await register(page, address(), "Bilimdon");
  const child = (await session(page)).selectedChildId;
  await page.goto("/quiz/general");
  await page.route("**/api/children/*/events", (route) => route.abort());
  for (const [answer, next] of [
    ["Suv va quyosh nuri", "Keyingi savol"],
    ["Uni tinglash", "Keyingi savol"],
    ["Kit", "Natijani ko‘rish"],
  ]) {
    await page.getByText(answer, { exact: true }).click();
    await page
      .getByRole("button", { name: "Javobni tekshirish", exact: true })
      .click();
    await page.getByRole("button", { name: next, exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Ajoyib, bilimdon!" }),
  ).toBeVisible();

  // The best score survives a reload while the write is still pending.
  await page.reload();
  await expect(page.getByText("Eng yaxshi: 3", { exact: true })).toBeVisible();
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
  await expect.poll(() => pendingKeys(page)).toBe(0);
  await page.reload();
  await expect(page.getByText("Eng yaxshi: 3", { exact: true })).toBeVisible();
});

test("an expired session never exposes its child as the guest and pending work resumes on login", async ({
  page,
}) => {
  const email = address();
  await register(page, email, "SirliProfil");
  const child = (await session(page)).selectedChildId;
  await readingPage(page, 2);
  await expect.poll(() => savedPage(page, child)).toBe(1);

  await page.request.post("/api/auth/logout", {
    headers: writeHeaders,
    data: {},
  });
  await page.getByRole("button", { name: "Keyingi", exact: true }).click();
  await expect.poll(async () => !(await session(page)).user).toBe(true);

  await page.goto("/account");
  await expect(page.getByLabel("Ota-onaning e-maili")).toBeVisible();
  await expect(page.getByText("SirliProfil", { exact: true })).toHaveCount(0);
  await signIn(page, email);
  await expect(childButton(page, "SirliProfil")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect.poll(() => savedPage(page, child)).toBe(2);
});

test("one tab cannot discard another tab’s durable pending reading events", async ({
  page,
  context,
}) => {
  await register(page, address(), "IkkiOyna");
  const child = (await session(page)).selectedChildId;
  await readingPage(page, 1);
  await expect.poll(() => savedPage(page, child)).toBe(0);

  const second = await context.newPage();
  await second.emulateMedia({ reducedMotion: "reduce" });
  await second.goto("/read/oy-dosti");
  await expect(position(second)).toHaveAttribute("aria-valuenow", "1");
  await page.route("**/api/children/*/events", (r) => r.abort());
  await second.route("**/api/children/*/events", (r) => r.abort());
  await nextPage(page);
  await nextPage(second);
  await nextPage(second);
  await second.close();

  await page.unroute("**/api/children/*/events");
  await page.evaluate(() => dispatchEvent(new Event("online")));
  await expect.poll(() => savedPage(page, child)).toBe(2);
});

test("the parent PIN is required after returning to child mode and protects the server", async ({
  page,
}) => {
  await register(page, address(), "Azizbek");
  await unlock(page);
  await page.goto("/account");
  await page.getByText("Ota-onalar himoyasi", { exact: true }).click();
  await page.getByLabel("6 xonali kod yarating").fill("482619");
  await page.getByLabel("Kodni qayta kiriting").fill("482619");
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

  await page.goto("/parent");
  await expect(
    page.getByRole("heading", { name: "Bu bo‘lim faqat ota-onalar uchun" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Har bir farzand — o‘z yo‘lida." }),
  ).toHaveCount(0);
  await page.getByLabel("6 xonali ota-ona kodi").fill("111111");
  await page.getByRole("button", { name: "Bo‘limni ochish" }).click();
  await expect(page.getByRole("alert")).toContainText("noto‘g‘ri");
  await page.getByLabel("6 xonali ota-ona kodi").fill("482619");
  await page.getByRole("button", { name: "Bo‘limni ochish" }).click();
  await expect(page.getByRole("button", { name: /^Azizbek/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /^Azizbek/ })).toBeVisible();
});

test("four named children have clear separate monitoring and accessible mobile details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await register(page, address(), "Azizbek");
  const first = (await session(page)).selectedChildId;
  const saved = await page.request.post(`/api/children/${first}/events`, {
    headers: writeHeaders,
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
  expect(saved.ok()).toBe(true);
  await unlock(page);
  for (const name of ["Madina", "Yusuf", "Soliha"]) await addChild(page, name);

  await page.goto("/parent");
  await expect(page.getByRole("button", { name: /tugatilgan/ })).toHaveCount(4);
  const aziz = page.getByRole("button", { name: /^Azizbek/ });
  await expect(aziz).toContainText("1");
  await aziz.click();
  await expect(
    page.getByRole("region", { name: "Azizbek natijalari" }),
  ).toContainText("O‘qib tugatilgan");

  await page.getByRole("button", { name: /^Madina/ }).click();
  const madina = page.getByRole("region", { name: "Madina natijalari" });
  await expect(madina).toContainText("Hali boshlanmagan");
  await expect(madina).not.toContainText("O‘qib tugatilgan");
  await expect(
    madina.getByRole("heading", { name: "Madina", exact: true }),
  ).toBeInViewport();
  await axe(page);
  await noOverflow(page);

  await page.goto("/");
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/parent/status")).json()).unlocked,
    )
    .toBe(false);
  await page.goto("/parent");
  await expect(page.getByLabel("Akkaunt paroli")).toBeVisible();
  await axe(page);
  await noOverflow(page);
});

test("sign-in and sign-up have distinct routes and confirmed new passwords", async ({
  page,
}) => {
  await page.goto("/account/login");
  await expect(
    page.getByRole("heading", { name: "Akkauntga kirish" }),
  ).toBeVisible();
  await expect(page.getByLabel("Parolni qayta kiriting")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/register$/);
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
  // Without a configured client ID the Google control is replaced by guidance.
  await expect(
    page.getByText(
      "Google orqali kirish hozircha mavjud emas. E-mail orqali davom eting.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Google orqali/ })).toHaveCount(
    0,
  );
});

test("reading activity stops in hidden and idle tabs and restarts on interaction", async ({
  page,
}) => {
  await register(page, address(), "Faol kitobxon");
  const phases: string[] = [];
  await page.route("**/api/children/*/activity", async (route) => {
    phases.push(route.request().postDataJSON().phase);
    await route.continue();
  });
  await page.clock.install();
  await page.goto("/read/oy-dosti");
  await expect.poll(() => phases.includes("start")).toBe(true);
  await page.clock.fastForward(16000);
  await expect.poll(() => phases.at(-1)).toBe("pulse");

  const visibility = (state: "hidden" | "visible") =>
    page.evaluate((value) => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => value,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }, state);
  await visibility("hidden");
  await expect.poll(() => phases.at(-1)).toBe("stop");
  const hiddenCount = phases.length;
  await page.clock.fastForward(60000);
  expect(phases.length).toBe(hiddenCount);

  await visibility("visible");
  await expect.poll(() => phases.at(-1)).toBe("start");
  await page.clock.fastForward(91000);
  await expect.poll(() => phases.at(-1)).toBe("stop");
  await page.keyboard.press("Shift");
  await expect.poll(() => phases.at(-1)).toBe("start");
});
