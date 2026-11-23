# Pre-Launch UX, Onboarding & Family Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform IdrokReads into an effortless, friction-free KidTech reading platform with two strictly separated worlds (Child World and Parent World), 10-second local onboarding, multi-child offline support, seamless background auto-merge, parental PIN/math gate, streamlined parent dashboard, polished library & reward flows, and consistent Uzbek tone.

**Architecture:** 
- Maintain local-first child profiles in `localStorage` (`iqro.local_profiles.v1`) allowing siblings to track separate progress without an account.
- Enhance `ProgressContext` to manage local profiles, seamless background auto-merge with server accounts (`/api/session`, `/api/children`, `/api/children/:id/events`), and active reading time tracking.
- Separate Child World (`/`, `/quiz`, `/rewards`) from Parent World (`/parent`, `/parent/videos`, `/parent/account`) guarded by a 4-digit PIN and adult math challenge gate.
- Preserve the existing 2-page book reader spread, story previews, and storybook aesthetic.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7.3, React Router 7, CSS Modules, Lucide React icons, Node 26 + SQLite server.

**Spec:** User Master Prompt "IdrokReads — Pre-Launch UX, Onboarding & Family Architecture Master Prompt"

## Global Constraints
- **Preserve Golden Rule:** Never break or alter the 2-page Book Reader spread (`StoryBook.tsx`), warm lined paper styling, drop-cap typography, or quiz question mechanics.
- **Touch Target Floor:** All interactive elements on mobile/tablet (buttons, avatar cards, filter pills, keypad numbers) must meet `>= 48px` touch target size (`min-height: 48px`, `min-width: 48px`).
- **No YouTube Escape:** YouTube embeds must strictly use `youtube-nocookie.com` with `rel=0&modestbranding=1` in-app; zero external `target="_blank"` links to youtube.com in child views.
- **Strict Tone Separation:** Child screens strictly use warm "sen" (e.g. *o'qisang*, *boshla*, *tanla*); Parent screens strictly use respectful "siz" (e.g. *ulashingiz mumkin*, *kiriting*).
- **Whitespace Protection:** Action button labels and arrow icons must have `whitespace-nowrap` to prevent arrow wrap onto a second line.

## Review Focus
1. First visit in private/incognito window without localStorage displays 2-step onboarding immediately, never "Mehmon kitobxon".
2. Multiple local siblings ("Ali", "Madina") switch via "Kim o'qiydi?" and retain completely separate reading progress, quiz scores, and active reading time without logging in.
3. When a parent signs in (via Google or Email/Password), all local child profiles and quiz attempts auto-merge silently in the background, showing a single warm confirmation toast and zero manual migration UI.
4. Parental Gate blocks child entry with a 4-digit PIN pad or adult multiplication math problem, and re-locks immediately when leaving `/parent`.
5. Completed books with 0 recorded seconds display "—" or "Tugatilgan" instead of "0 soniya" in parent cards and charts.

---

### Task 1: Expanded Avatar System & Local Multi-Child Profile Model

**Files:**
- Modify: `src/design-system/Avatar.tsx`
- Modify: `src/design-system/Avatar.module.css`
- Create: `src/lib/localProfiles.ts`
- Test: `src/lib/localProfiles.test.ts`

**Interfaces:**
- Produces in `src/lib/localProfiles.ts`:
  ```ts
  export type StorybookAvatarId = "sun" | "leaf" | "cloud" | "star" | "moon" | "rabbit" | "cat" | "rocket";
  export interface LocalChildProfile {
    id: string;
    name: string;
    avatarId: StorybookAvatarId;
    ageGroup?: "5-6" | "7-8" | "9-11";
    createdAt: string;
    progress: ProfileProgress;
    activeReadingSeconds: number;
    syncedToParentId?: string;
  }
  export function getLocalProfiles(): LocalChildProfile[];
  export function saveLocalProfiles(profiles: LocalChildProfile[]): void;
  export function getActiveLocalProfileId(): string | null;
  export function setActiveLocalProfileId(id: string): void;
  export function createLocalChildProfile(name: string, avatarId: StorybookAvatarId, ageGroup?: "5-6" | "7-8" | "9-11"): LocalChildProfile;
  export function updateActiveProfileProgress(change: (p: ProfileProgress) => ProfileProgress): ProfileProgress;
  export function addActiveReadingSeconds(seconds: number): void;
  ```

- [ ] **Step 1: Write failing tests for local profile CRUD and multi-child isolation**
  In `src/lib/localProfiles.test.ts`, test profile creation, switching active profile, updating individual progress, and reading time tracking without cross-contamination.
- [ ] **Step 2: Run test to verify failure**
  Run: `npm test` -> Expected: FAIL on missing `src/lib/localProfiles.ts`.
- [ ] **Step 3: Implement `src/lib/localProfiles.ts` and update `src/design-system/Avatar.tsx`**
  Support 8 avatars (`sun`, `leaf`, `cloud`, `star`, `moon`, `rabbit`, `cat`, `rocket`) with Lucide icons (`Sun`, `Leaf`, `Cloud`, `Sparkles`, `Moon`, `Rabbit`, `Cat`, `Rocket`) matching storybook styling.
- [ ] **Step 4: Run test to verify pass**
  Run: `npm test` -> Expected: PASS.
- [ ] **Step 5: Commit**
  `git add src/design-system/Avatar* src/lib/localProfiles* && git commit -m "feat: add 8 storybook avatars and local multi-child profile storage"`

---

### Task 2: Seamless Background Auto-Merge Engine & Context Refactoring

**Files:**
- Modify: `src/lib/context.tsx`
- Create: `src/lib/autoMerge.ts`
- Test: `src/lib/autoMerge.test.ts`
- Modify: `src/features/account/AccountPage.tsx` (remove manual transfer card & developer status banner)

**Interfaces:**
- Produces in `src/lib/autoMerge.ts`:
  ```ts
  export interface MergeResult {
    mergedProfilesCount: number;
    activeChildName: string;
    toastMessage: string | null;
  }
  export async function executeBackgroundAutoMerge(
    user: ParentAccount,
    apiClient: typeof api
  ): Promise<MergeResult>;
  ```
- Consumes: `getLocalProfiles`, `saveLocalProfiles`, `api.session`, `api.createChild`, `api.events`, `api.progress`.

- [ ] **Step 1: Write unit tests for the Auto-Merge Algorithm**
  In `src/lib/autoMerge.test.ts`, test:
  1. Case 1 (Placeholder replacement): Default "Kitobxon" profile renamed to local child's name ("Ali") with merged progress.
  2. Case 2 (Name match): Server profile matching "Ali" merges completed status, max page, and preserves ALL quiz attempts.
  3. Case 3 (New sibling): New local sibling "Madina" automatically created on server and synced.
  4. Idempotency: Running merge twice does not duplicate profiles or reset data.
- [ ] **Step 2: Run test to verify failure**
  Run: `npm test` -> Expected: FAIL.
- [ ] **Step 3: Implement `src/lib/autoMerge.ts` and integrate into `ProgressContext`**
  - Execute automatically upon `login`, `register`, `googleLogin`, and session load when unsynced local profiles exist.
  - Delete completely: Remove manual "Mahalliy natijalarni ko'chirish" section, "Profilga qo'shish" button, and "Viktorina natijalari ko'chirilmaydi" limitations.
  - Expose `toastMessage` for warm celebration: `"[Ali]ning natijalari oilangiz hisobiga saqlandi ✓"`.
- [ ] **Step 4: Run test to verify pass**
  Run: `npm test` -> Expected: PASS.
- [ ] **Step 5: Commit**
  `git add src/lib/autoMerge* src/lib/context.tsx src/features/account/AccountPage.tsx && git commit -m "feat: implement background auto-merge and remove manual data transfer"`

---

### Task 3: 10-Second Child Onboarding Modal & Soft Aha-Moment Prompt

**Files:**
- Create: `src/features/onboarding/OnboardingModal.tsx`
- Create: `src/features/onboarding/OnboardingModal.module.css`
- Create: `src/features/onboarding/AhaMomentBanner.tsx`
- Create: `src/features/onboarding/AhaMomentBanner.module.css`
- Modify: `src/app/RequireProfile.tsx`
- Modify: `src/app/layouts/ChildLayout.tsx`

**Interfaces:**
- Produces: `<OnboardingModal isOpen={boolean} onComplete={() => void} />`
- Produces: `<AhaMomentBanner childName={string} onConnect={() => void} onDismiss={() => void} />`

- [ ] **Step 1: Write component tests / flow assertions**
  Verify that when no profiles exist, `RequireProfile` triggers `OnboardingModal`.
- [ ] **Step 2: Implement `OnboardingModal.tsx`**
  - Step 1: "Salom! Tanishib olaylik" — "Isming nima?" (2-20 chars), 8 storybook avatars with first selected by default, age pills (5-6, 7-8, 9-11 yosh), "Davom etish →".
  - Step 2: "Ota-ona uchun — ixtiyoriy" — calm 1-sentence value prop, Google / Email connect buttons, "Keyinroq (O'qishni boshlash)" skip action.
  - Clean UI without dead messages or broken dividers.
- [ ] **Step 3: Implement `AhaMomentBanner.tsx`**
  - Appears gently after completing 1st story if parent is not connected.
  - Dismissible with warm copy: `"Ajoyib! [Ism]ning natijalari yo'qolib ketmasligi uchun ota-ona hisobini ulang."`.
- [ ] **Step 4: Verify modal & banner rendering**
  Run typecheck and dev server test.
- [ ] **Step 5: Commit**
  `git add src/features/onboarding/ src/app/RequireProfile.tsx src/app/layouts/ChildLayout.tsx && git commit -m "feat: add 2-step child onboarding flow and post-story aha moment banner"`

---

### Task 4: Child Sidebar Cleanliness & "Kim o'qiydi?" Profile Switcher

**Files:**
- Modify: `src/app/layouts/ChildLayout.tsx`
- Modify: `src/app/layouts/ChildLayout.module.css`
- Create: `src/features/profile/ProfileSwitcherModal.tsx`
- Create: `src/features/profile/ProfileSwitcherModal.module.css`

**Interfaces:**
- Sidebar exact items:
  1. `Kutubxona` (/)
  2. `Savol-javob` (/quiz)
  3. `Yutuqlarim` (/rewards)
  - Bottom: `Muhit: [Nomi]`, `Ota-onalar paneli` (shield icon -> Parental Gate), Active Child Profile Pill (`Avatar + Ism` -> `ProfileSwitcherModal`).
  - Mobile bottom tab bar (< 768px): Kutubxona, Savol-javob, Yutuqlarim, Profil + top-right lock button for parents.
- `ProfileSwitcherModal`:
  - Large tappable avatar cards for each child profile + `+ Yangi kitobxon` button.
  - Zero parent emails, zero log out buttons, zero technical text.

- [ ] **Step 1: Write test for child sidebar and profile switcher**
  Ensure Akkaunt is eliminated from child nav, and `ProfileSwitcherModal` lists all local and server child profiles.
- [ ] **Step 2: Implement `ProfileSwitcherModal.tsx`**
  Netflix Kids style cards with avatars, child names, active checkmark, and quick "+ Yangi kitobxon" creation.
- [ ] **Step 3: Refactor `ChildLayout.tsx` and `ChildLayout.module.css`**
  - Remove Akkaunt link from nav.
  - Wire Active Child Profile pill to `ProfileSwitcherModal`.
  - Wire Ota-onalar paneli to Parental Gate.
  - Optimize mobile navigation (< 768px) with bottom bar and top-right parent lock.
- [ ] **Step 4: Verify visually and structurally**
  Run: `npm run typecheck && npm test`.
- [ ] **Step 5: Commit**
  `git add src/app/layouts/ChildLayout* src/features/profile/ && git commit -m "feat: clean child sidebar and add playful Netflix-Kids profile switcher"`

---

### Task 5: Mandatory Parental Gate (4-Digit PIN Modal + Tactile Keypad + Adult Math Fallback)

**Files:**
- Create: `src/features/parent/ParentalGateModal.tsx`
- Create: `src/features/parent/ParentalGateModal.module.css`
- Modify: `src/features/parent/ParentGate.tsx`
- Modify: `src/features/parent/ParentLayout.tsx`
- Modify: `src/lib/api.ts` & `src/lib/context.tsx`

**Interfaces:**
- Produces: `<ParentalGateModal isOpen={boolean} onClose={() => void} onSuccess={() => void} />`
- Keypad: 3x4 numeric keypad (1-9, backspace, 0) with `>= 56px` tactile buttons.
- State: Auto-verifies on 4th digit. If PIN set: checks PIN. If no PIN set: generates random adult multiplication (e.g. `7 × 8 = 56`).
- Session lock: Re-locks immediately upon clicking `← Kutubxonaga qaytish`.

- [ ] **Step 1: Write test for Parental Gate PIN and Math challenge**
  Test math problem generation, verification, PIN entry, shake error on mismatch, and session lock persistence.
- [ ] **Step 2: Implement `ParentalGateModal.tsx` with tactile 3x4 keypad**
  Circular PIN dots, large responsive numbers, auto-submission, shake animation, and adult multiplication fallback when no PIN is set.
- [ ] **Step 3: Integrate with `ParentGate.tsx` and `ParentLayout.tsx`**
  Re-lock immediately when clicking `← Kutubxonaga qaytish` and protect all parent routes.
- [ ] **Step 4: Verify test suite**
  Run: `npm test`.
- [ ] **Step 5: Commit**
  `git add src/features/parent/ParentalGateModal* src/features/parent/ParentGate* src/features/parent/ParentLayout* && git commit -m "feat: implement 4-digit PIN pad and adult math parental gate"`

---

### Task 6: Parent Dashboard Redesign (Zero-Stress, 3 Tabs, Human-Readable Stats)

**Files:**
- Modify: `src/features/parent/ParentLayout.tsx`
- Modify: `src/features/parent/ParentDashboard.tsx`
- Modify: `src/features/parent/ParentDashboard.module.css`
- Create: `src/features/parent/ParentSettingsTab.tsx`
- Create: `src/features/parent/ParentSettingsTab.module.css`

**Interfaces:**
- Exact 3 Tabs:
  1. `Farzandlarim` (/parent) - per-child reading progress, warm 1-line summary, 3 clean metric cards, 7-day chart (Dsh-Yak).
  2. `Videolar` (/parent/videos) - reward video per story.
  3. `Hisob va PIN` (/parent/account) - account linking, PIN creation/change, manage child profiles, logout.
- Removed completely:
  - Duplicate buttons (`Videolar`, `Farzandlar va sozlamalar`).
  - Duplicate stat cards.
  - Manual `Yangilash` button (auto-fetch on entry).
  - All developer/sync jargon (`daq = daqiqa · s = soniya`, background sync caveats).
- Fixed:
  - `0 soniya` bug: Display "—" or "Tugatilgan" if book is 100% completed without recorded seconds.

- [ ] **Step 1: Write unit tests for parent dashboard metrics formatting**
  Verify duration formatting, 0-second fallback to "Tugatilgan" or "—", and 7-day chart day labels.
- [ ] **Step 2: Implement `ParentSettingsTab.tsx` (Hisob va PIN)**
  Combine account connection, PIN setup/hash, child profile additions/renaming, and logout in one calm tab.
- [ ] **Step 3: Refactor `ParentDashboard.tsx` and `ParentLayout.tsx`**
  Clean up tabs, child selector pills at top of Farzandlarim, warm 1-line summary, 3 metric cards, and clean 7-day activity chart without legend clutter.
- [ ] **Step 4: Run test suite**
  Run: `npm test && npm run typecheck`.
- [ ] **Step 5: Commit**
  `git add src/features/parent/ && git commit -m "feat: redesign parent dashboard to 3 clean tabs with human-readable stats"`

---

### Task 7: Library & Reward Screen (Barakalla!) Polish & YouTube In-App Player

**Files:**
- Modify: `src/features/library/LibraryPage.tsx`
- Modify: `src/features/library/LibraryPage.module.css`
- Modify: `src/features/reader/ReaderPage.tsx`
- Modify: `src/features/reader/StoryVideoSection.tsx`
- Modify: `src/features/reader/StoryVideoSection.module.css`

**Interfaces:**
- Library:
  - Hero header: `"Salom, [Ism]! Bugun qaysi olamga sayohat qilamiz?"`
  - Topic Filter Pills when catalog < 10 stories: `Barchasi`, `Do'stlik`, `Sarguzasht`, `Tabiat` + `Boshlangan`, `Tugatilgan`.
  - Story Cards: Action pill `O'qish →` (or `Davom ettirish →`, `Yana o'qish`).
- Reward Screen:
  - Delete `YouTube'da ochish` external link.
  - Delete developer disclaimer `"Bu hikoyaning aynan o'zi emas: ota-onang uni almashtirishi mumkin."`.
  - In-app video player modal with `youtube-nocookie.com/embed/...&rel=0&modestbranding=1`.
  - Action hierarchy: Primary CTA `Savol-javobni yechish` or `Keyingi hikoya`, secondary `Kutubxonaga` and `Yana o'qish`.

- [ ] **Step 1: Write tests for library filters and video embed security**
  Ensure no external youtube.com links are emitted and topic filters filter stories by category.
- [ ] **Step 2: Update `LibraryPage.tsx`**
  Implement personalized greeting, topic filter pills, and action pills on story cards.
- [ ] **Step 3: Update `StoryVideoSection.tsx` and `ReaderPage.tsx`**
  Remove YouTube external link and developer disclaimers; strictly confine playback in-app.
- [ ] **Step 4: Run test suite**
  Run: `npm test`.
- [ ] **Step 5: Commit**
  `git add src/features/library/ src/features/reader/ && git commit -m "feat: polish library filters, card action pills, and lock reward video strictly in-app"`

---

### Task 8: UI Bug Fixes, Uzbek Tone Audit & Viewport Verification

**Files:**
- Modify: Button and Link styles across `src/design-system/Button.module.css`, `src/features/auth/AuthCard.module.css`
- Audit and Modify: All Child Screens (warm "sen") and Parent Screens (polite "siz")
- Modify: `src/styles/global.css` (ensure touch targets >= 48px on mobile)

- [ ] **Step 1: Fix button arrow wrapping**
  Add `inline-flex items-center justify-center gap-2 whitespace-nowrap` to prevent `→` from dropping to a second line.
- [ ] **Step 2: Strict Uzbek Tone Audit**
  Review all strings:
  - Child screens (`Kutubxona`, `StoryPage`, `ReaderPage`, `Barakalla!`, `QuizPage`, `RewardsPage`, Onboarding Step 1, `Kim o'qiydi?`): Warm "sen" (`o'qisang`, `tanla`, `boshla`).
  - Parent screens (Onboarding Step 2, Parental Gate, Parent Dashboard): Respectful "siz" (`kiriting`, `ulashingiz mumkin`).
- [ ] **Step 3: Verify Desktop (`1440×900`) and Mobile (`390×844`)**
  Ensure zero horizontal scrolling, >= 48px touch targets, zero console errors.
- [ ] **Step 4: Run full test and typecheck suite**
  Run: `npm test && npm run typecheck`.
- [ ] **Step 5: Commit**
  `git add . && git commit -m "fix: button wrapping, strict Uzbek tone consistency, and mobile touch targets"`

---

### Task 9: Final Code Review Pass & Verification

- [ ] **Step 1: Run complete automated test suite**
  `npm test && npm run typecheck`
- [ ] **Step 2: Verify all items on the Master Prompt Mandatory Verification Checklist**
- [ ] **Step 3: Final Git status and commit hygiene**
