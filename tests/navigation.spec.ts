import {
  test as base,
  expect,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type {
  AccountSession,
  FamilyOverview,
  ParentAccess,
  StoryVideoMap,
} from "../src/lib/api";
import type { ProfileProgress, ThemeId } from "../src/content/types";

const startedAt = "2026-11-01T10:00:00.000Z";
const completedAt = "2026-11-01T10:05:00.000Z";
const themes: ThemeId[] = ["classic", "forest", "ice", "holo"];
const destinations = [
  { label: "Kutubxona", path: "/" },
  { label: "Savol-javob", path: "/quiz" },
  { label: "Yutuqlarim", path: "/rewards" },
  { label: "Akkaunt", path: "/account" },
];
const emptyProgress = (theme: ThemeId = "classic"): ProfileProgress => ({
  version: 1,
  reading: {},
  quizzes: {},
  theme,
});
const googleAccess = (): ParentAccess => ({
  unlocked: true,
  pinSet: false,
  canUsePassword: false,
  googleLinked: true,
});
const familySession = (parent = googleAccess()): AccountSession => ({
  user: { id: "navigation-parent", email: "navigation@example.invalid" },
  children: [
    {
      id: "navigation-child",
      name: "Kitobxon",
      avatar: "sun",
      createdAt: startedAt,
    },
  ],
  selectedChildId: "navigation-child",
  parent,
});

type ApiCall = { key: string; body: unknown };
type MockApi = {
  session: AccountSession;
  parent: ParentAccess;
  progress: ProfileProgress;
  videos: StoryVideoMap;
  parentVideos: StoryVideoMap;
  calls: ApiCall[];
  handlers: Map<string, (route: Route) => Promise<void>>;
};
const reply = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
const callsTo = (mock: MockApi, key: string) =>
  mock.calls.filter((call) => call.key === key);

// Every API request is intercepted, including writes. Unexpected endpoints fail
// instead of falling through to a persistent database or registering an account.
const test = base.extend<{ mockApi: MockApi }>({
  mockApi: [
    async ({ page }, use) => {
      const mock: MockApi = {
        session: {
          user: null,
          children: [],
          selectedChildId: null,
          parent: null,
        },
        parent: googleAccess(),
        progress: emptyProgress(),
        videos: {},
        parentVideos: {},
        calls: [],
        handlers: new Map(),
      };
      const unexpected: string[] = [];
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.route("**/api/**", async (route) => {
        const request = route.request();
        const key = `${request.method()} ${new URL(request.url()).pathname}`;
        mock.calls.push({
          key,
          body: request.postData() ? request.postDataJSON() : undefined,
        });
        const handler = mock.handlers.get(key);
        if (handler) return handler(route);
        switch (key) {
          case "GET /api/session":
            return reply(route, mock.session);
          case "GET /api/auth/options":
            return reply(route, { googleClientId: "", nonce: null });
          case "GET /api/parent/status":
            return reply(route, mock.parent);
          case "GET /api/children/navigation-child/progress":
            return reply(route, { revision: 1, progress: mock.progress });
          case "GET /api/videos":
            return reply(route, { videos: mock.videos });
          case "GET /api/parent/videos":
            return reply(route, { videos: mock.parentVideos });
          // Child mode closes parent controls. The mock acknowledges the lock
          // without changing the fixture so each test keeps its declared state.
          case "POST /api/parent/lock":
            return reply(route, { ...mock.parent, unlocked: false });
          case "GET /api/parent/overview": {
            const overview: FamilyOverview = {
              generatedAt: startedAt,
              children: mock.session.children.map((profile) => ({
                profile,
                progress: mock.progress,
                metrics: {
                  started: Object.keys(mock.progress.reading).length,
                  completed: Object.values(mock.progress.reading).filter(
                    (record) => record.completedAt,
                  ).length,
                  quizAttempts: 0,
                  accuracy: null,
                  todaySeconds: 0,
                  weekSeconds: 0,
                  totalSeconds: 0,
                  lastActiveAt: null,
                },
                week: Array.from({ length: 7 }, (_, index) => ({
                  date: `2026-11-0${index + 1}`,
                  seconds: 0,
                  readingEvents: 0,
                  quizAttempts: 0,
                })),
                recent: [],
              })),
            };
            return reply(route, overview);
          }
          default:
            unexpected.push(key);
            return reply(
              route,
              { error: `Unexpected test request: ${key}` },
              501,
            );
        }
      });
      await use(mock);
      expect(
        unexpected,
        "All API calls must stay within the explicit mock contract",
      ).toEqual([]);
      expect(
        errors,
        "Navigation must not produce uncaught application errors",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

async function seedGuest(page: Page, progress = emptyProgress()) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("iqro.progress.v1"))
      localStorage.setItem("iqro.progress.v1", JSON.stringify(value));
  }, progress);
}

function readingFixture(theme: ThemeId = "classic"): ProfileProgress {
  return {
    ...emptyProgress(theme),
    reading: {
      "oy-dosti": { page: 7, startedAt },
      "bulut-kemasi": { page: 7, startedAt, completedAt },
    },
  };
}

async function expectNoOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: innerWidth,
  }));
  expect(widths.html).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
}

async function expectInsideViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}

const childNav = (page: Page) =>
  page.getByRole("navigation", { name: "Asosiy menyu", exact: true });
const storyCards = (page: Page) =>
  page.locator('#main-content a[href^="/story/"]');

