import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Explicit browser-test fixture, never a runtime demo fallback or real family data.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/videos", (route) =>
    route.fulfill({
      json: {
        videos: Object.fromEntries(
          ["oy-dosti", "bulut-kemasi", "dengiz-siri"].map((id) => [
            id,
            {
              url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
              title: "Test fixture — parent-selected video",
              updatedAt: "2026-11-19T00:00:00.000Z",
            },
          ]),
        ),
      },
    }),
  );
  // The redesigned child world requires a local profile before the library
  // opens. Seed a default guest so the reader and home pages render directly;
  // per-test seeds below overwrite its progress (theme, reading position).
  await page.addInitScript(() => {
    if (!localStorage.getItem("iqro.local_profiles.v1")) {
      localStorage.setItem(
        "iqro.local_profiles.v1",
        JSON.stringify([
          {
            id: "themes-guest",
            name: "Kitobxon",
            avatarId: "sun",
            createdAt: "2026-11-01T10:00:00.000Z",
            progress: {
              version: 1,
              reading: {},
              quizzes: {},
              theme: "classic",
            },
            activeReadingSeconds: 0,
          },
        ]),
      );
      localStorage.setItem("iqro.active_local_profile_id.v1", "themes-guest");
    }
  });
});

const themes = [
  { id: "classic", name: "Oddiy kitob", short: "Oddiy" },
  { id: "magic", name: "Sehrgar olami", short: "Sehr" },
  { id: "cyber", name: "Kosmos olami", short: "Kosmos" },
  { id: "pirate", name: "Qaroqchilar dengizi", short: "Dengiz" },
] as const;

