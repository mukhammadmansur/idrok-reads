# IdrokReads — Startup yo'l xaritasi (P0 → P6)

**Sana:** 2026-11-26 · **Branch:** `main` · **Upstream:** `mansur/main` · **Boshqa remote:** `origin` (mukhammadmaqsud/iqro_kids_reads)

> Ushbu hujjat ko'p fazali rejaning yagona manbasi. Har bir faza tugagach
> holat, topshirilgan fayllar va testlar shu yerda yangilanadi. Keyingi
> sessiyani davom ettirish uchun "Keyingi aniq qadamlar" bo'limidan
> boshlang.

## Status matritsasi

| Faza | Nomi | Holat | Test |
|------|------|-------|------|
| P0 | Frontend (React/TS/Vite) | ✅ Tugadi | vitest 33/33 · tsc · vite build · Playwright spec files |
| P1 | Django backend (Node o'rniga) | ✅ Tugadi | manage.py test 16/16 · `django/db.sqlite3` WAL+IMMEDIATE |
| P2 | Django Admin + kontent boshqaruvi | ✅ **Shu sessiyada tugadi** | import/export round-trip · 3 ta yangi GET endpoint |
| P3 | Monitoring + rule-based tavsiyalar | ⏳ **Keyingi qadam** | — |
| P4 | Obuna + do'kon (Payme/Click) | ⏳ Kutilmoqda | Narxlar tayyor, checkout yo'q |
| P5 | AI murabbiy (obunaga bog'liq) | ⏳ Kutilmoqda | — |
| P6 | Webhook / bildirishnoma / admin grafiklar | ⏳ Kutilmoqda | — |

## Doimiy kelishuvlar (user grant)

- **Avtoritet:** "Ishni amalga oshirib ketaver... tanlovlarda menga savollaring bo'lsa recommended ni avtomatik tanlab ketaver... testlarni avtomatik o'zing o'tkazaver."
- **Commit/push:** Faqat foydalanuvchi aniq so'raganda.
- **Testlar haqiqiy DB ga tegmasin:** `django/db.sqlite3` — real dev; testlar `WBOOKS_DB_PATH=":memory:"`.
- **Windows console:** cp1252 — stdout'ga UTF-8 (✓, ', —) bosmang. Fayllar UTF-8 normal.

---

## P0 — Frontend (TUGADI)

**Stack:** React 19, TypeScript, Vite 7, react-router-dom v7, CSS Modules.

**Kalit fayllar:**
- `src/app/` — `RootLayout.tsx`, `router.tsx`, `RequireProfile.tsx`
- `src/content/` — `library.json` (kontent manbai), `stories.ts` (bundled), `themes.ts`, `types.ts`
- `src/design-system/` — `Avatar.tsx`, `Button.tsx`, `ProgressBar.tsx`, `IconButton.tsx`, `PageIntro.tsx`
- `src/features/`: `home/HomePage.tsx`, `library/LibraryPage.tsx`, `reader/` (ReaderPage + StoryBook), `story/StoryPage`, `quiz/`, `rewards/RewardsPage`, `theme/` (ThemeSheet, ThemeGlyph, WorldStage, WorldCritter), `profile/` (MyProfilePage, ProfileSwitcherModal), `parent/` (ParentDashboard + 4 ta tab: Children/News/Shop/Settings), `onboarding/`, `account/`
- `src/lib/` — `api.ts` (fetch wrapper), `context.tsx` (progress reducer + outbox), `localProfiles.ts`, `autoMerge.ts`, `outbox.ts`, `progress.ts`, `youtube.ts`
- `src/styles/` — `tokens.css` (6 theme), `global.css`

**Testlar:** `npx vitest run` → **33/33**.
**Build:** `npx tsc -b && npx vite build` → **OK** (chunk warning optional).
**Playwright:** `tests/*.spec.ts` (accounts / navigation / themes) — yozilgan, `npx playwright test` hali ishga tushirilmagan.

## P1 — Django backend (TUGADI)

**Stack:** Django 6.x, Python 3.14, SQLite WAL+IMMEDIATE.

**Layout:**
```
django/
├── manage.py
├── requirements.txt
├── db.sqlite3                 # local, gitignore'd
├── idrok/                     # settings, urls, wsgi/asgi
│   ├── settings.py            # SQLITE + WAL; CLOCK, WBOOKS_DB_PATH env
│   ├── urls.py                # /api catch-all + /admin
└── core/
    ├── models.py              # User, Child, Session, Reading, Quiz, Event, Rate, StoryVideo, Identity, GoogleChallenge, ActivityDaily/Stream/Log + content models (Story, StoryPage, Question, News, Guide, SubscriptionPlan)
    ├── service.py             # Store: auth, session, children, events, videos
    ├── family.py              # Family: parent gate, activity, google, family_summary
    ├── google.py              # JWKS verifier
    ├── catalog.py             # library.json → grading facts
    ├── content.py             # import_library / export_library
    ├── helpers.py             # ApiError, hashing, regex, theme normalization
    ├── views.py               # API catch-all dispatcher
    ├── admin.py               # Story/StoryPage/Question/News/Guide/Plan registered
    └── tests.py               # 16 ta API testi (Node 18 testdan port)
```

**Test:** `cd django && WBOOKS_DB_PATH=":memory:" ./.venv/Scripts/python.exe manage.py test` → **16/16**.

## P2 — Admin + kontent boshqaruvi (BU SESSIYADA TUGADI)

**Yangi:**
- `django/core/migrations/0002_*.py` — Story/StoryPage/Question/News/Guide/SubscriptionPlan jadvallari.
- `django/core/migrations/0003_*.py` — `SubscriptionPlan.max_children` + `Theme` choice-lar (`kitty`, `ghost`).
- `django/core/content.py` — `import_library()` (file→DB) · `export_library()` (DB→file) · bo'sh DB'ga export qilishdan himoya.
- `django/core/management/commands/{import_library,export_library,seed_plans,import_nodedb}.py`
- `django/core/admin.py` — StoryAdmin (inline StoryPage + Question), News/Guide/Plan/Question.
- `django/core/views.py` — 3 ta GET endpoint: `/api/pricing`, `/api/news`, `/api/guides`.
- Frontend: `src/lib/api.ts` — `pricing()`, `news()`, `guides()` metodlari va TypeScript tiplari.
- Frontend: `ParentShopTab.tsx` `/api/pricing` dan real tariflarni chizadi (`childrenTag` chip: "1 farzand" / "Cheksiz farzand").
- Frontend: `ParentNewsTab.tsx` `/api/news` va `/api/guides` dan real yangiliklar + maslahatlarni chizadi; bo'sh bo'lsa "hozircha yangilik yo'q".

**Tariflar (DB'da seeded, `/api/pricing` orqali chiqadi):**

| Slug | Nomi | Narx | `maxChildren` | Featured |
|------|------|------|---------------|----------|
| `oilaviy` | Oilaviy | 33 000 so'm/oy | **1** (bitta farzand) | false |
| `premium-oila` | Premium oila | 119 000 so'm/oy | **null** (cheksiz) | true |

**Dev superuser:** `/admin` uchun — login `admin`, parol `idrokadmin123` (dev-only).
**Smoke-test natijalari (test client, DB ifloslanmagan):**
- `/api/pricing` → 200, 2 ta tarif.
- `/api/news` → 200, `news: []` (admin'dan qo'shiladi).
- `/api/guides` → 200, `guides: {}`.

**Round-trip tekshiruvi:** `import_library` → 6 story / 42 page / 21 question → `export_library` → strukturaviy jihatdan bir xil, `stories equal: True`, `generalQuiz equal: True`.

## UI/kontent yangilanishlari (P2 bilan birga tugadi)

- **Yangi kitoblar (6 ta, har kategoriyada kamida bitta, rasmlar bilan):**
  - `oy-dosti` (Ertak), `bulut-kemasi` (Ertak), `dengiz-siri` (Ilmiy), `amir-temur` (Tarixiy), `kitty-bogi` (Premium), `qaroqchi-siri` (Premium).
  - Yangi premium/tarixiy mini-kitoblar: 6 bet, 3 savol, video yo'q.
  - Rasm fayllari: `public/art/picture-{kitty,pirate,temur}-*.webp`, `public/art/worlds/cover-*.jpg`, `public/art/avatars/*.jpg`.
- **Kategoriyalar (4 ta):** ertak / ilmiy / tarixiy / premium.
  - `LibraryPage.tsx` — `CATEGORY_META` (5 chips, "Barchasi" + 4 kategoriya), `theme_{fairy,science,history,premium}` CSS.
  - `HomePage.tsx` — `CATEGORY_ICONS` va `<CategoryIcon icon>` yordamchisi.
- **2 ta "wow" pullik mavzu:**
  - **kitty** (pushti, qizlar uchun) — `--bg #fff0f6`, `--accent #d63384`, `Cat` glyph, `mascot-kitty.jpg`, `kitty-garden.jpg`, pink sparkles.
  - **ghost** (to'q, qo'rqinchli-arvoh, o'g'il bolalar uchun) — `--bg #05070d`, `--accent #34d399`, `Ghost` glyph, `mascot-ghost.jpg`, `ghost-sea.jpg`, `.fog` animatsiyasi, shooting-star o'chirilgan.
  - To'liq tegish fayllar: `src/content/{types.ts,themes.ts}`, `src/features/theme/{ThemeGlyph,WorldCritter,WorldStage}.{tsx,css}`, `src/styles/{tokens,global}.css`, `ChildLayout.module.css`, `django/core/{models,helpers}.py`, migration `0003_*`.
- **"Muhit va oila" qayta tashkil qilindi:**
  - Yon panel / mobile header'dagi profil pill → `/profile` (MyProfilePage).
  - `MyProfilePage` ichida "Kim o'qiydi?" bo'limi — profil almashtirish + yangi profil qo'shish (PortalSwitcherModal).
  - `ChildLayout.tsx` dan `ProfileSwitcherModal` olib tashlandi; `parentAction` (ota-ona paneli) — `--muted`/`opacity:.85` bilan ko'zga ko'rinmas, lekin topiladigan qilib sozlandi.
- **Tests fix:** `videos.test.ts` (premium kitoblarda video yo'q) va `progress.test.ts` (min page 8→6).

---

## P3 — Monitoring + rule-based tavsiyalar (KEYINGI QADAM)

**Maqsad:** Ota-ona va bola faqat "hisobot" emas, balki **amalga oshiradigan keyingi qadamni** ko'radi. AI yo'q — sof qoidalar (P5 AI'ga asos bo'ladi).

### Dizayn qarorlari (recommended tanlandi)

1. **Yangi API endpoint:** `GET /api/children/<id>/recommendations` — authenticated, `store.owned()`.
2. **Yangi module:** `django/core/recommend.py` — sof funksiya, DB'siz test qilinadi.
3. **Monitoring = yangilangan `family_summary` metrics:** `streak` (ketma-ket faol kunlar), `activeDays` (7 kunda), `focusCategory` (eng ko'p o'qilgan kategoriya).
4. **Frontend:**
   - `HomePage.tsx` — "Sizga tavsiya etamiz" shelf'i (3 ta kartochka) `useEffect` orqali `/api/children/<id>/recommendations` dan.
   - `ParentDashboard.tsx` — 3 ta metric card'ga **streak chip** qo'shiladi (🔥 N kun).

### Tavsiya qoidalari (recommend.py, `limit=4`)

Har bir bolaning `reading` (started/completed/page) va `quizzes` (score/total) holati + `story_meta` (category, minutes, price) asosida. Rule → score → sabab (Uzbek):

| # | Rule | Score | Sabab |
|---|------|-------|-------|
| 1 | Boshlangan lekin tugallanmagan | 100 | "Bu kitobni yarim qoldirding — tugatib qo'yaylik!" |
| 2 | Tugatilgan, quiz aniqligi < 60% | 80 | "Savollarda qiyin bo'ldi — yana bir bor o'qib ko'ramiz." |
| 3 | Sevimli kategoriyadagi yangi kitob | 60 + affinity | "Sevimli yo'nalishing '{cat}'dan yangi kitob." |
| 4 | Hash qo'yilmagan kategoriyani ochish | 45 | "Yangi mavzuni kashf etamiz: '{cat}'." |
| 5 | Fallback (qolgan istalgan boshlanmagan) | 20 | "Katta olamdan navbatdagi sayohat." |

Story bo'yicha deduplikat (eng yuqori score), keyin `story.order` bo'yicha barqaror tartib. Premium/pullik P3'da hali gate'lanmaydi (bu P4).

### `story_meta` (catalog.py'ga qo'shiladi)

```python
story_meta = {
    story["id"]: {
        "slug": story["slug"], "title": story["title"],
        "subtitle": story["subtitle"], "category": story["category"],
        "minutes": story["minutes"], "cover": story["cover"],
        "price": int(story.get("price") or 0),
        "ageMin": story["age"][0], "ageMax": story["age"][1],
    }
    for story in library["stories"] if story["status"] == "published"
}
```

### Monitoring (`family_summary` metrics'ga qo'shiladi)

```python
"metrics": {
    ...existing...,
    "streak": <int>,          # bugundan orqaga, active_ms>0 bo'lgan ketma-ket kunlar
    "activeDays": <int>,       # so'nggi 7 kunda active_ms>0 bo'lgan kunlar
    "focusCategory": <str|None>, # bolaning eng ko'p o'qigan kategoriyasi
}
```

### Fayl-joylashuv

- **Yangi:**
  - `django/core/recommend.py` — sof qoida dvigateli.
  - `django/core/tests.py` ga 3 ta test qo'shiladi:
    - `test_recommendations_finish_in_progress_first`
    - `test_recommendations_reinforce_low_quiz`
    - `test_recommendations_respect_category_affinity`
  - `django/core/tests.py` ga monitoring test: `test_family_summary_includes_streak_and_focus`.
- **O'zgaradi:**
  - `django/core/catalog.py` — `story_meta` qo'shilsin.
  - `django/core/family.py:family_summary` — streak/activeDays/focusCategory hisoblanadi.
  - `django/core/views.py:dispatch` — `if method == "GET" and action == "recommendations":` branch.
  - `src/lib/api.ts` — `recommendations(id)` + `RecommendationItem` tipi.
  - `src/features/home/HomePage.tsx` — tavsiya shelf'i.
  - `src/features/parent/ParentDashboard.tsx` — streak chip.

### Tekshiruv rejesi

1. `WBOOKS_DB_PATH=":memory:" ... manage.py test core` — 20/20 bo'lishi kerak.
2. `npx vitest run` — 33/33 (frontend testlari qo'shimcha kerak emas; `CategoryIcon` allaqachon bor).
3. `npx tsc -b && npx vite build` — toza.
4. Qo'lda: Chrome DevTools orqali authenticated holda `/` da tavsiya shelf'i ko'rinishi; `/parent` da streak chip'i.

### Taxminiy hajm

~400 qator kod (backend ~200, frontend ~200) + ~150 qator test. **1 sessiyada bajariladi.**

---

## P4 — Obuna + do'kon (Payme / Click)

**Maqsad:** 33k/1-farzand va 119k/cheksiz tariflar **haqiqatan ham** sotilsin va darhol kitob/mavzu gate'lansin.

### Kiritish nuqtalari

1. **Checkout endpointlari:**
   - `POST /api/subscribe/checkout {plan: "oilaviy"|"premium-oila", returnUrl?}` → `{paymeUrl, clickUrl, orderId, expiresAt}`.
   - `GET /api/subscribe/status` → `{plan, until, maxChildren, pastDue}`.
2. **Webhook'lar:** `POST /api/webhooks/payme` va `/api/webhooks/click` — imzo tekshiruvi, `PaymentEvent` rows, idempotent (`event_id` unique).
3. **Gates (models'ga qo'shiladi):**
   - `Child` uchun: `user.active_plan().allows_children(count)` → agar `max_children` dan ortiq bo'lsa, `create_child` 403.
   - Story `price > 0` yoki `category == "premium"` bo'lsa → `GET /api/children/<id>/progress`'da `locked: true` qaytadi; ReaderPage lock ekran ko'rsatadi.
   - Theme `kitty`/`ghost` (yoki boshqa `premium`) faqat obunali oilalarda tanlanadi.
4. **Yangi modellar (migration 0004):**
   - `Plan` (boshlang'ich SubscriptionPlan'ni buyurtma bilan bog'lash).
   - `Subscription` (`user`, `plan`, `started_at`, `expires_at`, `status: active|past_due|cancelled`, `provider`).
   - `PaymentEvent` (`provider`, `external_id` unique, `payload`, `received_at`, `subscription`).
5. **Frontend:**
   - `ParentShopTab.tsx` — "Tez orada" tugmasi `Payme / Click` radios + `Buy now` → `/subscribe/checkout/:plan` sahifasi.
   - ReaderPage/LibraryPage — pullik kitoblar ustida lock overlay + `/parent/shop`ga yo'naltirish.
   - MyProfilePage — Theme tanlashda premium mavzular ustida lock belgisi.

### Test reja

- `test_checkout_returns_payme_url_and_click_url` (fake transaction id)
- `test_payme_webhook_activates_subscription_and_is_idempotent`
- `test_child_limit_enforced_on_premium_plan_and_oilaviy`
- `test_premium_story_returns_locked_for_no_subscription`

## P5 — AI murabbiy (obunaga bog'liq)

**Maqsad:** Obunali oilaga haftada bir marta **bolaning real progressi** asosida shaxsiy maslahat.

- Model: `CoachInsight` (`child`, `week_of`, `summary_uz`, `suggestions: JSON`, `generated_at`).
- `/api/parent/coach` GET → `CoachInsight | null`.
- `/api/parent/coach/refresh` POST (rate-limit, faqat active subscription).
- LLM provayderi: `settings.AI_PROVIDER` (OpenAI/Anthropic/local fallback). Prompt: bolaning 7 kunlik o'qish tarixi + recommend.py chiqindilari.
- Frontend: ParentDashboard'da "AI maslahati" paneli, "Yangilash" tugmasi.

## P6 — Webhook / bildirishnoma / admin grafiklar

- Webhook chiqarish: `core/webhooks.py` — subscription yaratilgani/tugashi, streak buzilgani, yangi kitob chiqqani.
- Email push: Aniq provayder (Resend / SMTP) orqali; admin'da `NotificationTemplate`.
- Admin dashboard grafiklari: `django/admin.py` ga custom `/admin/reports/` sahifasi — MRR, churn, DAU/WAU, kategoriya bo'yicha o'qish tarqalishi.

---

## Keyingi aniq qadamlar (P3'ni ochish)

1. `git status` → hali `django/`, `public/art/` untracked. Yuqoridagi commit **P2 tugashidan oldingi holat** ham o'z ichiga oladi.
2. Yuqoridagi roadmap'ni tekshirib oling, o'zgartirish bo'lsa ayting.
3. P3'ni boshlash: `django/core/recommend.py` va `catalog.py:story_meta` — sof funksiya va test avval, keyin endpoint.
4. `family_summary`'ga streak + focusCategory, so'ng HomePage/ParentDashboard frontend.
5. P4 (checkout) uchun **sandbox API kalitlari** kerak bo'ladi — Payme/Click hisobingizni aytsangiz (yoki qaysi provayder birinchi).
6. Playwright e2e hali ishga tushirilmagan — P3 tugagach `npx playwright test` bilan to'liq regressiya yugurtirish.
7. Eski `docs/ACCOUNTS.md`, `docs/PROJECT.md` P1/P2 o'zgarishlarini aks ettirmaydi — P4 oldidan yangilash.

## Yaqin kelajakdagi tozalash

- `vibe_images/` — gitignore'da, mahalliy tasodifiy fayllar, o'chirish xavfsiz.
- `server/` — Node backend **o'chirilgan** (git status'da `deleted`) va commit'da bo'ladi.
- `.qoder/repowiki/` hali yaratilmagan — kerak bo'lsa `/knowledge-plan`.
