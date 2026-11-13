import { randomBytes, randomUUID } from "node:crypto";

const dayKey = (ms) => new Date(ms + 5 * 3600000).toISOString().slice(0, 10);
export function createFamily({
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
}) {
  // Additive migration: existing accounts, sessions, readings and quiz results stay intact.
  const add = (table, name, declaration) => {
    if (!all(`PRAGMA table_info(${table})`).some((col) => col.name === name))
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${declaration}`);
  };
  atomic(() => {
    add("users", "pin_hash", "TEXT");
    add("users", "password_enabled", "INTEGER NOT NULL DEFAULT 1");
    add("sessions", "parent_until", "INTEGER NOT NULL DEFAULT 0");
    add("children", "last_active_at", "TEXT");
    add("children", "last_credit_ms", "INTEGER NOT NULL DEFAULT 0");
    db.exec(`
      CREATE TABLE IF NOT EXISTS identities(provider TEXT NOT NULL, subject TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(provider,subject));
      CREATE TABLE IF NOT EXISTS google_challenges(hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS activity_daily(child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,day TEXT NOT NULL,active_ms INTEGER NOT NULL DEFAULT 0,reading_events INTEGER NOT NULL DEFAULT 0,quiz_attempts INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(child_id,day));
      CREATE TABLE IF NOT EXISTS activity_streams(child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,stream_id TEXT NOT NULL,story_id TEXT NOT NULL,last_at INTEGER NOT NULL,PRIMARY KEY(child_id,stream_id));
      CREATE TABLE IF NOT EXISTS activity_log(id INTEGER PRIMARY KEY,child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,type TEXT NOT NULL,story_id TEXT NOT NULL,page INTEGER,score INTEGER,total INTEGER,created_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS activity_child_date ON activity_log(child_id,created_at);
      PRAGMA user_version=2;
    `);
  });
  function parentState(token) {
    const current = authenticated(token);
    const user = get(
      "SELECT pin_hash,password_enabled FROM users WHERE id=?",
      current.user_id,
    );
    return {
      unlocked: current.parent_until > clock(),
      pinSet: !!user.pin_hash,
      canUsePassword: !!user.password_enabled,
      googleLinked: !!get(
        "SELECT 1 FROM identities WHERE user_id=? AND provider='google'",
        current.user_id,
      ),
    };
  }
  function requireParent(token) {
    const current = authenticated(token);
    if (current.parent_until <= clock())
      throw new ApiError(
        403,
        "Ota-onalar bo‘limini kod yoki parol bilan oching.",
        "parent_locked",
      );
    return current;
  }
  function unlockSession(token) {
    run(
      "UPDATE sessions SET parent_until=? WHERE token_hash=?",
      clock() + 30 * 60000,
      digest(token),
    );
    return parentState(token);
  }
  function logEvent(childId, event, time) {
    if (event.type === "theme") return;
    let score = null,
      total = null;
    if (event.type === "quiz") {
      const q = get(
        "SELECT score,total FROM quizzes WHERE child_id=? AND quiz_id=?",
        childId,
        event.quizId,
      );
      // Log this attempt, rather than the retained best score.
      score = event.attemptScore;
      total = q.total;
    }
    run("UPDATE children SET last_active_at=? WHERE id=?", time, childId);
    const day = dayKey(Date.parse(time));
    const reading = Number(event.type === "reading"),
      quiz = Number(event.type === "quiz");
    run(
      "INSERT INTO activity_daily(child_id,day,reading_events,quiz_attempts) VALUES(?,?,?,?) ON CONFLICT(child_id,day) DO UPDATE SET reading_events=reading_events+excluded.reading_events,quiz_attempts=quiz_attempts+excluded.quiz_attempts",
      childId,
      day,
      reading,
      quiz,
    );
    run(
      "INSERT INTO activity_log(child_id,type,story_id,page,score,total,created_at) VALUES(?,?,?,?,?,?,?)",
      childId,
      event.type === "quiz" ? "quiz" : event.complete ? "completed" : "reading",
      event.storyId ?? event.quizId,
      event.page ?? null,
      score,
      total,
      time,
    );
  }
  return {
    parentState,
    requireParent,
    unlockSession,
    logEvent,
    async unlockParent(token, body) {
      keys(body, ["method", "secret"]);
      const current = authenticated(token);
      rate("parent-unlock", current.user_id, 5, 15 * 60000);
      requireValue(
        ["pin", "password"].includes(body.method) &&
          typeof body.secret === "string" &&
          body.secret.length <= 128,
        "Kod yoki parolni kiriting.",
      );
      const user = get("SELECT * FROM users WHERE id=?", current.user_id);
      const hash =
        body.method === "pin"
          ? user.pin_hash
          : user.password_enabled
            ? user.password_hash
            : null;
      const validFormat = body.method !== "pin" || /^\d{6}$/.test(body.secret);
      if (!hash || !validFormat || !(await passwordMatches(body.secret, hash)))
        throw new ApiError(
          403,
          "Kod yoki parol noto‘g‘ri.",
          "invalid_parent_secret",
        );
      run(
        "DELETE FROM rate_limits WHERE bucket=?",
        digest(`parent-unlock:${current.user_id}`),
      );
      return unlockSession(token);
    },
    lockParent(token) {
      authenticated(token);
      run(
        "UPDATE sessions SET parent_until=0 WHERE token_hash=?",
        digest(token),
      );
      return parentState(token);
    },
    async setParentPin(token, body) {
      keys(body, ["pin"]);
      const current = requireParent(token);
      requireValue(
        typeof body.pin === "string" && /^\d{6}$/.test(body.pin),
        "Kod aynan 6 ta raqamdan iborat bo‘lsin.",
      );
      const hash = await passwordHash(body.pin);
      // Parent permission may expire while a slow request is in flight.
      requireParent(token);
      atomic(() => {
        run("UPDATE users SET pin_hash=? WHERE id=?", hash, current.user_id);
        run(
          "UPDATE sessions SET parent_until=0 WHERE user_id=? AND token_hash<>?",
          current.user_id,
          current.token_hash,
        );
      });
      return parentState(token);
    },
    familySummary(token) {
      const current = requireParent(token),
        today = dayKey(clock());
      const days = Array.from({ length: 7 }, (_, i) =>
        dayKey(clock() - (6 - i) * 86400000),
      );
      const children = all(
        "SELECT * FROM children WHERE user_id=? ORDER BY created_at,id",
        current.user_id,
      ).map((row) => {
        const result = progress(token, row.id).progress;
        const records = all(
          "SELECT * FROM activity_daily WHERE child_id=? ORDER BY day",
          row.id,
        );
        const week = days.map((date) => {
          const entry = records.find((r) => r.day === date);
          return {
            date,
            seconds: Math.floor((entry?.active_ms ?? 0) / 1000),
            readingEvents: entry?.reading_events ?? 0,
            quizAttempts: entry?.quiz_attempts ?? 0,
          };
        });
        const quizzes = Object.values(result.quizzes),
          total = quizzes.reduce((sum, q) => sum + q.total, 0);
        return {
          profile: publicChild(row),
          progress: result,
          metrics: {
            started: Object.keys(result.reading).length,
            completed: Object.values(result.reading).filter(
              (r) => r.completedAt,
            ).length,
            quizAttempts: quizzes.reduce((sum, q) => sum + q.attempts, 0),
            accuracy: total
              ? Math.round(
                  (quizzes.reduce((sum, q) => sum + q.score, 0) / total) * 100,
                )
              : null,
            todaySeconds: week.find((d) => d.date === today).seconds,
            weekSeconds: week.reduce((sum, d) => sum + d.seconds, 0),
            totalSeconds: Math.floor(
              records.reduce((sum, d) => sum + d.active_ms, 0) / 1000,
            ),
            lastActiveAt: row.last_active_at,
          },
          week,
          recent: all(
            "SELECT type,story_id AS storyId,page,score,total,created_at AS at FROM activity_log WHERE child_id=? ORDER BY id DESC LIMIT 12",
            row.id,
          ),
        };
      });
      return { generatedAt: new Date(clock()).toISOString(), children };
    },
    activity(token, id, body) {
      const { child } = owned(token, id);
      keys(body, ["streamId", "storyId", "phase"]);
      requireValue(
        typeof body.streamId === "string" &&
          /^[a-f0-9]{32}$/.test(body.streamId) &&
          !!storyById(body.storyId) &&
          ["start", "pulse", "stop"].includes(body.phase),
        "Faollik so‘rovi noto‘g‘ri.",
      );
      return atomic(() => {
        const time = clock(),
          stream = get(
            "SELECT * FROM activity_streams WHERE child_id=? AND stream_id=?",
            id,
            body.streamId,
          );
        let credited = 0;
        if (
          body.phase !== "start" &&
          stream?.story_id === body.storyId &&
          time >= stream.last_at &&
          time - stream.last_at <= 45000
        ) {
          let cursor = Math.max(stream.last_at, child.last_credit_ms);
          while (cursor < time) {
            const local = new Date(cursor + 5 * 3600000);
            const nextDay =
              Date.UTC(
                local.getUTCFullYear(),
                local.getUTCMonth(),
                local.getUTCDate() + 1,
              ) -
              5 * 3600000;
            const end = Math.min(time, nextDay),
              ms = end - cursor;
            run(
              "INSERT INTO activity_daily(child_id,day,active_ms) VALUES(?,?,?) ON CONFLICT(child_id,day) DO UPDATE SET active_ms=active_ms+excluded.active_ms",
              id,
              dayKey(cursor),
              ms,
            );
            credited += ms;
            cursor = end;
          }
          if (credited)
            run("UPDATE children SET last_credit_ms=? WHERE id=?", time, id);
        }
        run("DELETE FROM activity_streams WHERE last_at<?", time - 120000);
        if (body.phase === "stop")
          run(
            "DELETE FROM activity_streams WHERE child_id=? AND stream_id=?",
            id,
            body.streamId,
          );
        else {
          // Bound stale/background streams per child, even if a modified client invents IDs.
          if (
            !stream &&
            get(
              "SELECT COUNT(*) count FROM activity_streams WHERE child_id=?",
              id,
            ).count >= 12
          )
            throw new ApiError(429, "Faollik oynalari ko‘payib ketdi.");
          run(
            "INSERT INTO activity_streams VALUES(?,?,?,?) ON CONFLICT(child_id,stream_id) DO UPDATE SET story_id=excluded.story_id,last_at=excluded.last_at",
            id,
            body.streamId,
            body.storyId,
            time,
          );
        }
        run(
          "UPDATE children SET last_active_at=? WHERE id=?",
          new Date(time).toISOString(),
          id,
        );
        return { ok: true, creditedSeconds: Math.floor(credited / 1000) };
      });
    },
    googleChallenge() {
      const nonce = randomBytes(32).toString("base64url");
      run("DELETE FROM google_challenges WHERE expires_at<=?", clock());
      run(
        "INSERT INTO google_challenges VALUES(?,?)",
        digest(nonce),
        clock() + 10 * 60000,
      );
      return nonce;
    },
    googleRate(ip) {
      rate("google-login", ip, 20, 15 * 60000);
    },
    googleLogin(token, claims, nonce, link = false) {
      return atomic(() => {
        const challenge = get(
          "SELECT * FROM google_challenges WHERE hash=? AND expires_at>?",
          digest(nonce),
          clock(),
        );
        if (!challenge)
          throw new ApiError(
            400,
            "Google kirishini qayta boshlang.",
            "invalid_nonce",
          );
        run("DELETE FROM google_challenges WHERE hash=?", digest(nonce));
        let identity = get(
          "SELECT user_id FROM identities WHERE provider='google' AND subject=?",
          claims.sub,
        );
        if (link) {
          const current = requireParent(token);
          requireValue(
            current.email === claims.email.toLowerCase(),
            "Google e-maili akkaunt e-mailiga mos bo‘lsin.",
          );
          if (identity && identity.user_id !== current.user_id)
            throw new ApiError(409, "Google akkaunti boshqa profilga ulangan.");
          if (!identity)
            run(
              "INSERT INTO identities VALUES('google',?,?)",
              claims.sub,
              current.user_id,
            );
          return { linked: true };
        }
        if (!identity) {
          if (
            get(
              "SELECT id FROM users WHERE email=?",
              claims.email.toLowerCase(),
            )
          )
            throw new ApiError(
              409,
              "Bu e-mail bilan akkaunt bor. Parol bilan kiring va sozlamalarda Google’ni ulang.",
              "google_link_required",
            );
          const id = randomUUID();
          // Google-only accounts have no password login; this marker is never accepted as a password.
          run(
            "INSERT INTO users(id,email,password_hash,created_at,password_enabled) VALUES(?,?,?,?,0)",
            id,
            claims.email.toLowerCase(),
            "disabled",
            new Date(clock()).toISOString(),
          );
          run("INSERT INTO identities VALUES('google',?,?)", claims.sub, id);
          identity = { user_id: id };
        }
        return issueSession(identity.user_id);
      });
    },
    googleLinked(token) {
      const current = requireParent(token);
      return !!get(
        "SELECT 1 FROM identities WHERE user_id=? AND provider='google'",
        current.user_id,
      );
    },
    sessionView,
  };
}
