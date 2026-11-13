import { createFamily } from "./family.mjs";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import catalog from "./catalog.json" with { type: "json" };

const scrypt = promisify(scryptCallback);
const themes = ["classic", "forest", "ice", "holo"];
const avatars = ["sun", "leaf", "snow", "rocket"];
const digest = (value) => createHash("sha256").update(value).digest("hex");
const now = () => new Date().toISOString();
const storyById = (id) =>
  typeof id === "string" && Object.hasOwn(catalog.stories, id)
    ? catalog.stories[id]
    : undefined;
export class ApiError extends Error {
  constructor(status, message, code = "invalid_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
function requireValue(ok, message) {
  if (!ok) throw new ApiError(400, message);
}
function keys(body, allowed) {
  requireValue(
    body && typeof body === "object" && !Array.isArray(body),
    "So‘rov noto‘g‘ri.",
  );
  requireValue(
    Object.keys(body).every((key) => allowed.includes(key)),
    "So‘rovda noma’lum maydon bor.",
  );
}
function email(value) {
  requireValue(
    typeof value === "string" &&
      value.length <= 254 &&
      !/\p{Cc}/u.test(value) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "E-mail manzilini tekshiring.",
  );
  return value.trim().toLowerCase();
}
function password(value) {
  requireValue(
    typeof value === "string" && value.length >= 12 && value.length <= 128,
    "Parol 12–128 belgidan iborat bo‘lsin.",
  );
  return value;
}
async function passwordHash(value) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(value, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}
async function passwordMatches(value, hash) {
  const [salt, expected] = hash.split(":");
  const key = await scrypt(value, salt, 64);
  return timingSafeEqual(key, Buffer.from(expected, "hex"));
}

export function createStore(
  filename,
  {
    sessionDays = 7,
    loginLimit = 20,
    registerLimit = 10,
    clock = () => Date.now(),
  } = {},
) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS children(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,avatar TEXT NOT NULL,theme TEXT NOT NULL DEFAULT 'classic',revision INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS children_owner ON children(user_id);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,selected_child_id TEXT REFERENCES children(id) ON DELETE SET NULL,expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS reading(child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,story_id TEXT NOT NULL,page INTEGER NOT NULL,started_at TEXT NOT NULL,completed_at TEXT,PRIMARY KEY(child_id,story_id));
    CREATE TABLE IF NOT EXISTS quizzes(child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,quiz_id TEXT NOT NULL,score INTEGER NOT NULL,total INTEGER NOT NULL,attempts INTEGER NOT NULL,attempted_at TEXT NOT NULL,PRIMARY KEY(child_id,quiz_id));
    CREATE TABLE IF NOT EXISTS events(child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,event_id TEXT NOT NULL,payload_hash TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(child_id,event_id));
    CREATE TABLE IF NOT EXISTS rate_limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
    `);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const atomic = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };
  const publicChild = (row) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    createdAt: row.created_at,
  });
  function rate(action, ip, limit, windowMs) {
    const bucket = digest(`${action}:${ip}`),
      time = Date.now();
    run("DELETE FROM rate_limits WHERE reset_at < ?", time);
    const old = get("SELECT * FROM rate_limits WHERE bucket=?", bucket);
    if (old && old.count >= limit) {
      const error = new ApiError(
        429,
        "Urinishlar ko‘payib ketdi. Birozdan keyin qayta urinib ko‘ring.",
        "rate_limited",
      );
      error.retryAfter = Math.ceil((old.reset_at - time) / 1000);
      throw error;
    }
    run(
      "INSERT INTO rate_limits(bucket,count,reset_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1",
      bucket,
      time + windowMs,
    );
  }
  function session(token) {
    if (typeof token !== "string" || !token) return null;
    const row = get(
      "SELECT s.*,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? AND expires_at>?",
      digest(token),
      Date.now(),
    );
    return row ?? null;
  }
  function authenticated(token) {
    const current = session(token);
    if (!current)
      throw new ApiError(401, "Akkauntga qayta kiring.", "unauthorized");
    return current;
  }
  function owned(token, id) {
    const current = authenticated(token);
    const child = get(
      "SELECT * FROM children WHERE id=? AND user_id=?",
      id,
      current.user_id,
    );
    if (!child) throw new ApiError(404, "Profil topilmadi.", "not_found");
    return { current, child };
  }
  function sessionView(token) {
    const current = session(token);
    if (!current)
      return { user: null, children: [], selectedChildId: null, parent: null };
    const children = all(
      "SELECT * FROM children WHERE user_id=? ORDER BY created_at,id",
      current.user_id,
    );
    return {
      user: { id: current.user_id, email: current.email },
      parent: family.parentState(token),
      children: children.map(publicChild),
      selectedChildId: children.some(
        (child) => child.id === current.selected_child_id,
      )
        ? current.selected_child_id
        : (children[0]?.id ?? null),
    };
  }
  function issueSession(userId) {
    const token = randomBytes(32).toString("base64url");
    run("DELETE FROM sessions WHERE expires_at<=?", Date.now());
    run(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
      digest(token),
      userId,
      Date.now() + sessionDays * 86400000,
    );
    family.unlockSession(token);
    return { token, ...sessionView(token) };
  }
  function progress(token, id) {
    const { child } = owned(token, id);
    const reading = {},
      quizzes = {};
    for (const row of all("SELECT * FROM reading WHERE child_id=?", id))
      reading[row.story_id] = {
        page: row.page,
        startedAt: row.started_at,
        ...(row.completed_at ? { completedAt: row.completed_at } : {}),
      };
    for (const row of all("SELECT * FROM quizzes WHERE child_id=?", id))
      quizzes[row.quiz_id] = {
        score: row.score,
        total: row.total,
        attempts: row.attempts,
        attemptedAt: row.attempted_at,
      };
    return {
      revision: child.revision,
      progress: { version: 1, theme: child.theme, reading, quizzes },
    };
  }
  function validateEvent(event) {
    requireValue(event && typeof event === "object", "Natija noto‘g‘ri.");
    requireValue(
      typeof event.id === "string" && /^[a-zA-Z0-9_-]{16,80}$/.test(event.id),
      "Natija identifikatori noto‘g‘ri.",
    );
    if (event.type === "theme") {
      keys(event, ["id", "type", "theme"]);
      requireValue(themes.includes(event.theme), "Olam noto‘g‘ri.");
    } else if (event.type === "reading") {
      keys(event, ["id", "type", "storyId", "page", "complete"]);
      const story = storyById(event.storyId);
      requireValue(
        story &&
          Number.isInteger(event.page) &&
          event.page >= 0 &&
          event.page < story.pages,
        "Kitob sahifasi noto‘g‘ri.",
      );
      requireValue(
        typeof event.complete === "boolean" &&
          (!event.complete || event.page === story.pages - 1),
        "Kitob oxirigacha o‘qilsin.",
      );
    } else if (event.type === "quiz") {
      keys(event, ["id", "type", "quizId", "answers"]);
      const quiz =
        event.quizId === "general" ? catalog.general : storyById(event.quizId);
      requireValue(
        quiz &&
          Array.isArray(event.answers) &&
          event.answers.length === quiz.answers.length &&
          event.answers.every(
            (answer, i) =>
              Number.isInteger(answer) &&
              answer >= 0 &&
              answer < quiz.options[i],
          ),
        "Savol javoblari noto‘g‘ri.",
      );
    } else throw new ApiError(400, "Natija turi noto‘g‘ri.");
  }
  const dummyHash =
    "00000000000000000000000000000000:" + Buffer.alloc(64).toString("hex");
  const family = createFamily({
    db,
    run,
    get,
    all,
    atomic,
    authenticated,
    owned,
    progress,
    publicChild,
    sessionView,
    issueSession,
    rate,
    passwordHash,
    passwordMatches,
    digest,
    ApiError,
    requireValue,
    keys,
    storyById,
    clock,
  });
  return {
    ...family,
    close: () => db.close(),
    sessionDays,
    sessionView,
    async register(body, ip) {
      keys(body, ["email", "password"]);
      const address = email(body.email),
        secret = password(body.password);
      rate("register", ip, registerLimit, 3600000);
      const hash = await passwordHash(secret);
      const id = randomUUID();
      try {
        run(
          "INSERT INTO users(id,email,password_hash,created_at) VALUES(?,?,?,?)",
          id,
          address,
          hash,
          now(),
        );
      } catch (error) {
        if (get("SELECT id FROM users WHERE email=?", address))
          throw new ApiError(
            409,
            "Bu e-mail bilan akkaunt bor. Kirish bo‘limidan foydalaning.",
            "already_registered",
          );
        throw error;
      }
      return issueSession(id);
    },
    async login(body, ip) {
      keys(body, ["email", "password"]);
      rate("login", ip, loginLimit, 900000);
      const address =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const secret =
        typeof body.password === "string" && body.password.length <= 128
          ? body.password
          : "";
      const user = get("SELECT * FROM users WHERE email=?", address);
      const matches = await passwordMatches(
        secret,
        user?.password_enabled ? user.password_hash : dummyHash,
      );
      if (!user || !user.password_enabled || !matches)
        throw new ApiError(
          401,
          "E-mail yoki parol noto‘g‘ri.",
          "invalid_credentials",
        );
      return issueSession(user.id);
    },
    logout(token) {
      if (token) run("DELETE FROM sessions WHERE token_hash=?", digest(token));
    },
    createChild(token, body) {
      keys(body, ["name", "avatar"]);
      const current = family.requireParent(token);
      requireValue(
        typeof body.name === "string" &&
          body.name.trim().length >= 1 &&
          body.name.trim().length <= 30 &&
          !/\p{Cc}/u.test(body.name),
        "Ism 1–30 belgidan iborat bo‘lsin.",
      );
      requireValue(avatars.includes(body.avatar), "Belgi tanlang.");
      return atomic(() => {
        requireValue(
          get(
            "SELECT COUNT(*) count FROM children WHERE user_id=?",
            current.user_id,
          ).count < 6,
          "Bitta akkauntga ko‘pi bilan 6 profil qo‘shiladi.",
        );
        const id = randomUUID();
        run(
          "INSERT INTO children(id,user_id,name,avatar,created_at) VALUES(?,?,?,?,?)",
          id,
          current.user_id,
          body.name.trim(),
          body.avatar,
          now(),
        );
        run(
          "UPDATE sessions SET selected_child_id=? WHERE token_hash=?",
          id,
          current.token_hash,
        );
        return sessionView(token);
      });
    },
    selectChild(token, id) {
      const { current } = owned(token, id);
      family.requireParent(token);
      run(
        "UPDATE sessions SET selected_child_id=? WHERE token_hash=?",
        id,
        current.token_hash,
      );
      return sessionView(token);
    },
    progress,
    applyEvents(token, id, body) {
      owned(token, id);
      keys(body, ["events"]);
      requireValue(
        Array.isArray(body.events) &&
          body.events.length >= 1 &&
          body.events.length <= 50,
        "Bir so‘rovda 1–50 ta natija yuborilsin.",
      );
      body.events.forEach(validateEvent);
      atomic(() => {
        for (const event of body.events) {
          const payload = digest(JSON.stringify(event)),
            old = get(
              "SELECT payload_hash FROM events WHERE child_id=? AND event_id=?",
              id,
              event.id,
            );
          if (old) {
            if (old.payload_hash !== payload)
              throw new ApiError(
                409,
                "Natija identifikatori qayta ishlatilgan.",
                "event_conflict",
              );
            continue;
          }
          const time = now();
          if (event.type === "theme")
            run("UPDATE children SET theme=? WHERE id=?", event.theme, id);
          else if (event.type === "reading")
            run(
              "INSERT INTO reading(child_id,story_id,page,started_at,completed_at) VALUES(?,?,?,?,?) ON CONFLICT(child_id,story_id) DO UPDATE SET page=excluded.page,completed_at=COALESCE(reading.completed_at,excluded.completed_at)",
              id,
              event.storyId,
              event.page,
              time,
              event.complete ? time : null,
            );
          else {
            if (
              event.quizId !== "general" &&
              !get(
                "SELECT completed_at FROM reading WHERE child_id=? AND story_id=?",
                id,
                event.quizId,
              )?.completed_at
            )
              throw new ApiError(
                409,
                "Avval kitobni o‘qib tugating.",
                "reading_required",
              );
            const quiz =
              event.quizId === "general"
                ? catalog.general
                : storyById(event.quizId);
            const score = event.answers.reduce(
              (sum, answer, index) =>
                sum + Number(answer === quiz.answers[index]),
              0,
            );
            run(
              "INSERT INTO quizzes VALUES(?,?,?,?,1,?) ON CONFLICT(child_id,quiz_id) DO UPDATE SET score=MAX(quizzes.score,excluded.score),attempts=quizzes.attempts+1,attempted_at=excluded.attempted_at",
              id,
              event.quizId,
              score,
              quiz.answers.length,
              time,
            );
          }
          family.logEvent(
            id,
            event.type === "quiz"
              ? {
                  ...event,
                  attemptScore: event.answers.reduce(
                    (sum, answer, index) =>
                      sum +
                      Number(
                        answer ===
                          (event.quizId === "general"
                            ? catalog.general
                            : storyById(event.quizId)
                          ).answers[index],
                      ),
                    0,
                  ),
                }
              : event,
            time,
          );
          run(
            "INSERT INTO events VALUES(?,?,?,?)",
            id,
            event.id,
            payload,
            time,
          );
          run("UPDATE children SET revision=revision+1 WHERE id=?", id);
        }
      });
      return progress(token, id);
    },
  };
}