for (const width of [320, 390, 1440]) {
  test(`theme selection previews materials and persists at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.goto("/");
    for (const theme of themes) {
      await page.getByRole("button", { name: /O‘qish muhiti:|Muhit:/ }).click();
      const dialog = page.getByRole("dialog", { name: "O‘qish muhiti" });
      await expect(dialog.locator("button[aria-pressed]")).toHaveCount(6);
      await dialog
        .getByRole("button", { name: new RegExp(theme.name) })
        .click();
      await expect(dialog).not.toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        theme.id,
      );
      await page
        .getByRole("link", { name: "Savol-javob", exact: true })
        .click();
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        theme.id,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto("/parent/login");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "classic");
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "pirate");
  });

  for (const theme of themes) {
    test(`${theme.id} reader preserves position, large text and video at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await seedTheme(page, theme.id);
      await page.goto("/read/oy-dosti");
      const progress = page.getByRole("progressbar", {
        name: /o‘qish jarayoni/,
      });
      const book = page.locator('[class*="book"][data-size]');
      await expect(progress).toHaveAttribute("aria-valuenow", "1");
      const material = await page
        .locator('[class*="faceContent"]')
        .first()
        .evaluate((element) => ({
          paper: getComputedStyle(element).getPropertyValue("--paper").trim(),
          ink: getComputedStyle(element).getPropertyValue("--book-ink").trim(),
        }));
      if (theme.id === "cyber") {
        expect(material).toEqual({ paper: "#fbf4e4", ink: "#2c2350" });
      }
      await page.getByRole("button", { name: "Keyingi", exact: true }).click();
      await expect(progress).toHaveAttribute("aria-valuenow", "2");
      await page.keyboard.press("ArrowLeft");
      await expect(progress).toHaveAttribute("aria-valuenow", "1");
      await page.keyboard.press("ArrowRight");
      await expect(progress).toHaveAttribute("aria-valuenow", "2");
      await expect(
        page.getByRole("button", { name: "Keyingi", exact: true }),
      ).toBeEnabled();
      const height = (await book.boundingBox())!.height;
      await page
        .getByRole("button", { name: "Matn va muhit sozlamalari" })
        .click();
      const dialog = page.getByRole("dialog", { name: "O‘qish sozlamalari" });
      await dialog
        .getByRole("button", { name: "Juda katta", exact: true })
        .click();
      // The settings sheet groups themes separately from the text sizes, and
      // "Oddiy" appears in both groups, so scope theme picks to the grid.
      const themeGrid = dialog.locator('[class*="themeGrid"]');
      for (const option of themes) {
        await themeGrid
          .getByRole("button", { name: option.short, exact: true })
          .click();
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          option.id,
        );
        await expect(progress).toHaveAttribute("aria-valuenow", "2");
      }
      await themeGrid
        .getByRole("button", { name: theme.short, exact: true })
        .click();
      await dialog.getByRole("button", { name: "Yopish", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        theme.id,
      );
      await expect(book).toHaveAttribute("data-size", "2");
      await expect
        .poll(async () => Math.abs((await book.boundingBox())!.height - height))
        .toBeLessThanOrEqual(1);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? ""),
        ),
      ).toEqual([]);
      for (let position = 3; position <= 8; position++) {
        await page
          .getByRole("button", { name: "Keyingi", exact: true })
          .click();
        await expect(progress).toHaveAttribute(
          "aria-valuenow",
          String(position),
        );
      }
      await page
        .getByRole("button", { name: "Yakunlash", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: /^Barakalla/ }),
      ).toBeVisible();
      await expect(page.locator("iframe")).toHaveCount(0);
      await page.getByRole("button", { name: /Videoni ko‘rish/ }).click();
      await expect(page.locator("iframe")).toHaveAttribute(
        "src",
        /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
      );
    });
  }

  test(`cyber glass keeps both flip faces full height and supports drag at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await seedTheme(page, "cyber");
    await page.goto("/read/oy-dosti");
    const progress = page.getByRole("progressbar", { name: /o‘qish jarayoni/ });
    const book = page.locator('[class*="book"][data-size]');
    const box = (await book.boundingBox())!;
    const leafWidth = box.width / (width < 720 ? 1 : 2);
    const y = box.y + box.height * 0.7;
    const start = box.x + box.width - 40;
    await page.mouse.move(start, y);
    await page.mouse.down();
    await page.mouse.move(start - leafWidth * 0.46, y, { steps: 12 });
    await page.mouse.move(start, y, { steps: 12 });
    await page.mouse.up();
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
    await expect(
      page.getByRole("button", { name: "Keyingi", exact: true }),
    ).toBeEnabled();
    await page.mouse.move(start, y);
    await page.mouse.down();
    await page.mouse.move(start - leafWidth * 0.46, y, { steps: 12 });
    const faces = page.locator('[class*="sheetFace"] > [class*="faceContent"]');
    await expect(faces).toHaveCount(2);
    for (const face of await faces.all()) {
      expect(
        await face.evaluate((element) => element.clientHeight),
      ).toBeGreaterThanOrEqual(box.height - 2);
    }
    await page.mouse.up();
    await expect(progress).toHaveAttribute("aria-valuenow", "2");
    const backStart = box.x + 40;
    await page.mouse.move(backStart, y);
    await page.mouse.down();
    await page.mouse.move(backStart + leafWidth * 0.46, y, { steps: 12 });
    await page.mouse.up();
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  for (const theme of ["magic", "pirate"] as const) {
    test(`${theme} living scenes and all enriched pages remain readable at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await seedTheme(page, theme);
      await page.goto("/read/oy-dosti");
      const scene = page.locator('[class*="sceneImage"]').first();
      await expect
        .poll(() =>
          scene.evaluate(
            (element) => (element as HTMLImageElement).naturalWidth,
          ),
        )
        .toBeGreaterThan(0);
      expect(
        await scene.evaluate((element) => getComputedStyle(element).maskImage),
      ).toContain("iqro-scene-mask-v1.svg");
      expect(
        await page
          .locator('[class*="shell"]')
          .first()
          .evaluate((element) => getComputedStyle(element).backgroundImage),
      ).toContain(
        theme === "magic" ? "radial-gradient" : "repeating-linear-gradient",
      );
      expect(
        await page
          .locator('[class*="pageTrim"]')
          .first()
          .evaluate(
            (element) => getComputedStyle(element, "::before").backgroundImage,
          ),
      ).toContain(
        theme === "magic" ? "iqro-stars-v1.svg" : "iqro-ropes-v1.svg",
      );
      expect(
        await scene.evaluate(
          (element) => getComputedStyle(element).animationName,
        ),
      ).not.toBe("none");
      await page
        .getByRole("button", { name: "Rasmlar: jonli shu‘lalarni to‘xtatish" })
        .click();
      await expect(page.locator("[data-motion]")).toHaveAttribute(
        "data-motion",
        "off",
      );
      expect(
        await scene.evaluate(
          (element) => getComputedStyle(element).animationPlayState,
        ),
      ).toBe("paused");
      await page
        .getByRole("button", { name: "Rasmlar: jonli shu‘lalarni yoqish" })
        .click();
      await expect(page.locator("[data-motion]")).toHaveAttribute(
        "data-motion",
        "on",
      );

      const book = page.locator('[class*="book"][data-size]');
      const box = (await book.boundingBox())!;
      const leafWidth = box.width / (width < 720 ? 1 : 2);
      const y = box.y + box.height * 0.7;
      const start = box.x + box.width - 40;
      await page.mouse.move(start, y);
      await page.mouse.down();
      await page.mouse.move(start - leafWidth * 0.46, y, { steps: 12 });
      const faces = page.locator(
        '[class*="sheetFace"] > [class*="faceContent"]',
      );
      await expect(faces).toHaveCount(2);
      for (const face of await faces.all()) {
        expect(
          await face.evaluate((element) => element.clientHeight),
        ).toBeGreaterThanOrEqual(box.height - 2);
      }
      await page.mouse.move(start, y, { steps: 12 });
      await page.mouse.up();
      const progress = page.getByRole("progressbar", {
        name: /o‘qish jarayoni/,
      });
      await expect(progress).toHaveAttribute("aria-valuenow", "1");
      await expect(
        page.getByRole("button", { name: "Keyingi", exact: true }),
      ).toBeEnabled();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(page.locator("[data-motion]")).toHaveAttribute(
        "data-motion",
        "off",
      );
      expect(
        await scene.evaluate(
          (element) => getComputedStyle(element).animationName,
        ),
      ).toBe("none");

      const setSize = async (label: string) => {
        await page
          .getByRole("button", { name: "Matn va muhit sozlamalari" })
          .click();
        const dialog = page.getByRole("dialog", { name: "O‘qish sozlamalari" });
        await dialog
          .getByRole("group", { name: "Matn o‘lchami" })
          .getByRole("button", { name: label, exact: true })
          .click();
        await dialog
          .getByRole("button", { name: "Yopish", exact: true })
          .click();
      };
      const checkProse = async () => {
        const prose = page.locator('[class*="prose"]').first();
        const result = await prose.evaluate((element) => {
          const article = element as HTMLElement;
          const kicker = article.querySelector('[class*="kicker"]')!;
          const paragraph = article.querySelector("p")!;
          article.scrollTop = 0;
          const beginning =
            kicker.getBoundingClientRect().top -
            article.getBoundingClientRect().top;
          article.scrollTop = article.scrollHeight;
          const end =
            paragraph.getBoundingClientRect().bottom -
            article.getBoundingClientRect().bottom;
          const folio =
            article.parentElement!.querySelector('[class*="folio"]')!;
          const footerGap =
            folio.getBoundingClientRect().top -
            article.getBoundingClientRect().bottom;
          article.scrollTop = 0;
          return {
            beginning,
            end,
            footerGap,
            words: paragraph.textContent!.trim().split(/\s+/).length,
            height: article.clientHeight,
          };
        });
        expect(result.beginning).toBeGreaterThanOrEqual(-1);
        expect(result.end).toBeLessThanOrEqual(-8);
        expect(result.footerGap).toBeGreaterThanOrEqual(1);
        expect(result.words).toBeGreaterThanOrEqual(42);
        expect(result.words).toBeLessThanOrEqual(60);
        expect(result.height).toBeGreaterThan(60);
      };
      for (const slug of ["oy-dosti", "bulut-kemasi", "dengiz-siri"]) {
        await page.goto(`/read/${slug}`);
        await expect(progress).toHaveAttribute("aria-valuenow", "1");
        await checkProse();
        await setSize("Juda katta");
        for (let position = 1; position <= 8; position++) {
          await expect(progress).toHaveAttribute(
            "aria-valuenow",
            String(position),
          );
          await checkProse();
          const image = page.locator('[class*="sceneImage"]').first();
          const imageBox = (await image.boundingBox())!;
          expect(
            Math.abs(imageBox.width - imageBox.height),
          ).toBeLessThanOrEqual(1);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          if (position < 8)
            await page
              .getByRole("button", { name: "Keyingi", exact: true })
              .click();
        }
        await setSize("Oddiy");
        await checkProse();
      }
      await page.emulateMedia({
        media: "print",
        reducedMotion: "no-preference",
      });
      expect(
        await page
          .locator('[class*="sceneImage"]')
          .first()
          .evaluate((element) => getComputedStyle(element).animationName),
      ).toBe("none");
      await expect(page.locator('[class*="imprint"]').first()).toBeVisible();
      expect(
        await page
          .locator('[class*="pageTrim"]')
          .first()
          .evaluate(
            (element) => getComputedStyle(element, "::before").backgroundImage,
          ),
      ).not.toBe("none");
      expect(errors).toEqual([]);
    });
  }
}