async function expectActive(
  page: Page,
  label: string,
  value: "page" | "location" = "page",
) {
  const nav = childNav(page);
  await expect(nav).toHaveCount(1);
  await expect(nav.locator("a[aria-current]")).toHaveCount(1);
  await expect(
    nav.getByRole("link", { name: label, exact: true }),
  ).toHaveAttribute("aria-current", value);
  for (const destination of destinations.filter((item) => item.label !== label))
    await expect(
      nav.getByRole("link", { name: destination.label, exact: true }),
    ).not.toHaveAttribute("aria-current");
}

async function visitChildDestinations(page: Page, mobile: boolean) {
  await expectActive(page, "Kutubxona");
  await expect(childNav(page).getByRole("link")).toHaveCount(4);
  for (const { label, path } of destinations.slice(1)) {
    const link = childNav(page).getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", path);
    if (mobile) await expectInsideViewport(page, link);
    await link.click();
    await expect(page).toHaveURL((url) => url.pathname === path);
    await expectActive(page, label);
    if (path === "/quiz")
      await expect(
        page.getByRole("heading", { name: "Qani, bir o‘ylab ko‘ramiz!" }),
      ).toBeVisible();
    if (path === "/rewards")
      await expect(
        page.getByRole("heading", { name: "Har bir sahifa — yangi yulduz" }),
      ).toBeVisible();
    if (path === "/account")
      await expect(
        page.getByRole("heading", { name: "Akkauntga kirish", exact: true }),
      ).toBeVisible();
    await expectNoOverflow(page);
  }
  await page
    .getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true })
    .click();
  await expect(page).toHaveURL((url) => url.pathname === "/account/register");
  await expectActive(page, "Akkaunt", "location");
  await childNav(page)
    .getByRole("link", { name: "Savol-javob", exact: true })
    .click();
  await page.getByRole("link", { name: "Boshlash", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/quiz/general");
  await expect(
    page.getByRole("group", { name: "Javobni tanlang" }),
  ).toBeVisible();
  await expectActive(page, "Savol-javob", "location");
  await childNav(page)
    .getByRole("link", { name: "Kutubxona", exact: true })
    .click();
  await expect(page).toHaveURL((url) => url.pathname === "/" && !url.search);
  await expectActive(page, "Kutubxona");
  await storyCards(page).filter({ hasText: "Oyga maktub" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/story/oy-dosti");
  await expect(
    page.getByRole("heading", { name: "Oyga maktub", exact: true }),
  ).toBeVisible();
  await expectActive(page, "Kutubxona", "location");
  await expectNoOverflow(page);
  await childNav(page)
    .getByRole("link", { name: "Kutubxona", exact: true })
    .click();
  await expectActive(page, "Kutubxona");
}

async function expectAccessible(page: Page) {
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    scan.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
}

for (const viewport of [
  { width: 900, height: 360 },
  { width: 1024, height: 480 },
  { width: 1440, height: 900 },
]) {
  for (const theme of themes) {
    test(`${theme} desktop sidebar is full-width, navigable and keyboard-scrollable at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.setViewportSize(viewport);
      await seedGuest(page, emptyProgress(theme));
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const sidebar = page.getByRole("complementary", {
        name: "Kutubxona boshqaruvi",
      });
      await expect(sidebar).toBeVisible();
      expect((await sidebar.boundingBox())!.width).toBeCloseTo(248, 0);
      expect(
        await sidebar.evaluate(
          (element) => getComputedStyle(element).overflowY,
        ),
      ).toBe("auto");
      const nav = sidebar.getByRole("navigation", { name: "Asosiy menyu" });
      const navBox = (await nav.boundingBox())!;
      for (const link of await nav.getByRole("link").all()) {
        const box = (await link.boundingBox())!;
        expect(Math.abs(box.width - navBox.width)).toBeLessThanOrEqual(1);
        expect(Math.abs(box.x - navBox.x)).toBeLessThanOrEqual(1);
        expect(box.height).toBeGreaterThanOrEqual(48);
      }
      for (const element of await sidebar
        .locator(":scope > nav, :scope > a, :scope > button")
        .all())
        expect(
          await element.evaluate((node) => getComputedStyle(node).flexShrink),
        ).toBe("0");
      await visitChildDestinations(page, false);

      await sidebar.evaluate((element) => {
        element.scrollTop = 0;
      });
      await sidebar
        .getByRole("link", { name: "IdrokReads", exact: true })
        .focus();
      const lastAction = sidebar.getByRole("button", {
        name: /Mehmon kitobxon/,
      });
      const initiallyClipped =
        (await lastAction.boundingBox())!.y +
          (await lastAction.boundingBox())!.height >
        viewport.height;
      if (viewport.height < 500) {
        expect(initiallyClipped).toBe(true);
        expect(
          await sidebar.evaluate((element) => element.scrollHeight),
        ).toBeGreaterThan(viewport.height);
      }
      const themeAction = sidebar.getByRole("button", { name: /^Muhit:/ });
      const parentAction = sidebar.getByRole("link", {
        name: "Ota-onalar paneli",
        exact: true,
      });
      const tabOrder = [
        ...destinations.map(({ label }) =>
          nav.getByRole("link", { name: label, exact: true }),
        ),
        themeAction,
        parentAction,
        lastAction,
      ];
      for (const action of tabOrder) {
        await page.keyboard.press("Tab");
        await expect(action).toBeFocused();
        await expectInsideViewport(page, action);
        if (action === themeAction) {
          await page.keyboard.press("Enter");
          await expect(
            page.getByRole("dialog", { name: "O‘qish muhiti" }),
          ).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(
            page.getByRole("dialog", { name: "O‘qish muhiti" }),
          ).not.toBeVisible();
          await expect(themeAction).toBeFocused();
        }
      }
      if (initiallyClipped)
        expect(
          await sidebar.evaluate((element) => element.scrollTop),
        ).toBeGreaterThan(0);
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("dialog", { name: "Xush kelibsiz" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(lastAction).toBeFocused();
      await parentAction.press("Enter");
      await expect(page).toHaveURL((url) => url.pathname === "/parent/login");
      await expect(
        page.getByRole("heading", { name: "Akkauntga kirish", exact: true }),
      ).toBeVisible();
      await expectNoOverflow(page);
    });
  }
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 844, height: 390 },
]) {
  for (const theme of themes) {
    test(`${theme} mobile bottom navigation reaches all four destinations without overflow at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.setViewportSize(viewport);
      await seedGuest(page, emptyProgress(theme));
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(
        page.getByRole("complementary", { name: "Kutubxona boshqaruvi" }),
      ).toHaveCount(0);
      await expect(childNav(page)).toBeVisible();
      await expect(childNav(page).getByRole("link")).toHaveCount(4);
      for (const link of await childNav(page).getByRole("link").all()) {
        await expectInsideViewport(page, link);
        const box = (await link.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      await visitChildDestinations(page, true);
      await page
        .locator("header")
        .getByRole("button", { name: /^O‘qish muhiti:/ })
        .click();
      await expect(
        page.getByRole("dialog", { name: "O‘qish muhiti" }),
      ).toBeVisible();
      await expectNoOverflow(page);
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Profil menyusi", exact: true })
        .click();
      const profile = page.getByRole("dialog", { name: "Xush kelibsiz" });
      await expect(profile).toBeVisible();
      await profile
        .getByRole("link", { name: "Ota-onalar paneli", exact: true })
        .click();
      await expect(page).toHaveURL((url) => url.pathname === "/parent/login");
      await expectNoOverflow(page);
    });
  }
}

for (const width of [375, 1440]) {
  test(`parent navigation uses active destinations and returns to the child library at ${width}px`, async ({
    page,
    mockApi,
  }) => {
    mockApi.session = familySession();
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/parent");
    const nav = page.getByRole("navigation", { name: "Ota-onalar menyusi" });
    await expect(
      page.getByRole("heading", {
        name: "Har bir farzand — o‘z yo‘lida.",
      }),
    ).toBeVisible();
    await expect(nav.locator("a[aria-current]")).toHaveCount(1);
    await expect(
      nav.getByRole("link", { name: "Natijalar", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expectAccessible(page);
    await nav.getByRole("link", { name: "Videolar", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/parent/videos");
    await expect(
      page.getByRole("heading", { name: "Har bir hikoyaning videosi." }),
    ).toBeVisible();
    await expect(nav.locator("a[aria-current]")).toHaveCount(1);
    await expect(
      nav.getByRole("link", { name: "Videolar", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: "Natijalar", exact: true }),
    ).not.toHaveAttribute("aria-current");
    await expectNoOverflow(page);
    await expectAccessible(page);
    await nav.getByRole("link", { name: "Akkaunt", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/account");
    await expect(
      page.getByRole("heading", { name: "Oilamizning kutubxonasi" }),
    ).toBeVisible();
    await expectActive(page, "Akkaunt");
    await page
      .getByRole("link", { name: "Natijalar paneli", exact: true })
      .click();
    await expect(page).toHaveURL((url) => url.pathname === "/parent");
    await expect(
      nav.getByRole("link", { name: "Natijalar", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Kutubxona", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expectActive(page, "Kutubxona");
    await expectNoOverflow(page);
  });
}

test("library search and reading filters persist in the URL through browser back, forward and reload", async ({
  page,
}) => {
  await seedGuest(page, readingFixture());
  await page.goto("/");
  await expect(storyCards(page)).toHaveCount(3);
  const moon = storyCards(page).filter({ hasText: "Oyga maktub" });
  await expect(moon).toContainText("99%");
  await expect(moon).not.toContainText("Tugatilgan");
  await expect(moon.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "99",
  );
  const filters = page.getByRole("group", { name: "O‘qish holati" });
  await filters
    .getByRole("button", { name: "Boshlangan", exact: true })
    .click();
  await expect(storyCards(page)).toHaveCount(1);
  await expect(
    filters.getByRole("button", { name: "Boshlangan" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("searchbox", { name: "Hikoya qidirish" })
    .fill("DO'STLIK");
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("q") === "DO'STLIK" &&
      url.searchParams.get("status") === "reading",
  );
  await expect(storyCards(page)).toHaveCount(1);
  await expect(page.getByRole("status")).toHaveText("1 ta hikoya topildi");
  const filteredUrl = page.url();
  await moon.click();
  await expectActive(page, "Kutubxona", "location");
  await page.goBack();
  await expect(page).toHaveURL(filteredUrl);
  await expect(
    page.getByRole("searchbox", { name: "Hikoya qidirish" }),
  ).toHaveValue("DO'STLIK");
  await expect(
    filters.getByRole("button", { name: "Boshlangan" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(storyCards(page)).toHaveCount(1);
  await page.goForward();
  await expect(page).toHaveURL((url) => url.pathname === "/story/oy-dosti");
  await page.goBack();
  await page.reload();
  await expect(page).toHaveURL(filteredUrl);
  await expect(
    page.getByRole("searchbox", { name: "Hikoya qidirish" }),
  ).toHaveValue("DO'STLIK");
  await expect(storyCards(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Qidiruvni tozalash" }).click();
  await filters
    .getByRole("button", { name: "Tugatilgan", exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("status") === "completed" &&
      !url.searchParams.has("q"),
  );
  await expect(storyCards(page)).toHaveCount(1);
  await expect(storyCards(page)).toContainText("Bulutlar kemasi");
  await expect(storyCards(page)).toContainText("Tugatilgan");
  await expect(storyCards(page).getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await filters.getByRole("button", { name: "Barchasi", exact: true }).click();
  await expect(page).toHaveURL((url) => !url.search);
  await expect(storyCards(page)).toHaveCount(3);
});

for (const { status, label, message } of [
  {
    status: "reading",
    label: "Boshlangan",
    message: "Hali boshlagan hikoyang yo‘q. Kutubxonadan birini tanla.",
  },
  {
    status: "completed",
    label: "Tugatilgan",
    message: "Hikoyani o‘qib tugatganingdan keyin shu yerda ko‘rinadi.",
  },
]) {
  test(`library ${status} empty state is honest and its recovery resets filters`, async ({
    page,
  }) => {
    await page.goto(`/?status=${status}`);
    await expect(
      page
        .getByRole("group", { name: "O‘qish holati" })
        .getByRole("button", { name: label, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(storyCards(page)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Hikoya topilmadi" }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("0 ta hikoya topildi");
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Barcha hikoyalar", exact: true })
      .click();
    await expect(page).toHaveURL((url) => !url.search);
    await expect(storyCards(page)).toHaveCount(3);
    await expect(
      page.getByRole("heading", { name: "Hikoya topilmadi" }),
    ).toHaveCount(0);
  });
}

test("library unmatched search announces zero results; clearing preserves status and recovery clears both", async ({
  page,
}) => {
  await seedGuest(page, readingFixture());
  await page.goto("/?status=reading&q=topilmaydigan-hikoya");
  await expect(storyCards(page)).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("0 ta hikoya topildi");
  await expect(
    page.getByText("Boshqa nom bilan qidir yoki barcha hikoyalarni ko‘r.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Qidiruvni tozalash" }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("status") === "reading" &&
      !url.searchParams.has("q"),
  );
  await expect(storyCards(page)).toHaveCount(1);
  await page
    .getByRole("searchbox", { name: "Hikoya qidirish" })
    .fill("hech-narsa");
  await expect(storyCards(page)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Barcha hikoyalar", exact: true })
    .click();
  await expect(page).toHaveURL((url) => !url.search);
  await expect(
    page.getByRole("searchbox", { name: "Hikoya qidirish" }),
  ).toHaveValue("");
  await expect(
    page
      .getByRole("group", { name: "O‘qish holati" })
      .getByRole("button", { name: "Barchasi" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(storyCards(page)).toHaveCount(3);
});

for (const failure of ["network", "http", "invalid-json"] as const) {
  test(`session ${failure} failure blocks guest fallback and retry reloads the real session`, async ({
    page,
    mockApi,
  }) => {
    mockApi.session = familySession();
    await seedGuest(page, readingFixture("holo"));
    let failed = true;
    mockApi.handlers.set("GET /api/session", async (route) => {
      if (!failed) return reply(route, mockApi.session);
      if (failure === "network") return route.abort("failed");
      if (failure === "http")
        return reply(route, { error: "Session service unavailable" }, 503);
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html>Unavailable</html>",
      });
    });
    await page.goto("/account");
    await expect(
      page.getByRole("heading", { name: "Serverga ulanilmadi" }),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(
      "Akkaunt holatini tekshirib bo‘lmadi",
    );
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Akkauntga kirish", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Chiqish|Akkauntdan chiqish/ }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Mehmon kitobxon", { exact: true }),
    ).toHaveCount(0);
    const before = callsTo(mockApi, "GET /api/session").length;
    failed = false;
    await page
      .getByRole("button", { name: "Qayta urinish", exact: true })
      .click();
    await expect
      .poll(() => callsTo(mockApi, "GET /api/session").length)
      .toBeGreaterThan(before);
    await expect(
      page.getByRole("heading", { name: "Oilamizning kutubxonasi" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Kitobxon\s*Hozirgi profil/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText("navigation@example.invalid", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Serverga ulanilmadi" }),
    ).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "classic");
  });
}

async function finishSeededReader(page: Page) {
  await page.goto("/read/oy-dosti");
  await expect(
    page.getByRole("progressbar", { name: /o‘qish jarayoni/ }),
  ).toHaveAttribute("aria-valuenow", "8");
  await page.getByRole("button", { name: "Yakunlash", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Barakalla!", exact: true }),
  ).toBeVisible();
}

async function expectNoVideo(page: Page) {
  await expect(page.locator("iframe, video")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Videoni ko‘rish", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("main img")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "YouTube’da ochish" }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/Namuna video|Big Buck Bunny|Sintel|Elephants Dream/i),
  ).toHaveCount(0);
}

test("reader completion shows the library video without an override and loads no iframe before a click", async ({
  page,
  mockApi,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await seedGuest(page, readingFixture());
  await finishSeededReader(page);
  await expect(
    page.getByRole("heading", {
      name: "Oy nega shaklini o‘zgartiradi? (inglizcha)",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Kitob uchun video", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Videoni ko‘rish", exact: true }),
  ).toBeVisible();
  await expect(page.locator("iframe, video")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "YouTube’da ochish" }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=yXe0yxzYkjo");
  await expect(page.getByText("Ota-ona tanlovi", { exact: true })).toHaveCount(
    0,
  );
  expect(callsTo(mockApi, "GET /api/videos").length).toBeGreaterThan(0);
  await expectNoOverflow(page);
  await page.getByRole("link", { name: "Savol-javob", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/quiz/oy-dosti");
  await expect(
    page.getByRole("group", { name: "Javobni tanlang" }),
  ).toBeVisible();
});

for (const { storyId, title, videoId, poster } of [
  {
    storyId: "bulut-kemasi",
    title: "Qog‘ozdan kema yasaymiz (inglizcha)",
    videoId: "Xo0jbo0Z_Pk",
    poster: "/art/cloud-folding.webp",
  },
  {
    storyId: "dengiz-siri",
    title: "Ko‘k kit bilan tanishamiz (inglizcha)",
    videoId: "dciLg3Zm1hI",
    poster: "/art/picture-sea-home.webp",
  },
]) {
  test(`${storyId} completion shows its own library video and creates the embed only after a click`, async ({
    page,
  }) => {
    await seedGuest(page, {
      ...emptyProgress(),
      reading: { [storyId]: { page: 7, startedAt } },
    });
    await page.goto(`/read/${storyId}`);
    await expect(
      page.getByRole("progressbar", { name: /o‘qish jarayoni/ }),
    ).toHaveAttribute("aria-valuenow", "8");
    await page.getByRole("button", { name: "Yakunlash", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Kitob uchun video", { exact: true }),
    ).toBeVisible();
    const play = page.getByRole("button", {
      name: "Videoni ko‘rish",
      exact: true,
    });
    await expect(play.locator("img")).toHaveAttribute("src", poster);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "YouTube’da ochish" }),
    ).toHaveAttribute("href", `https://www.youtube.com/watch?v=${videoId}`);
    // Check our embed contract without depending on third-party playback.
    await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<p>Test player</p>",
      }),
    );
    await play.click();
    await expect(page.locator("iframe")).toHaveAttribute("title", title);
    await expect(page.locator("iframe")).toHaveAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1&autoplay=1`,
    );
  });
}

test("reader video request failure stays explicit at completion and retry uses only the saved family video", async ({
  page,
  mockApi,
}) => {
  let failed = true;
  mockApi.videos = {
    "oy-dosti": {
      url: "https://youtu.be/A1b2C3d4E5F",
      title: "Oilamiz tanlagan video",
      updatedAt: completedAt,
    },
  };
  mockApi.handlers.set("GET /api/videos", (route) =>
    failed
      ? reply(route, { error: "Video service unavailable" }, 503)
      : reply(route, { videos: mockApi.videos }),
  );
  await seedGuest(page, readingFixture());
  await finishSeededReader(page);
  await expect(
    page.getByRole("heading", { name: "Video yuklanmadi", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "Video sozlamalari yuklanmadi",
  );
  await expectNoVideo(page);
  const before = callsTo(mockApi, "GET /api/videos").length;
  failed = false;
  await page
    .getByRole("button", { name: "Videoni qayta tekshirish", exact: true })
    .click();
  await expect
    .poll(() => callsTo(mockApi, "GET /api/videos").length)
    .toBeGreaterThan(before);
  await expect(
    page.getByRole("heading", { name: "Oilamiz tanlagan video", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Videoni ko‘rish", exact: true }),
  ).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "YouTube’da ochish" }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=A1b2C3d4E5F");
  await expect(page.getByText("Namuna video", { exact: true })).toHaveCount(0);
});

function configureParentVideos(mock: MockApi) {
  mock.session = familySession();
  mock.parentVideos = {
    "oy-dosti": {
      url: "https://youtu.be/A1b2C3d4E5F",
      title: "Saqlangan oilaviy video",
      updatedAt: startedAt,
    },
  };
}

async function clickWithConfirmation(
  page: Page,
  action: Locator,
  accept: boolean,
  message: RegExp,
) {
  const dialogPromise = page.waitForEvent("dialog");
  const clickPromise = action.click();
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe("confirm");
  expect(dialog.message()).toMatch(message);
  if (accept) await dialog.accept();
  else await dialog.dismiss();
  await clickPromise;
}

test("parent video drafts never change published links; save and confirmed refresh use mocked server state", async ({
  page,
  mockApi,
}) => {
  configureParentVideos(mockApi);
  mockApi.handlers.set("POST /api/parent/videos", async (route) => {
    const body = route.request().postDataJSON() as {
      storyId: string;
      url: string;
      title: string;
    };
    const video = { ...body, updatedAt: completedAt };
    mockApi.parentVideos[body.storyId] = video;
    return reply(route, { video });
  });
  await page.goto("/parent/videos");
  const card = page.getByRole("article", { name: "Oyga maktub", exact: true });
  const url = card.getByRole("textbox", {
    name: "YouTube havolasi",
    exact: true,
  });
  const title = card.getByRole("textbox", { name: "Video nomi", exact: true });
  const published = card.getByRole("link", { name: "Saqlangan oilaviy video" });
  await expect(published).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=A1b2C3d4E5F",
  );
  await url.fill("https://youtu.be/F6g7H8i9J0K");
  await title.fill("Yangi oilaviy video");
  await expect(card.getByRole("status")).toHaveText("Saqlanmagan o‘zgarishlar");
  await expect(published).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=A1b2C3d4E5F",
  );
  await expect(
    card.getByRole("link", { name: "Tanlangan videoni tekshirish" }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=F6g7H8i9J0K");
  expect(callsTo(mockApi, "POST /api/parent/videos")).toHaveLength(0);
  await card.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(card.getByRole("status")).toHaveText(
    "Saqlandi. Kitob oxirida shu video chiqadi.",
  );
  await expect(
    card.getByRole("link", { name: "Yangi oilaviy video" }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=F6g7H8i9J0K");
  expect(callsTo(mockApi, "POST /api/parent/videos")).toEqual([
    {
      key: "POST /api/parent/videos",
      body: {
        storyId: "oy-dosti",
        url: "https://youtu.be/F6g7H8i9J0K",
        title: "Yangi oilaviy video",
      },
    },
  ]);

  await url.fill("https://example.invalid/not-youtube");
  await title.fill("Saqlanmagan nom");
  await card.getByRole("button", { name: "Saqlash", exact: true }).click();
  await expect(card.getByRole("alert")).toContainText(
    "bu YouTube videosi emas",
  );
  const before = callsTo(mockApi, "GET /api/parent/videos").length;
  const refresh = page.getByRole("button", { name: "Yangilash", exact: true });
  await clickWithConfirmation(
    page,
    refresh,
    false,
    /Saqlanmagan video o‘zgarishlari/,
  );
  await expect(url).toHaveValue("https://example.invalid/not-youtube");
  await expect(card.getByRole("alert")).toBeVisible();
  expect(callsTo(mockApi, "GET /api/parent/videos")).toHaveLength(before);
  await clickWithConfirmation(page, refresh, true, /bekor qilib yangilaysizmi/);
  await expect
    .poll(() => callsTo(mockApi, "GET /api/parent/videos").length)
    .toBeGreaterThan(before);
  await expect(url).toHaveValue("https://youtu.be/F6g7H8i9J0K");
  await expect(title).toHaveValue("Yangi oilaviy video");
  await expect(card.getByRole("alert")).toHaveCount(0);
  await expect(card.getByRole("status")).toHaveCount(0);
  await expect(card.locator("form")).toHaveAttribute(
    "data-video-dirty",
    "false",
  );
});

test("in-app navigation away from an unsaved parent video draft asks first", async ({
  page,
  mockApi,
}) => {
  configureParentVideos(mockApi);
  await page.goto("/parent/videos");
  const card = page.getByRole("article", { name: "Oyga maktub", exact: true });
  const url = card.getByRole("textbox", {
    name: "YouTube havolasi",
    exact: true,
  });
  const back = page.getByRole("link", {
    name: "Natijalarga qaytish",
    exact: true,
  });
  await back.click();
  await expect(page).toHaveURL(/\/parent$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/parent\/videos$/);
  await url.fill("https://youtu.be/F6g7H8i9J0K");
  await clickWithConfirmation(page, back, false, /Sahifadan chiqib/);
  await expect(page).toHaveURL(/\/parent\/videos$/);
  await expect(url).toHaveValue("https://youtu.be/F6g7H8i9J0K");
  await clickWithConfirmation(page, back, true, /Sahifadan chiqib/);
  await expect(page).toHaveURL(/\/parent$/);
  expect(callsTo(mockApi, "POST /api/parent/videos")).toHaveLength(0);
});

test("parent video removal requires confirmation and restores the library video instead of a demo", async ({
  page,
  mockApi,
}) => {
  configureParentVideos(mockApi);
  mockApi.handlers.set("POST /api/parent/videos/remove", async (route) => {
    const { storyId } = route.request().postDataJSON() as { storyId: string };
    delete mockApi.parentVideos[storyId];
    return reply(route, { ok: true });
  });
  await page.goto("/parent/videos");
  const card = page.getByRole("article", { name: "Oyga maktub", exact: true });
  const remove = card.getByRole("button", {
    name: "Videoni olib tashlash",
    exact: true,
  });
  await expect(remove).toBeEnabled();
  await clickWithConfirmation(
    page,
    remove,
    false,
    /«Oyga maktub».*olib tashlansinmi/,
  );
  expect(callsTo(mockApi, "POST /api/parent/videos/remove")).toHaveLength(0);
  await expect(
    card.getByRole("link", { name: "Saqlangan oilaviy video" }),
  ).toBeVisible();
  await clickWithConfirmation(
    page,
    remove,
    true,
    /«Oyga maktub».*olib tashlansinmi/,
  );
  await expect(card.getByRole("status")).toHaveText(
    "Kitobning asosiy videosi qaytarildi.",
  );
  expect(callsTo(mockApi, "POST /api/parent/videos/remove")).toEqual([
    { key: "POST /api/parent/videos/remove", body: { storyId: "oy-dosti" } },
  ]);
  await expect(
    card.getByRole("textbox", { name: "YouTube havolasi", exact: true }),
  ).toHaveValue("https://www.youtube.com/watch?v=yXe0yxzYkjo");
  await expect(
    card.getByRole("link", {
      name: "Oy nega shaklini o‘zgartiradi? (inglizcha)",
    }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=yXe0yxzYkjo");
  await expect(remove).toBeDisabled();
  await page.reload();
  await expect(card.getByText("Asl video", { exact: true })).toBeVisible();
  await expect(
    card.getByRole("link", {
      name: "Oy nega shaklini o‘zgartiradi? (inglizcha)",
    }),
  ).toBeVisible();
});

const securityPanel = (page: Page) =>
  page
    .locator("details")
    .filter({ has: page.getByText("Ota-onalar himoyasi", { exact: true }) });
async function openSecurity(page: Page) {
  await page.goto("/account");
  const panel = securityPanel(page);
  await panel.locator("summary").click();
  await expect(panel).toHaveAttribute("open", "");
  return panel;
}

async function fillNewPin(panel: Locator, pin: string, existing = false) {
  await panel
    .getByLabel(existing ? "Yangi 6 xonali kod" : "6 xonali kod yarating", {
      exact: true,
    })
    .fill(pin);
  await panel.getByLabel("Kodni qayta kiriting", { exact: true }).fill(pin);
}

test("account security distinguishes loading and status failure and retries before exposing PIN controls", async ({
  page,
  mockApi,
}) => {
  mockApi.session = familySession();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let failed = true;
  mockApi.handlers.set("GET /api/parent/status", async (route) => {
    if (!failed) return reply(route, mockApi.parent);
    await pending;
    return reply(
      route,
      { error: "Himoya xizmatiga ulanilmadi", code: "server_unavailable" },
      503,
    );
  });
  const panel = await openSecurity(page);
  await expect(panel.getByRole("status")).toHaveText(
    "Himoya holati tekshirilyapti…",
  );
  await expect(panel.locator("form")).toHaveCount(0);
  await expect(
    panel.getByRole("button", { name: "Kodni saqlash" }),
  ).toHaveCount(0);
  release();
  await expect(panel.getByRole("alert")).toHaveText(
    "Himoya xizmatiga ulanilmadi",
  );
  await expect(panel.locator("summary")).toContainText(
    "Himoya holati aniqlanmadi",
  );
  await expect(panel.locator("summary")).not.toContainText(
    "Ota-ona kodi sozlanmagan",
  );
  await expect(panel.locator("form")).toHaveCount(0);
  const before = callsTo(mockApi, "GET /api/parent/status").length;
  failed = false;
  await panel
    .getByRole("button", { name: "Qayta urinish", exact: true })
    .click();
  await expect
    .poll(() => callsTo(mockApi, "GET /api/parent/status").length)
    .toBeGreaterThan(before);
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await expect(panel.locator("summary")).toContainText(
    "Google bilan himoyalangan",
  );
  await expect(
    panel.getByLabel("6 xonali kod yarating", { exact: true }),
  ).toBeVisible();
  expect(callsTo(mockApi, "POST /api/parent/pin")).toHaveLength(0);
});

for (const source of ["status", "parent-locked-error"] as const) {
  test(`account ${source} locks PIN setup and directs the parent to the protected panel`, async ({
    page,
    mockApi,
  }) => {
    mockApi.parent = { ...googleAccess(), unlocked: false, pinSet: true };
    mockApi.session = familySession(mockApi.parent);
    let failed = source === "parent-locked-error";
    mockApi.handlers.set("GET /api/parent/status", (route) =>
      failed
        ? reply(
            route,
            { error: "Ota-ona kirishi qulflangan", code: "parent_locked" },
            403,
          )
        : reply(route, mockApi.parent),
    );
    const panel = await openSecurity(page);
    await expect(panel.locator("summary")).toContainText(
      "Ota-ona kirishi qulflangan",
    );
    await expect(panel.locator("form")).toHaveCount(0);
    await expect(
      panel.getByRole("button", { name: "Kodni saqlash", exact: true }),
    ).toHaveCount(0);
    await expect(
      panel.getByRole("link", {
        name: "Ota-onalar bo‘limini ochish",
        exact: true,
      }),
    ).toHaveAttribute("href", "/parent");
    failed = false;
    await panel
      .getByRole("link", { name: "Ota-onalar bo‘limini ochish", exact: true })
      .click();
    await expect(page).toHaveURL((url) => url.pathname === "/parent");
    await expect(
      page.getByRole("heading", { name: "Bu bo‘lim faqat ota-onalar uchun" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("6 xonali ota-ona kodi", { exact: true }),
    ).toBeVisible();
    expect(callsTo(mockApi, "POST /api/parent/pin")).toHaveLength(0);
    expect(callsTo(mockApi, "POST /api/parent/unlock")).toHaveLength(0);
  });
}

test("an unlocked Google-only account can create its first PIN without inventing a password or current PIN", async ({
  page,
  mockApi,
}) => {
  mockApi.session = familySession();
  let failed = true;
  mockApi.handlers.set("POST /api/parent/pin", async (route) => {
    if (failed)
      return reply(
        route,
        { error: "Kod saqlanmadi", code: "server_unavailable" },
        503,
      );
    mockApi.parent = { ...mockApi.parent, pinSet: true };
    return reply(route, mockApi.parent);
  });
  const panel = await openSecurity(page);
  await expect(panel.locator("summary")).toContainText(
    "Google bilan himoyalangan",
  );
  await expect(
    panel.getByLabel("Hozirgi 6 xonali kod", { exact: true }),
  ).toHaveCount(0);
  await expect(panel.getByLabel("Akkaunt paroli", { exact: true })).toHaveCount(
    0,
  );
  await fillNewPin(panel, "482619");
  await panel
    .getByLabel("Kodni qayta kiriting", { exact: true })
    .fill("482618");
  await panel
    .getByRole("button", { name: "Kodni saqlash", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toHaveText(
    "Ikkala kod bir xil bo‘lsin.",
  );
  expect(callsTo(mockApi, "POST /api/parent/pin")).toHaveLength(0);
  await panel
    .getByLabel("Kodni qayta kiriting", { exact: true })
    .fill("482619");
  await panel
    .getByRole("button", { name: "Kodni saqlash", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toHaveText("Kod saqlanmadi");
  await expect(
    panel.getByText("Ota-ona kodi saqlandi.", { exact: true }),
  ).toHaveCount(0);
  failed = false;
  await panel
    .getByRole("button", { name: "Kodni saqlash", exact: true })
    .click();
  await expect(
    panel.getByRole("status").filter({ hasText: "Ota-ona kodi saqlandi." }),
  ).toBeVisible();
  await expect(panel.locator("summary")).toContainText("6 xonali kod yoqilgan");
  await expect(
    panel.getByLabel("Yangi 6 xonali kod", { exact: true }),
  ).toHaveValue("");
  await expect(
    panel.getByLabel("Kodni qayta kiriting", { exact: true }),
  ).toHaveValue("");
  expect(callsTo(mockApi, "POST /api/parent/unlock")).toHaveLength(0);
  expect(
    callsTo(mockApi, "POST /api/parent/pin").map((call) => call.body),
  ).toEqual([{ pin: "482619" }, { pin: "482619" }]);
  expect(
    await page.evaluate(() =>
      Object.values(localStorage).some((value) => value.includes("482619")),
    ),
  ).toBe(false);
});

for (const method of ["pin", "password"] as const) {
  test(`changing an existing parent PIN requires a valid ${method} before the mocked PIN write`, async ({
    page,
    mockApi,
  }) => {
    mockApi.parent = { ...googleAccess(), pinSet: true, canUsePassword: true };
    mockApi.session = familySession(mockApi.parent);
    const correct =
      method === "pin" ? "482619" : "navigation-fixture-passphrase";
    mockApi.handlers.set("POST /api/parent/unlock", (route) => {
      const body = route.request().postDataJSON() as {
        method: string;
        secret: string;
      };
      return body.method === method && body.secret === correct
        ? reply(route, mockApi.parent)
        : reply(
            route,
            { error: "Tasdiqlash siri noto‘g‘ri", code: "invalid_secret" },
            403,
          );
    });
    mockApi.handlers.set("POST /api/parent/pin", (route) =>
      reply(route, mockApi.parent),
    );
    const panel = await openSecurity(page);
    if (method === "password")
      await panel
        .getByRole("button", { name: "Parol bilan tasdiqlash", exact: true })
        .click();
    const secret = panel.getByLabel(
      method === "pin" ? "Hozirgi 6 xonali kod" : "Akkaunt paroli",
      { exact: true },
    );
    await expect(secret).toHaveAttribute("required", "");
    await fillNewPin(panel, "739215", true);
    await panel
      .getByRole("button", { name: "Kodni saqlash", exact: true })
      .click();
    expect(callsTo(mockApi, "POST /api/parent/unlock")).toHaveLength(0);
    expect(callsTo(mockApi, "POST /api/parent/pin")).toHaveLength(0);
    await secret.fill(
      method === "pin" ? "111111" : "incorrect-fixture-passphrase",
    );
    await panel
      .getByRole("button", { name: "Kodni saqlash", exact: true })
      .click();
    await expect(panel.getByRole("alert")).toHaveText(
      "Tasdiqlash siri noto‘g‘ri",
    );
    await expect(secret).toHaveValue("");
    expect(callsTo(mockApi, "POST /api/parent/pin")).toHaveLength(0);
    await secret.fill(correct);
    await panel
      .getByRole("button", { name: "Kodni saqlash", exact: true })
      .click();
    await expect(
      panel.getByRole("status").filter({ hasText: "Ota-ona kodi saqlandi." }),
    ).toBeVisible();
    await expect(secret).toHaveValue("");
    const writes = mockApi.calls.filter((call) => call.key.startsWith("POST"));
    expect(writes.map((call) => call.key)).toEqual([
      "POST /api/parent/unlock",
      "POST /api/parent/unlock",
      "POST /api/parent/pin",
    ]);
    expect(writes[1].body).toEqual({ method, secret: correct });
    expect(writes[2].body).toEqual({ pin: "739215" });
  });
}

for (const theme of ["classic", "holo"] as const) {
  for (const { path, heading, finish } of [
    {
      path: "/",
      heading: "Bugun qaysi olamga sayohat qilamiz?",
      finish: false,
    },
    { path: "/story/oy-dosti", heading: "Oyga maktub", finish: false },
    {
      path: "/quiz/general",
      heading: "O‘simlik o‘sishi uchun nimalar kerak?",
      finish: false,
    },
    {
      path: "/rewards",
      heading: "Har bir sahifa — yangi yulduz",
      finish: false,
    },
    {
      path: "/account/register",
      heading: "Yangi akkaunt yaratish",
      finish: false,
    },
    {
      path: "/read/oy-dosti",
      heading: "Oy nega shaklini o‘zgartiradi? (inglizcha)",
      finish: true,
    },
  ]) {
    test(`${theme} ${path}${finish ? " completion" : ""} has no serious or critical accessibility violations`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: theme === "holo" ? 375 : 1440,
        height: 900,
      });
      await seedGuest(page, readingFixture(theme));
      if (finish) await finishSeededReader(page);
      else await page.goto(path);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expectNoOverflow(page);
      await expectAccessible(page);
    });
  }
}
