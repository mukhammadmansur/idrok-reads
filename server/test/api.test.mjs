import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../app.mjs";
const password = "test-fixture-only-long-passphrase";
const cleanup = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});
async function open({ filename, storeOptions, distPath } = {}) {
  const folder = await mkdtemp(join(tmpdir(), "wbooks-api-test-"));
  cleanup.push(() => rm(folder, { recursive: true, force: true }));
  const path = filename ?? join(folder, "private.db");
  const app = createApp({ databasePath: path, storeOptions, distPath });
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