const listenName = "Tinglash: matnni ovozli o‘qish";
const stopName = "To‘xtatish: ovozli o‘qish";
const layouts = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

type VoiceFixture = { lang: string; name?: string };
type UtteranceFixture = {
  text: string;
  lang: string;
  rate: number;
  voice: SpeechSynthesisVoice | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
};
interface SpeechMock {
  utterances: UtteranceFixture[];
  cancelled: UtteranceFixture[];
  getVoices(): SpeechSynthesisVoice[];
  setVoices(voices: VoiceFixture[]): void;
  emit(index: number, type: "end" | "error"): void;
  flushCancellation(): void;
}
declare global {
  interface Window {
    __speechMock: SpeechMock;
  }
}

async function mockSpeech(
  page: Page,
  options: {
    voices?: VoiceFixture[];
    unavailable?: "speechSynthesis" | "SpeechSynthesisUtterance";
    cancelCallbacks?: "none" | "immediate" | "late";
    throwOnSpeak?: boolean;
  } = {},
) {
  await page.addInitScript((config) => {
    const voicesFrom = (voices: VoiceFixture[]): SpeechSynthesisVoice[] =>
      voices.map(({ lang, name = `Fixture ${lang}` }) => ({
        lang,
        name,
        voiceURI: name,
        localService: true,
        default: false,
      }));
    class FakeUtterance extends EventTarget implements UtteranceFixture {
      lang = "";
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      constructor(public text = "") {
        super();
      }
    }
    class FakeSynthesis extends EventTarget implements SpeechMock {
      utterances: FakeUtterance[] = [];
      cancelled: FakeUtterance[] = [];
      voices = voicesFrom(config.voices ?? [{ lang: "uz-UZ" }]);
      active: FakeUtterance | null = null;
      pending: (() => void)[] = [];
      getVoices() {
        return this.voices;
      }
      setVoices(voices: VoiceFixture[]) {
        this.voices = voicesFrom(voices);
        this.dispatchEvent(new Event("voiceschanged"));
      }
      speak(utterance: FakeUtterance) {
        this.utterances.push(utterance);
        if (config.throwOnSpeak) throw new Error("Fixture speech failure");
        this.active = utterance;
      }
      emit(index: number, type: "end" | "error") {
        const utterance = this.utterances[index];
        if (this.active === utterance) this.active = null;
        const event = new Event(type);
        utterance.dispatchEvent(event);
        if (type === "end") utterance.onend?.(event);
        else utterance.onerror?.(event);
      }
      cancel() {
        const utterance = this.active;
        this.active = null;
        if (!utterance) return;
        this.cancelled.push(utterance);
        const index = this.utterances.indexOf(utterance);
        const callbacks = () => {
          this.emit(index, "end");
          this.emit(index, "error");
        };
        if (config.cancelCallbacks === "immediate") callbacks();
        if (config.cancelCallbacks === "late") this.pending.push(callbacks);
      }
      flushCancellation() {
        this.pending.splice(0).forEach((callback) => callback());
      }
    }
    const synthesis = new FakeSynthesis();
    window.__speechMock = synthesis;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: synthesis,
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: FakeUtterance,
    });
    if (config.unavailable) Reflect.deleteProperty(window, config.unavailable);
  }, options);
}

