import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = path.resolve("./test-results/screenshots");
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runVerification() {
  console.log("Starting End-to-End Visual & Functional Verification...");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results = {
    desktop: { errors: [], overflows: [] },
    mobile: { errors: [], overflows: [] },
  };

  try {
    // ==========================================
    // 1. DESKTOP VIEWPORT (1440x900)
    // ==========================================
    console.log("\n--- Testing Desktop Viewport (1440x900) ---");
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const desktopPage = await desktopContext.newPage();

    desktopPage.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`[Desktop Console Error]: ${msg.text()}`);
        results.desktop.errors.push(msg.text());
      }
    });

    desktopPage.on("response", (res) => {
      if (res.status() >= 400) {
        console.warn(`[Desktop Response ${res.status()}]: ${res.url()}`);
      }
    });

    desktopPage.on("pageerror", (err) => {
      console.error(`[Desktop Page Error]: ${err.message}`);
      results.desktop.errors.push(err.message);
    });

    // Clear local storage for fresh first visit
    await desktopPage.goto("http://localhost:5173/");
    await desktopPage.evaluate(() => localStorage.clear());
    await desktopPage.reload();
    await desktopPage.waitForTimeout(1000);

    // Flow A: Onboarding Step 1
    console.log("Checking Desktop Onboarding Step 1...");
    await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-01-onboarding-step1.png` });
    const nameInput = desktopPage.locator("#onboarding-child-name");
    if (await nameInput.isVisible()) {
      await nameInput.fill("Ali");
      // Choose an avatar inside the dialog
      const avatarOptions = desktopPage.locator("div[role='dialog'] [class*='avatarOption']");
      if (await avatarOptions.count() > 1) {
        await avatarOptions.nth(1).click();
      }
      // Click Davom etish inside the dialog
      await desktopPage.locator("div[role='dialog'] button[type='submit']").click();
      await desktopPage.waitForTimeout(600);

      // Onboarding Step 2
      console.log("Checking Desktop Onboarding Step 2...");
      await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-02-onboarding-step2.png` });
      const skipBtn = desktopPage.locator("div[role='dialog'] button:has-text('Keyinroq')");
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
        await desktopPage.waitForTimeout(800);
      }
    }

    // Check Library Page
    console.log("Checking Desktop Library Page...");
    await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-03-library.png` });
    
    // Check horizontal overflow
    const desktopOverflow = await desktopPage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    if (desktopOverflow) results.desktop.overflows.push("Library page has horizontal overflow");

    // Check Topic Filter Pills
    const dostlikPill = desktopPage.locator("button:has-text('Do‘stlik')");
    if (await dostlikPill.isVisible()) {
      await dostlikPill.click();
      await desktopPage.waitForTimeout(400);
      await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-04-library-filtered.png` });
      // Reset to all
      await desktopPage.locator("button:has-text('Barchasi')").first().click();
      await desktopPage.waitForTimeout(400);
    }

    // Check Profile Switcher Modal ("Kim o'qiydi?")
    console.log("Checking Desktop 'Kim o‘qiydi?' modal...");
    const profilePill = desktopPage.locator("button:has-text('Profilni almashtirish')");
    if (await profilePill.isVisible()) {
      await profilePill.click();
      await desktopPage.waitForTimeout(500);
      await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-05-profile-switcher.png` });

      // Add a sibling
      const addSiblingBtn = desktopPage.locator("div[role='dialog'] button:has-text('Yangi kitobxon')");
      if (await addSiblingBtn.isVisible()) {
        await addSiblingBtn.click();
        await desktopPage.waitForTimeout(400);
        await desktopPage.locator("#switcher-child-name").fill("Zaynab");
        await desktopPage.locator("div[role='dialog'] button:has-text('Qo‘shish')").click();
        await desktopPage.waitForTimeout(500);
        await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-06-profile-added.png` });
      }

      // Close modal
      const closeBtn = desktopPage.locator("div[role='dialog'] button[aria-label='Yopish']");
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Check Parental Gate
    console.log("Checking Desktop Parental Gate...");
    const parentLink = desktopPage.locator("button:has-text('Ota-onalar paneli'), a:has-text('Ota-onalar paneli')").first();
    if (await parentLink.isVisible()) {
      await parentLink.click();
      await desktopPage.waitForTimeout(600);
      await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-07-parental-gate.png` });

      // If Math Gate is shown, solve it
      const mathQuestion = desktopPage.locator("[class*='mathQuestion']");
      if (await mathQuestion.isVisible()) {
        const text = await mathQuestion.innerText();
        const match = text.match(/(\d+)\s*×\s*(\d+)/);
        if (match) {
          const expected = String(Number(match[1]) * Number(match[2]));
          for (const char of expected) {
            await desktopPage.locator(`button:text-is('${char}')`).click();
            await desktopPage.waitForTimeout(100);
          }
          await desktopPage.waitForTimeout(800);
        }
      }

      // Check Parent Dashboard
      console.log("Checking Desktop Parent Dashboard...");
      await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-08-parent-dashboard.png` });

      // Check tabs: Videolar, Hisob va PIN
      const videosTab = desktopPage.locator("a:has-text('Videolar')");
      if (await videosTab.isVisible()) {
        await videosTab.click();
        await desktopPage.waitForTimeout(600);
        await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-09-parent-videos.png` });
      }

      const accountTab = desktopPage.locator("a:has-text('Hisob va PIN')");
      if (await accountTab.isVisible()) {
        await accountTab.click();
        await desktopPage.waitForTimeout(600);
        await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-10-parent-account.png` });
      }

      // Return to library
      const returnBtn = desktopPage.locator("a:has-text('Kutubxonaga qaytish')");
      if (await returnBtn.isVisible()) {
        await returnBtn.click();
        await desktopPage.waitForTimeout(600);
      }
    }

    // Check Reader Page Spread
    console.log("Checking Desktop Reader Spread...");
    await desktopPage.goto("http://localhost:5173/read/ayiqchaning-yulduzi");
    await desktopPage.waitForTimeout(1000);
    await desktopPage.screenshot({ path: `${ARTIFACT_DIR}/desktop-11-reader-spread.png` });

    await desktopContext.close();

    // ==========================================
    // 2. MOBILE VIEWPORT (390x844)
    // ==========================================
    console.log("\n--- Testing Mobile Viewport (390x844 - iPhone 14/15 size) ---");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    mobilePage.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`[Mobile Console Error]: ${msg.text()}`);
        results.mobile.errors.push(msg.text());
      }
    });

    mobilePage.on("pageerror", (err) => {
      console.error(`[Mobile Page Error]: ${err.message}`);
      results.mobile.errors.push(err.message);
    });

    await mobilePage.goto("http://localhost:5173/");
    await mobilePage.waitForTimeout(1000);

    // Mobile Flow A: Onboarding if visible
    const mobileNameInput = mobilePage.locator("#onboarding-child-name");
    if (await mobileNameInput.isVisible()) {
      console.log("Checking Mobile Onboarding Step 1...");
      await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/mobile-00-onboarding-step1.png` });
      await mobileNameInput.fill("Jasur");
      const mobileAvatarOptions = mobilePage.locator("div[role='dialog'] [class*='avatarOption']");
      if (await mobileAvatarOptions.count() > 2) {
        await mobileAvatarOptions.nth(2).click();
      }
      await mobilePage.locator("div[role='dialog'] button[type='submit']").click();
      await mobilePage.waitForTimeout(600);

      console.log("Checking Mobile Onboarding Step 2...");
      await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/mobile-00-onboarding-step2.png` });
      const mobileSkipBtn = mobilePage.locator("div[role='dialog'] button:has-text('Keyinroq')");
      if (await mobileSkipBtn.isVisible()) {
        await mobileSkipBtn.click();
        await mobilePage.waitForTimeout(800);
      }
    }

    // Check Mobile Library
    console.log("Checking Mobile Library View...");
    await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/mobile-01-library.png` });

    // Check horizontal overflow on mobile
    const mobileOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    if (mobileOverflow) results.mobile.overflows.push("Mobile Library page has horizontal overflow");

    // Check Mobile Bottom Navigation Bar
    const mobileBottomBar = mobilePage.locator("nav[class*='bottomNav']");
    const isMobileNavVisible = await mobileBottomBar.isVisible();
    console.log("Mobile bottom bar visible:", isMobileNavVisible);
    if (!isMobileNavVisible) {
      results.mobile.errors.push("Mobile bottom navigation bar is not visible");
    }

    // Check Mobile Profile Switcher
    const mobileProfileBtn = mobilePage.locator("nav[class*='bottomNav'] button:has-text('Almashtirish')");
    if (await mobileProfileBtn.isVisible()) {
      await mobileProfileBtn.click();
      await mobilePage.waitForTimeout(500);
      await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/mobile-02-profile-switcher.png` });
      await mobilePage.locator("button[aria-label='Yopish']").click();
      await mobilePage.waitForTimeout(400);
    }

    // Check Mobile Parental Gate trigger (top-right lock button)
    const mobileLockBtn = mobilePage.locator("a[aria-label='Ota-onalar paneli']");
    if (await mobileLockBtn.isVisible()) {
      await mobileLockBtn.click();
      await mobilePage.waitForTimeout(500);
      await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/mobile-03-parental-gate.png` });

      // Solve math gate if present
      const mathQuestion = mobilePage.locator("[class*='mathQuestion']");
      if (await mathQuestion.isVisible()) {
        const text = await mathQuestion.innerText();
        const match = text.match(/(\d+)\s*×\s*(\d+)/);
        if (match) {
          const expected = String(Number(match[1]) * Number(match[2]));
          for (const char of expected) {
            await mobilePage.locator(`button:text-is('${char}')`).click();
            await mobilePage.waitForTimeout(100);
          }
          await mobilePage.waitForTimeout(800);
        }
      }

      await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/mobile-04-parent-dashboard.png` });
      
      const mobileParentOverflow = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      if (mobileParentOverflow) results.mobile.overflows.push("Mobile Parent page has horizontal overflow");

      // Return to library
      const returnBtn = mobilePage.locator("a:has-text('Kutubxonaga qaytish')");
      if (await returnBtn.isVisible()) {
        await returnBtn.click();
        await mobilePage.waitForTimeout(600);
      }
    }

    // Check Mobile Reader
    console.log("Checking Mobile Reader View...");
    await mobilePage.goto("http://localhost:5173/read/ayiqchaning-yulduzi");
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: `${ARTIFACT_DIR}/mobile-05-reader.png` });

    const mobileReaderOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    if (mobileReaderOverflow) results.mobile.overflows.push("Mobile Reader page has horizontal overflow");

    await mobileContext.close();

    console.log("\n================ VERIFICATION SUMMARY ================");
    console.log(`Desktop console errors: ${results.desktop.errors.length}`);
    console.log(`Desktop overflows: ${results.desktop.overflows.length}`);
    console.log(`Mobile console errors: ${results.mobile.errors.length}`);
    console.log(`Mobile overflows: ${results.mobile.overflows.length}`);
    console.log("Screenshots captured in:", ARTIFACT_DIR);
    console.log("======================================================");

    if (results.desktop.errors.length > 0 || results.desktop.overflows.length > 0 ||
        results.mobile.errors.length > 0 || results.mobile.overflows.length > 0) {
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
