import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { generateKeyPairSync, sign, scryptSync } from "node:crypto";
import { createGoogleVerifier } from "../google.mjs";
import { createApp } from "../app.mjs";
const password = "test-fixture-only-long-passphrase";
const cleanup = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});
async function open({ filename, storeOptions, distPath, googleOptions } = {}) {
  const folder = await mkdtemp(join(tmpdir(), "wbooks-api-test-"));
  cleanup.push(() => rm(folder, { recursive: true, force: true }));
  const path = filename ?? join(folder, "private.db");
  const app = createApp({
    databasePath: path,
    storeOptions,
    distPath,
    googleOptions,
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  let closed = false;
  const close = async () => {
    if (!closed) {
      closed = true;
      await app.close();
    }
  };
  cleanup.push(close);
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const request = async (
    path,
    {
      method = "GET",
      body,
      cookie,
      origin = base,
      client = "web",
      type = "application/json",
    } = {},
  ) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body === undefined
          ? {}
          : { "Content-Type": type, "X-WBooks-Client": client }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return {
      status: response.status,
      headers: response.headers,
      data,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  };
  const register = async (email = "parent@example.invalid") => {
    const r = await request("/api/auth/register", {
      method: "POST",
      body: { email, password },
    });
    assert.equal(r.status, 200);
    return r;
  };
  const child = async (cookie, name = "Kitobxon") => {
    const r = await request("/api/children", {
      method: "POST",
      cookie,
      body: { name, avatar: "sun" },
    });
    assert.equal(r.status, 201);
    return r.data.selectedChildId;
  };
  return { app, base, request, register, child, close, filename: path, folder };
}
let counter = 0;
const eventId = () => `test-event-${String(++counter).padStart(12, "0")}`;
const reading = (page = 7, complete = true) => ({
  id: eventId(),
  type: "reading",
  storyId: "oy-dosti",
  page,
  complete,
});
const quiz = (answers = [1, 0, 2]) => ({
  id: eventId(),
  type: "quiz",
  quizId: "oy-dosti",
  answers,
});

test("register/login use hashed credentials, opaque HttpOnly cookies and server revocation", async () => {
  const a = await open();
  const invalid = await a.request("/api/auth/register", {
    method: "POST",
    body: { email: "parent@example.invalid", password: "short" },
  });
  assert.equal(invalid.status, 400);
  for (const email of ["not-an-email", "x\u0000@example.invalid"])
    assert.equal(
      (
        await a.request("/api/auth/register", {
          method: "POST",
          body: { email, password },
        })
      ).status,
      400,
    );
  const user = await a.register("Parent@Example.invalid");
  assert.equal(user.data.user.email, "parent@example.invalid");
  assert.ok(!("token" in user.data));
  assert.match(user.headers.get("set-cookie"), /HttpOnly/);
  assert.match(user.headers.get("set-cookie"), /SameSite=Lax/);
  assert.equal(user.headers.get("cache-control"), "no-store");
  const child = await a.child(user.cookie);
  const db = new DatabaseSync(a.filename);
  const stored = db.prepare("SELECT password_hash FROM users").get();
  assert.notEqual(stored.password_hash, password);
  assert.match(stored.password_hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
  const session = db.prepare("SELECT token_hash FROM sessions").get();
  assert.ok(!user.cookie.includes(session.token_hash));
  db.close();
  assert.equal(
    (
      await a.request("/api/auth/register", {
        method: "POST",
        body: { email: "parent@example.invalid", password },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await a.request("/api/auth/login", {
        method: "POST",
        body: {
          email: "parent@example.invalid",
          password: "incorrect-password",
        },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await a.request("/api/auth/login", {
        method: "POST",
        body: {
          email: "unknown@example.invalid",
          password: "incorrect-password",
        },
      })
    ).data.error,
    "E-mail yoki parol noto‘g‘ri.",
  );
  const logout = await a.request("/api/auth/logout", {
    method: "POST",
    cookie: user.cookie,
    body: {},
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(
    (await a.request("/api/session", { cookie: user.cookie })).data.user,
    null,
  );
  assert.equal(
    (
      await a.request(`/api/children/${child}/progress`, {
        cookie: user.cookie,
      })
    ).status,
    401,
  );
  const again = await a.request("/api/auth/login", {
    method: "POST",
    body: { email: "parent@example.invalid", password },
  });
  assert.equal(again.status, 200);
  assert.equal(again.data.children[0].id, child);
});
test("a different parent cannot read, select or mutate a child by guessing its ID", async () => {
  const a = await open(),
    one = await a.register("one@example.invalid"),
    two = await a.register("two@example.invalid");
  const child = await a.child(one.cookie);
  for (const [suffix, method, body] of [
    ["progress", "GET", undefined],
    ["select", "POST", {}],
    ["events", "POST", { events: [reading()] }],
  ])
    assert.equal(
      (
        await a.request(`/api/children/${child}/${suffix}`, {
          method,
          body,
          cookie: two.cookie,
        })
      ).status,
      404,
    );
  assert.equal(
    (
      await a.request("/api/children", {
        method: "POST",
        cookie: two.cookie,
        body: { name: "Other", avatar: "sun", user_id: one.data.user.id },
      })
    ).status,
    400,
  );
  assert.equal(
    (await a.request(`/api/children/${child}/progress`, { cookie: one.cookie }))
      .data.revision,
    0,
  );
});
test("siblings keep separate progress and selection belongs to each session", async () => {
  const a = await open(),
    parent = await a.register();
  const first = await a.child(parent.cookie, "Birinchi"),
    second = await a.child(parent.cookie, "Ikkinchi");
  const result = await a.request(`/api/children/${first}/events`, {
    method: "POST",
    cookie: parent.cookie,
    body: { events: [reading(3, false)] },
  });
  assert.equal(result.data.progress.reading["oy-dosti"].page, 3);
  assert.deepEqual(
    (
      await a.request(`/api/children/${second}/progress`, {
        cookie: parent.cookie,
      })
    ).data.progress.reading,
    {},
  );
  const other = await a.request("/api/auth/login", {
    method: "POST",
    body: { email: "parent@example.invalid", password },
  });
  await a.request(`/api/children/${first}/select`, {
    method: "POST",
    body: {},
    cookie: other.cookie,
  });
  assert.equal(
    (await a.request("/api/session", { cookie: parent.cookie })).data
      .selectedChildId,
    second,
  );
  assert.equal(
    (await a.request("/api/session", { cookie: other.cookie })).data
      .selectedChildId,
    first,
  );
});
test("server grades answers, retains best score and never counts a retried event twice", async () => {
  const a = await open(),
    parent = await a.register(),
    child = await a.child(parent.cookie);
  const path = `/api/children/${child}/events`;
  assert.equal(
    (
      await a.request(path, {
        method: "POST",
        cookie: parent.cookie,
        body: { events: [quiz()] },
      })
    ).status,
    409,
  );
  const completed = reading(),
    attempt = quiz([1, 1, 2]);
  const batch = { events: [completed, attempt] };
  const first = await a.request(path, {
    method: "POST",
    cookie: parent.cookie,
    body: batch,
  });
  assert.equal(first.status, 200);
  assert.equal(first.data.progress.quizzes["oy-dosti"].score, 2);
  const date = first.data.progress.reading["oy-dosti"].completedAt;
  const repeat = await a.request(path, {
    method: "POST",
    cookie: parent.cookie,
    body: batch,
  });
  assert.deepEqual(repeat.data, first.data);
  const worse = await a.request(path, {
    method: "POST",
    cookie: parent.cookie,
    body: { events: [quiz([0, 1, 0]), reading(0, false)] },
  });
  assert.equal(worse.data.progress.quizzes["oy-dosti"].score, 2);
  assert.equal(worse.data.progress.quizzes["oy-dosti"].attempts, 2);
  assert.equal(worse.data.progress.reading["oy-dosti"].completedAt, date);
  assert.equal(worse.data.progress.reading["oy-dosti"].page, 0);
  const conflict = await a.request(path, {
    method: "POST",
    cookie: parent.cookie,
    body: { events: [{ ...attempt, answers: [1, 0, 2] }] },
  });
  assert.equal(conflict.status, 409);
});
test("invalid batches are atomic; client scores, timestamps and out-of-range pages are rejected", async () => {
  const a = await open(),
    parent = await a.register(),
    child = await a.child(parent.cookie);
  const path = `/api/children/${child}/events`;
  const invalid = [
    reading(-1, false),
    reading(8, false),
    reading(0, true),
    { ...reading(), storyId: "__proto__" },
    { ...reading(), completedAt: "forged" },
    { ...quiz(), score: 99 },
    { ...quiz(), quizId: "__proto__" },
    quiz([99, 0, 2]),
    quiz([1]),
  ];
  for (const event of invalid)
    assert.equal(
      (
        await a.request(path, {
          method: "POST",
          cookie: parent.cookie,
          body: { events: [reading(2, false), event] },
        })
      ).status,
      400,
    );
  const transaction = await a.request(path, {
    method: "POST",
    cookie: parent.cookie,
    body: { events: [reading(2, false), quiz()] },
  });
  assert.equal(transaction.status, 409);
  const result = await a.request(`/api/children/${child}/progress`, {
    cookie: parent.cookie,
  });
  assert.deepEqual(result.data.progress.reading, {});
  assert.equal(result.data.revision, 0);
});
test("sessions and progress survive a full server restart", async () => {
  const a = await open(),
    parent = await a.register(),
    child = await a.child(parent.cookie);
  await a.request(`/api/children/${child}/events`, {
    method: "POST",
    cookie: parent.cookie,
    body: { events: [reading(), quiz()] },
  });
  await a.close();
  const b = await open({ filename: a.filename });
  const session = await b.request("/api/session", { cookie: parent.cookie });
  assert.equal(session.data.user.id, parent.data.user.id);
  const data = await b.request(`/api/children/${child}/progress`, {
    cookie: parent.cookie,
  });
  assert.equal(data.data.progress.quizzes["oy-dosti"].score, 3);
  assert.equal(data.data.progress.reading["oy-dosti"].page, 7);
});
test("cross-origin writes and form posts cannot mutate an authenticated account", async () => {
  const a = await open(),
    parent = await a.register();
  for (const options of [{ origin: "https://other.invalid" }, { client: "" }])
    assert.equal(
      (
        await a.request("/api/children", {
          method: "POST",
          cookie: parent.cookie,
          body: { name: "No", avatar: "sun" },
          ...options,
        })
      ).status,
      403,
    );
  assert.equal(
    (
      await a.request("/api/children", {
        method: "POST",
        cookie: parent.cookie,
        body: { name: "No", avatar: "sun" },
        type: "text/plain",
      })
    ).status,
    415,
  );
  assert.equal(
    (await a.request("/api/session", { cookie: parent.cookie })).data.children
      .length,
    0,
  );
});
test("failed authentication attempts are rate limited", async () => {
  const a = await open({ storeOptions: { loginLimit: 2 } });
  await a.register();
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await a.request("/api/auth/login", {
          method: "POST",
          body: { email: "parent@example.invalid", password: "wrong" },
        })
      ).status,
      401,
    );
  const blocked = await a.request("/api/auth/login", {
    method: "POST",
    body: { email: "parent@example.invalid", password },
  });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});
test("the application server serves its build safely and never exposes data or env paths", async () => {
  const folder = await mkdtemp(join(tmpdir(), "wbooks-static-"));
  cleanup.push(() => rm(folder, { recursive: true, force: true }));
  const dist = join(folder, "dist");
  await mkdir(dist);
  await writeFile(
    join(dist, "index.html"),
    "<!doctype html><title>WBooks fixture</title>",
  );
  const a = await open({ distPath: dist });
  const root = await a.request("/");
  assert.equal(root.status, 200);
  assert.match(root.data, /WBooks fixture/);
  assert.match(
    root.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  for (const path of [
    "/.env",
    "/data/wbooks.db",
    "/%2e%2e/.env",
    "/assets/missing.js",
    "/api/not-found",
  ])
    assert.equal((await a.request(path)).status, 404);
});

test("parent PIN and password gate are enforced on the server, expire, and preserve child reading access", async () => {
  let time = Date.now();
  const a = await open({ storeOptions: { clock: () => time } }),
    parent = await a.register(),
    child = await a.child(parent.cookie, "Azizbek");
  const post = (path, body) =>
    a.request(path, { method: "POST", cookie: parent.cookie, body });
  assert.equal((await post("/api/parent/pin", { pin: "123" })).status, 400);
  assert.equal((await post("/api/parent/pin", { pin: "482619" })).status, 200);
  const db = new DatabaseSync(a.filename);
  const stored = db.prepare("SELECT pin_hash FROM users").get().pin_hash;
  assert.match(stored, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
  assert.notEqual(stored, "482619");
  db.close();
  await post("/api/parent/lock", {});
  assert.equal(
    (await a.request("/api/parent/overview", { cookie: parent.cookie })).status,
    403,
  );
  assert.equal(
    (await post("/api/children", { name: "Blocked", avatar: "sun" })).status,
    403,
  );
  assert.equal((await post("/api/parent/pin", { pin: "999999" })).status, 403);
  assert.equal(
    (
      await a.request(`/api/children/${child}/progress`, {
        cookie: parent.cookie,
      })
    ).status,
    200,
  );
  assert.equal(
    (await post("/api/parent/unlock", { method: "pin", secret: "111111" }))
      .status,
    403,
  );
  assert.equal(
    (await post("/api/parent/unlock", { method: "pin", secret: "482619" })).data
      .unlocked,
    true,
  );
  assert.equal(
    (await a.request("/api/parent/overview", { cookie: parent.cookie })).status,
    200,
  );
  time += 31 * 60000;
  assert.equal(
    (await a.request("/api/parent/status", { cookie: parent.cookie })).data
      .unlocked,
    false,
  );
  assert.equal(
    (await a.request("/api/parent/overview", { cookie: parent.cookie })).status,
    403,
  );
  assert.equal(
    (await post("/api/parent/unlock", { method: "password", secret: password }))
      .data.unlocked,
    true,
  );
});

test("PIN guessing is rate limited per parent across newly issued sessions", async () => {
  const a = await open(),
    parent = await a.register();
  await a.request("/api/parent/pin", {
    method: "POST",
    cookie: parent.cookie,
    body: { pin: "482619" },
  });
  await a.request("/api/parent/lock", {
    method: "POST",
    cookie: parent.cookie,
    body: {},
  });
  for (let n = 0; n < 5; n++)
    assert.equal(
      (
        await a.request("/api/parent/unlock", {
          method: "POST",
          cookie: parent.cookie,
          body: { method: "pin", secret: "111111" },
        })
      ).status,
      403,
    );
  const other = await a.request("/api/auth/login", {
    method: "POST",
    body: { email: "parent@example.invalid", password },
  });
  await a.request("/api/parent/lock", {
    method: "POST",
    cookie: other.cookie,
    body: {},
  });
  assert.equal(
    (
      await a.request("/api/parent/unlock", {
        method: "POST",
        cookie: other.cookie,
        body: { method: "pin", secret: "482619" },
      })
    ).status,
    429,
  );
});

test("four children retain separate summaries, graded attempts and recent history without duplicate receipts", async () => {
  const a = await open(),
    parent = await a.register();
  const ids = [];
  for (const name of ["Azizbek", "Madina", "Yusuf", "Soliha"])
    ids.push(await a.child(parent.cookie, name));
  const first = [reading(), quiz()],
    second = [reading(2, false)];
  const write = (id, events) =>
    a.request(`/api/children/${id}/events`, {
      method: "POST",
      cookie: parent.cookie,
      body: { events },
    });
  assert.equal((await write(ids[0], first)).status, 200);
  await write(ids[0], first);
  await write(ids[1], second);
  let result = await a.request("/api/parent/overview", {
    cookie: parent.cookie,
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.children.length, 4);
  const byName = Object.fromEntries(
    result.data.children.map((c) => [c.profile.name, c]),
  );
  assert.equal(byName.Azizbek.metrics.completed, 1);
  assert.equal(byName.Azizbek.metrics.quizAttempts, 1);
  assert.equal(byName.Azizbek.metrics.accuracy, 100);
  assert.equal(byName.Azizbek.recent.length, 2);
  assert.equal(byName.Madina.progress.reading["oy-dosti"].page, 2);
  assert.equal(byName.Madina.metrics.completed, 0);
  assert.equal(byName.Yusuf.metrics.accuracy, null);
  assert.equal(byName.Soliha.metrics.totalSeconds, 0);
  await write(ids[0], [quiz([0, 1, 0])]);
  result = await a.request("/api/parent/overview", { cookie: parent.cookie });
  const aziz = result.data.children.find((c) => c.profile.name === "Azizbek");
  assert.equal(aziz.metrics.accuracy, 100);
  assert.equal(aziz.recent[0].score, 0); // Latest attempt is not misreported as the best.
  const stranger = await a.register("other-family@example.invalid");
  assert.equal(
    (await a.request("/api/parent/overview", { cookie: stranger.cookie })).data
      .children.length,
    0,
  );
});

test("active reading uses server intervals, does not double count parallel tabs or bridge long gaps, and splits Tashkent midnight", async () => {
  let time = Date.parse("2026-11-12T18:59:50Z");
  const a = await open({ storeOptions: { clock: () => time } }),
    parent = await a.register(),
    child = await a.child(parent.cookie);
  const activity = (streamId, phase, extra = {}) =>
    a.request(`/api/children/${child}/activity`, {
      method: "POST",
      cookie: parent.cookie,
      body: { streamId, phase, storyId: "oy-dosti", ...extra },
    });
  const one = "a".repeat(32),
    two = "b".repeat(32);
  await activity(one, "start");
  await activity(two, "start");
  time += 15000;
  assert.equal((await activity(one, "pulse")).data.creditedSeconds, 15);
  assert.equal((await activity(two, "pulse")).data.creditedSeconds, 0);
  assert.equal((await activity(one, "pulse")).data.creditedSeconds, 0);
  time += 15000;
  assert.equal((await activity(two, "pulse")).data.creditedSeconds, 15);
  assert.equal((await activity(one, "pulse", { elapsed: 999999 })).status, 400);
  time += 60000;
  assert.equal((await activity(one, "pulse")).data.creditedSeconds, 0);
  const summary = (
    await a.request("/api/parent/overview", { cookie: parent.cookie })
  ).data.children[0];
  assert.equal(summary.metrics.totalSeconds, 30);
  assert.equal(summary.week.find((d) => d.date === "2026-11-12").seconds, 10);
  assert.equal(summary.week.find((d) => d.date === "2026-11-13").seconds, 20);
  assert.equal(summary.metrics.todaySeconds, 20);
  const stranger = await a.register("stranger@example.invalid");
  assert.equal(
    (
      await a.request(`/api/children/${child}/activity`, {
        method: "POST",
        cookie: stranger.cookie,
        body: { streamId: one, storyId: "oy-dosti", phase: "start" },
      })
    ).status,
    404,
  );
});

function googleFixture() {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const clientId = "fixture-only.apps.googleusercontent.com";
  const key = {
    ...publicKey.export({ format: "jwk" }),
    kid: "test-signing-key",
    alg: "RS256",
    use: "sig",
  };
  const token = (nonce, override = {}) => {
    const encode = (data) =>
      Buffer.from(JSON.stringify(data)).toString("base64url");
    const header = encode({ alg: "RS256", kid: key.kid }),
      now = Math.floor(Date.now() / 1000);
    const payload = encode({
      iss: "https://accounts.google.com",
      aud: clientId,
      sub: "google-fixture-subject",
      email: "google-parent@example.invalid",
      email_verified: true,
      nonce,
      iat: now,
      exp: now + 3600,
      ...override,
    });
    const signed = header + "." + payload;
    return (
      signed +
      "." +
      sign("RSA-SHA256", Buffer.from(signed), privateKey).toString("base64url")
    );
  };
  return { clientId, key, token, fetchKeys: async () => ({ keys: [key] }) };
}

test("Google verifier checks actual RSA signature, audience, nonce, issuer, expiry and verified email", async () => {
  const fixture = googleFixture(),
    verify = createGoogleVerifier(fixture),
    nonce = "test-nonce-123";
  assert.equal(
    (await verify(fixture.token(nonce), nonce)).sub,
    "google-fixture-subject",
  );
  for (const override of [
    { aud: "wrong-client" },
    { iss: "https://attacker.invalid" },
    { exp: 0 },
    { iat: Date.now() / 1000 + 600 },
    { nonce: "wrong-nonce" },
    { email_verified: false },
    { azp: "other-client" },
    { sub: "" },
  ])
    await assert.rejects(() => verify(fixture.token(nonce, override), nonce), {
      status: 401,
    });
  const parts = fixture.token(nonce).split(".");
  parts[1] = Buffer.from(
    JSON.stringify({ email: "forged@example.invalid" }),
  ).toString("base64url");
  await assert.rejects(() => verify(parts.join("."), nonce), { status: 401 });
  const other = googleFixture();
  await assert.rejects(() => verify(other.token(nonce), nonce), {
    status: 401,
  });
});

test("Google login uses a single-use browser nonce and never silently links an existing password account", async () => {
  const google = googleFixture(),
    a = await open({ googleOptions: google });
  const challenge = () => a.request("/api/auth/options");
  let options = await challenge();
  assert.equal(options.data.googleClientId, google.clientId);
  const credential = google.token(options.data.nonce);
  let logged = await a.request("/api/auth/google", {
    method: "POST",
    cookie: options.cookie,
    body: { credential },
  });
  assert.equal(logged.status, 200);
  assert.equal(logged.data.parent.canUsePassword, false);
  assert.equal(
    (
      await a.request("/api/auth/google", {
        method: "POST",
        cookie: options.cookie,
        body: { credential },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await a.request("/api/auth/login", {
        method: "POST",
        body: { email: "google-parent@example.invalid", password: "disabled" },
      })
    ).status,
    401,
  );
  const id = await a.child(logged.cookie, "Google child");
  options = await challenge();
  logged = await a.request("/api/auth/google", {
    method: "POST",
    cookie: options.cookie,
    body: { credential: google.token(options.data.nonce) },
  });
  assert.equal(logged.status, 200);
  assert.equal(logged.data.selectedChildId, id);
  const local = await a.register("local-parent@example.invalid");
  options = await challenge();
  const localCredential = google.token(options.data.nonce, {
    sub: "different-google-subject",
    email: "local-parent@example.invalid",
  });
  assert.equal(
    (
      await a.request("/api/auth/google", {
        method: "POST",
        cookie: options.cookie,
        body: { credential: localCredential },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await a.request("/api/auth/google", {
        method: "POST",
        cookie: local.cookie + "; " + options.cookie,
        body: { credential: localCredential, link: true },
      })
    ).status,
    200,
  );
  options = await challenge();
  const login = await a.request("/api/auth/google", {
    method: "POST",
    cookie: options.cookie,
    body: {
      credential: google.token(options.data.nonce, {
        sub: "different-google-subject",
        email: "local-parent@example.invalid",
      }),
    },
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.id, local.data.user.id);
});

test("Google stays explicitly unavailable without configuration and makes no provider request", async () => {
  const a = await open();
  const options = await a.request("/api/auth/options");
  assert.equal(options.data.googleClientId, "");
  assert.equal(options.data.nonce, null);
  assert.equal(
    (
      await a.request("/api/auth/google", {
        method: "POST",
        body: { credential: "not-a-real-token" },
      })
    ).status,
    503,
  );
});

test("v1 database upgrades preserve existing passwords, child names and progress while starting activity at zero", async () => {
  const folder = await mkdtemp(join(tmpdir(), "wbooks-v1-"));
  cleanup.push(() => rm(folder, { recursive: true, force: true }));
  const filename = join(folder, "old.db"),
    db = new DatabaseSync(filename);
  db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE children(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,avatar TEXT NOT NULL,theme TEXT NOT NULL DEFAULT 'classic',revision INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
    CREATE TABLE reading(child_id TEXT NOT NULL,story_id TEXT NOT NULL,page INTEGER NOT NULL,started_at TEXT NOT NULL,completed_at TEXT,PRIMARY KEY(child_id,story_id));PRAGMA user_version=1;`);
  const salt = "a".repeat(32),
    hash = salt + ":" + scryptSync(password, salt, 64).toString("hex");
  const child = "11111111-1111-4111-a111-111111111111";
  db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
    "old-parent",
    "legacy@example.invalid",
    hash,
    "2026-11-01T00:00:00Z",
  );
  db.prepare("INSERT INTO children VALUES(?,?,?,?,?,?,?)").run(
    child,
    "old-parent",
    "Eski ism",
    "sun",
    "classic",
    1,
    "2026-11-01T00:00:00Z",
  );
  db.prepare("INSERT INTO reading VALUES(?,?,?,?,?)").run(
    child,
    "oy-dosti",
    7,
    "2026-11-01T00:00:00Z",
    "2026-11-01T00:05:00Z",
  );
  db.close();
  const a = await open({ filename }),
    login = await a.request("/api/auth/login", {
      method: "POST",
      body: { email: "legacy@example.invalid", password },
    });
  assert.equal(login.status, 200);
  const result = (
    await a.request("/api/parent/overview", { cookie: login.cookie })
  ).data.children[0];
  assert.equal(result.profile.name, "Eski ism");
  assert.equal(result.metrics.completed, 1);
  assert.equal(result.metrics.totalSeconds, 0);
  assert.equal(
    result.progress.reading["oy-dosti"].completedAt,
    "2026-11-01T00:05:00Z",
  );
});