/** Seeds the guest progress store and the active local profile with a theme. */
async function seedTheme(page: Page, theme: string) {
  await page.addInitScript((id) => {
    const progress = {
      version: 1,
      reading: {},
      quizzes: {},
      theme: id,
    };
    localStorage.setItem("iqro.progress.v1", JSON.stringify(progress));
    const profiles = JSON.parse(
      localStorage.getItem("iqro.local_profiles.v1") || "[]",
    );
    const next = profiles.length
      ? profiles.map((profile: any) => ({ ...profile, progress }))
      : [
          {
            id: "themes-guest",
            name: "Kitobxon",
            avatarId: "sun",
            createdAt: "2026-11-01T10:00:00.000Z",
            progress,
          },
        ];
    localStorage.setItem("iqro.local_profiles.v1", JSON.stringify(next));
    localStorage.setItem("iqro.active_local_profile_id.v1", next[0].id);
  }, theme);
}

async function seedReader(page: Page, position = 0) {
  await page.addInitScript((index) => {
    const progress = {
      version: 1,
      reading: {
        "oy-dosti": { page: index, startedAt: "2026-01-01T00:00:00.000Z" },
      },
      quizzes: {},
      theme: "classic",
    };
    localStorage.setItem("iqro.progress.v1", JSON.stringify(progress));
    const profiles = JSON.parse(
      localStorage.getItem("iqro.local_profiles.v1") || "[]",
    );
    const next = profiles.length
      ? profiles.map((profile: any) => ({ ...profile, progress }))
      : [
          {
            id: "themes-guest",
            name: "Kitobxon",
            avatarId: "sun",
            createdAt: "2026-11-01T10:00:00.000Z",
            progress,
          },
        ];
    localStorage.setItem("iqro.local_profiles.v1", JSON.stringify(next));
    localStorage.setItem("iqro.active_local_profile_id.v1", next[0].id);
  }, position);
}

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: innerWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
}

async function expectInsideViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function finishReader(page: Page) {
  const progress = page.getByRole("progressbar", { name: /o‘qish jarayoni/ });
  const position = Number(await progress.getAttribute("aria-valuenow"));
  for (let index = position + 1; index <= 8; index++) {
    await page.getByRole("button", { name: "Keyingi", exact: true }).click();
    await expect(progress).toHaveAttribute("aria-valuenow", String(index));
  }
  await page.getByRole("button", { name: "Yakunlash", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Barakalla/ })).toBeVisible();
}

test.describe("reader polish regressions", () => {
  for (const layout of layouts) {
    test(`IdrokReads child and parent wordmarks and title fit at ${layout.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(layout);
      await page.goto("/");
      const childBrand = page.getByRole("link", {
        name: "IdrokReads",
        exact: true,
      });
      await expect(childBrand).toHaveCount(1);
      await expect(childBrand).toHaveText("IdrokReads");
      await expectInsideViewport(page, childBrand);
      await expect(page).toHaveTitle("IdrokReads — Hikoyalar olami");
      await expectNoHorizontalOverflow(page);
      await page.goto("/parent/login");
      const parentBrand = page.getByRole("link", { name: /^IdrokReads/ });
      await expect(parentBrand.locator('[class*="brandText"]')).toHaveText(
        "IdrokReads",
      );
      await expect(parentBrand).toHaveAttribute("href", "/parent");
      await expectInsideViewport(page, parentBrand);
      await expect(page).toHaveTitle("IdrokReads — Hikoyalar olami");
      await expectNoHorizontalOverflow(page);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? ""),
        ),
      ).toEqual([]);
    });

    test(`all four themes keep concentric book edges and labelled 44px tools at ${layout.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(layout);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/read/oy-dosti");
      const themeGrid = (dialog: Locator) =>
        dialog.locator('[class*="themeGrid"]');
      for (const theme of themes) {
        await page
          .getByRole("button", { name: "Matn va muhit sozlamalari" })
          .click();
        const dialog = page.getByRole("dialog", { name: "O‘qish sozlamalari" });
        await themeGrid(dialog)
          .getByRole("button", { name: theme.short, exact: true })
          .click();
        await dialog
          .getByRole("button", { name: "Yopish", exact: true })
          .click();
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          theme.id,
        );
        const geometry = await page
          .locator('[class*="book"][data-size]')
          .evaluate((book) => {
            const cover = getComputedStyle(book.parentElement!);
            const paper = getComputedStyle(book);
            const corners = (style: CSSStyleDeclaration) =>
              [
                style.borderTopLeftRadius,
                style.borderTopRightRadius,
                style.borderBottomRightRadius,
                style.borderBottomLeftRadius,
              ].map(Number.parseFloat);
            const mobile = book.querySelector('[class*="mobilePage"]');
            return {
              cover: corners(cover),
              padding: [
                cover.paddingTop,
                cover.paddingRight,
                cover.paddingBottom,
                cover.paddingLeft,
              ].map(Number.parseFloat),
              border: [
                cover.borderTopWidth,
                cover.borderRightWidth,
                cover.borderBottomWidth,
                cover.borderLeftWidth,
              ].map(Number.parseFloat),
              paper: corners(paper),
              mobile: mobile ? corners(getComputedStyle(mobile)) : null,
            };
          });
        expect(geometry.cover[0]).toBeGreaterThan(0);
        for (let corner = 0; corner < 4; corner++) {
          expect(geometry.cover[corner]).toBeCloseTo(geometry.cover[0], 2);
          expect(geometry.padding[corner]).toBeCloseTo(geometry.padding[0], 2);
          expect(geometry.border[corner]).toBeCloseTo(geometry.border[0], 2);
          expect(geometry.paper[corner]).toBeCloseTo(
            geometry.cover[corner] -
              geometry.padding[corner] -
              geometry.border[corner],
            2,
          );
        }
        if (layout.width < 720) expect(geometry.mobile).toEqual(geometry.paper);
        else expect(geometry.mobile).toBeNull();
        for (const [name, label] of [
          ["Rasmlar: jonli shu‘lalarni yoqish", "Rasmlar"],
          [listenName, "Tinglash"],
          ["Matn va muhit sozlamalari", "Matn"],
        ]) {
          const tool = page.getByRole("button", { name, exact: true });
          await expect(tool).toContainText(label);
          const box = (await tool.boundingBox())!;
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
          await expectInsideViewport(page, tool);
        }
        await expectNoHorizontalOverflow(page);
      }
    });

    test(`completion layout and accessible actions work at ${layout.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(layout);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await seedReader(page, 7);
      await page.goto("/read/oy-dosti");
      await finishReader(page);
      await expectNoHorizontalOverflow(page);
      await expect(
        page.getByRole("button", { name: /Videoni ko‘rish/ }),
      ).toBeVisible();
      await expect(page.locator("iframe")).toHaveCount(0);
      const actions = page.locator('[class*="doneActions"]');
      await expect(actions.locator("a, button")).toHaveCount(3);
      if (layout.width >= 1000) {
        for (const action of await actions.locator("a, button").all())
          await expectInsideViewport(page, action);
        const hero = (await page.locator('[class*="doneHero"]').boundingBox())!;
        const video = (await page
          .locator('[class*="doneVideo"]')
          .boundingBox())!;
        expect(video.x).toBeGreaterThan(hero.x + hero.width);
        expect(Math.abs(video.y - hero.y)).toBeLessThanOrEqual(1);
        expect(
          Math.min(video.y + video.height, hero.y + hero.height),
        ).toBeGreaterThan(Math.max(video.y, hero.y));
      }
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? ""),
        ),
      ).toEqual([]);
      if (layout.width >= 1000) return;

      await page
        .getByRole("button", { name: "Yana o‘qish", exact: true })
        .click();
      await expect(
        page.getByRole("progressbar", { name: /o‘qish jarayoni/ }),
      ).toHaveAttribute("aria-valuenow", "1");
      await expectNoHorizontalOverflow(page);
      await finishReader(page);
      await page
        .getByRole("link", { name: "Savol-javobni yechish", exact: true })
        .click();
      await expect(page).toHaveURL(/\/quiz\/oy-dosti$/);
      await expect(
        page.getByRole("group", { name: "Javobni tanla" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Avval sarguzashtni kashf etamiz" }),
      ).toHaveCount(0);
      await page.goto("/read/oy-dosti");
      await finishReader(page);
      await page
        .getByRole("link", { name: "Kutubxonaga", exact: true })
        .click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("#main-content")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  for (const theme of themes.slice(1)) {
    test(`${theme.id} completion keeps controls visible and readable over the world`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await seedReader(page, 7);
      await page.goto("/read/oy-dosti");
      await page
        .getByRole("button", { name: "Matn va muhit sozlamalari" })
        .click();
      const dialog = page.getByRole("dialog", { name: "O‘qish sozlamalari" });
      await dialog
        .locator('[class*="themeGrid"]')
        .getByRole("button", { name: theme.short, exact: true })
        .click();
      await dialog.getByRole("button", { name: "Yopish", exact: true }).click();
      await finishReader(page);
      for (const action of await page
        .locator('[class*="doneActions"] a, [class*="doneActions"] button')
        .all())
        await expectInsideViewport(page, action);
      await expectNoHorizontalOverflow(page);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? ""),
        ),
      ).toEqual([]);
    });
  }

  for (const unavailable of [
    "speechSynthesis",
    "SpeechSynthesisUtterance",
  ] as const) {
    test(`missing ${unavailable} reports unsupported narration and dismisses status`, async ({
      page,
    }) => {
      await mockSpeech(page, { unavailable });
      await page.goto("/read/oy-dosti");
      await page.getByRole("button", { name: listenName, exact: true }).click();
      const status = page.getByRole("status");
      await expect(status).toBeVisible();
      await expect(status).toContainText(
        "Bu qurilmada ovozli o‘qish mavjud emas",
      );
      expect(
        await page.evaluate(() => window.__speechMock.utterances.length),
      ).toBe(0);
      await page
        .getByRole("button", { name: "Ovoz xabarini yopish", exact: true })
        .click();
      await expect(status).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: listenName, exact: true }),
      ).toHaveAttribute("aria-pressed", "false");
    });
  }

  test("non-Uzbek voices never speak and explain the device requirement", async ({
    page,
  }) => {
    await mockSpeech(page, {
      voices: [{ lang: "en-US" }, { lang: "ru-RU" }, { lang: "uzbek" }],
    });
    await page.goto("/read/oy-dosti");
    await page.getByRole("button", { name: listenName, exact: true }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "o‘zbekcha ovoz topilmadi",
    );
    expect(
      await page.evaluate(() => window.__speechMock.utterances.length),
    ).toBe(0);
    await expect(
      page.getByRole("button", { name: listenName, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("asynchronous voiceschanged enables Uzbek page narration and end restores listening", async ({
    page,
  }) => {
    await mockSpeech(page, { voices: [] });
    await page.goto("/read/oy-dosti");
    await page.getByRole("button", { name: listenName, exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      "o‘zbekcha ovoz topilmadi",
    );
    await page.evaluate(() =>
      window.__speechMock.setVoices([
        { lang: "en-US" },
        { lang: "UZ_uz", name: "Async Uzbek fixture" },
      ]),
    );
    await page.getByRole("button", { name: listenName, exact: true }).click();
    await expect(
      page.getByRole("button", { name: stopName, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status")).toHaveCount(0);
    const text = await page.locator('[class*="prose"] p').first().textContent();
    expect(
      await page.evaluate(() => {
        const utterance = window.__speechMock.utterances[0];
        return {
          count: window.__speechMock.utterances.length,
          text: utterance.text,
          lang: utterance.lang,
          voice: utterance.voice?.name,
          rate: utterance.rate,
        };
      }),
    ).toEqual({
      count: 1,
      text,
      lang: "UZ_uz",
      voice: "Async Uzbek fixture",
      rate: 0.92,
    });
    await page.evaluate(() => window.__speechMock.emit(0, "end"));
    await expect(
      page.getByRole("button", { name: listenName, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("status")).toHaveCount(0);
    expect(
      await page.evaluate(() => window.__speechMock.cancelled.length),
    ).toBe(0);
  });

  for (const failure of ["event", "throw"] as const) {
    test(`speech ${failure} failure exposes a visible recoverable status`, async ({
      page,
    }) => {
      await mockSpeech(page, { throwOnSpeak: failure === "throw" });
      await page.goto("/read/oy-dosti");
      await page.getByRole("button", { name: listenName, exact: true }).click();
      if (failure === "event") {
        await expect(
          page.getByRole("button", { name: stopName, exact: true }),
        ).toBeVisible();
        await page.evaluate(() => window.__speechMock.emit(0, "error"));
      }
      await expect(page.getByRole("status")).toBeVisible();
      await expect(page.getByRole("status")).toContainText(
        "Ovozli o‘qish ishga tushmadi",
      );
      await expect(
        page.getByRole("button", { name: listenName, exact: true }),
      ).toHaveAttribute("aria-pressed", "false");
      expect(
        await page.evaluate(() => window.__speechMock.utterances.length),
      ).toBe(1);
      await page
        .getByRole("button", { name: "Ovoz xabarini yopish", exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveCount(0);
    });
  }

  test("late cancellation end and error callbacks cannot stop a new utterance", async ({
    page,
  }) => {
    await mockSpeech(page, { cancelCallbacks: "late" });
    await page.goto("/read/oy-dosti");
    await page.getByRole("button", { name: listenName, exact: true }).click();
    await page.getByRole("button", { name: stopName, exact: true }).click();
    await expect(
      page.getByRole("button", { name: listenName, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: listenName, exact: true }).click();
    await page.evaluate(() => window.__speechMock.flushCancellation());
    await expect(
      page.getByRole("button", { name: stopName, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status")).toHaveCount(0);
    expect(
      await page.evaluate(() => ({
        spoken: window.__speechMock.utterances.length,
        cancelled: window.__speechMock.cancelled.length,
      })),
    ).toEqual({ spoken: 2, cancelled: 1 });
    await page.evaluate(() => window.__speechMock.emit(1, "end"));
    await expect(
      page.getByRole("button", { name: listenName, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("button and keyboard turns cancel narration, disable it while turning, and finish cancels it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await mockSpeech(page, { cancelCallbacks: "immediate" });
    await page.goto("/read/oy-dosti");
    await page.getByRole("button", { name: listenName, exact: true }).click();
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    const progress = page.getByRole("progressbar", { name: /o‘qish jarayoni/ });
    for (const [index, input] of ["button", "keyboard"].entries()) {
      if (input === "button")
        await page
          .getByRole("button", { name: "Keyingi", exact: true })
          .click();
      else await page.keyboard.press("ArrowRight");
      const listen = page.getByRole("button", {
        name: listenName,
        exact: true,
      });
      await expect(listen).toBeDisabled();
      await expect(listen).toHaveAttribute("aria-pressed", "false");
      expect(
        await page.evaluate(() => window.__speechMock.cancelled.length),
      ).toBe(index + 1);
      await page.clock.runFor(1000);
      await expect(progress).toHaveAttribute(
        "aria-valuenow",
        String(index + 2),
      );
      await expect(listen).toBeEnabled();
      await expect(page.getByRole("status")).toHaveCount(0);
      await listen.click();
      expect(
        await page.evaluate(() => window.__speechMock.utterances.at(-1)?.text),
      ).toBe(await page.locator('[class*="prose"] p').first().textContent());
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (let position = 4; position <= 8; position++) {
      await page.getByRole("button", { name: "Keyingi", exact: true }).click();
      await expect(progress).toHaveAttribute("aria-valuenow", String(position));
    }
    await page.getByRole("button", { name: listenName, exact: true }).click();
    const beforeFinish = await page.evaluate(
      () => window.__speechMock.cancelled.length,
    );
    await finishReader(page);
    expect(
      await page.evaluate(() => window.__speechMock.cancelled.length),
    ).toBe(beforeFinish + 1);
    await expect(
      page.getByRole("button", { name: stopName, exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  for (const width of [390, 1440]) {
    test(`dragging cancels narration and keeps listening disabled until settlement at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await mockSpeech(page, { cancelCallbacks: "immediate" });
      await page.goto("/read/oy-dosti");
      await page.getByRole("button", { name: listenName, exact: true }).click();
      const box = (await page
        .locator('[class*="book"][data-size]')
        .boundingBox())!;
      const leafWidth = box.width / (width < 720 ? 1 : 2);
      const x = box.x + box.width - 40;
      const y = box.y + box.height * 0.7;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x - leafWidth * 0.46, y, { steps: 12 });
      const listen = page.getByRole("button", {
        name: listenName,
        exact: true,
      });
      await expect(listen).toBeDisabled();
      await expect(listen).toHaveAttribute("aria-pressed", "false");
      expect(
        await page.evaluate(() => window.__speechMock.cancelled.length),
      ).toBe(1);
      await expect(page.getByRole("status")).toHaveCount(0);
      await page.mouse.up();
      await expect(
        page.getByRole("progressbar", { name: /o‘qish jarayoni/ }),
      ).toHaveAttribute("aria-valuenow", "2");
      await expect(listen).toBeEnabled();
      await listen.click();
      await expect(
        page.getByRole("button", { name: stopName, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        await page.evaluate(() => window.__speechMock.utterances[1].text),
      ).toBe(await page.locator('[class*="prose"] p').first().textContent());
    });
  }

  test("settings describe narration rather than music and limit text size to this reading", async ({
    page,
  }) => {
    await mockSpeech(page);
    await page.goto("/read/oy-dosti");
    await page
      .getByRole("button", { name: "Matn va muhit sozlamalari" })
      .click();
    const dialog = page.getByRole("dialog", { name: "O‘qish sozlamalari" });
    const note = dialog.locator('[class*="note"]');
    await expect(note).toContainText(
      "«Tinglash» matnni ovozli o‘qiydi, musiqa qo‘ymaydi",
    );
    await expect(note).toContainText("o‘zbekcha ovoz bo‘lishi kerak");
    await expect(note).toContainText(
      "Matn o‘lchami shu o‘qish davomida amal qiladi",
    );
    await expect(note).not.toContainText(
      /saqlan|keyingi safar|doimiy|eslab qol/i,
    );
    await dialog
      .getByRole("button", { name: "Juda katta", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Yopish", exact: true }).click();
    await expect(page.locator('[class*="book"][data-size]')).toHaveAttribute(
      "data-size",
      "2",
    );
    await page.reload();
    await expect(page.locator('[class*="book"][data-size]')).toHaveAttribute(
      "data-size",
      "0",
    );
    expect(
      await page.evaluate(() => window.__speechMock.utterances.length),
    ).toBe(0);
  });
});
