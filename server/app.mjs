import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createStore, ApiError } from "./store.mjs";

const cookieName = "wbooks_session";
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};
function tokenFrom(req) {
  const raw = req.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(cookieName + "="));
  return raw?.slice(cookieName.length + 1) ?? null;
}
async function jsonBody(req) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw new ApiError(415, "JSON so‘rov kerak.");
  let size = 0;
  const parts = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32768) throw new ApiError(413, "So‘rov juda katta.");
    parts.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString("utf8"));
  } catch {
    throw new ApiError(400, "So‘rov formati noto‘g‘ri.");
  }
}
function writeCheck(req) {
  let origin;
  try {
    origin = new URL(req.headers.origin ?? "");
  } catch {
    throw new ApiError(403, "So‘rov manzili tasdiqlanmadi.", "origin_rejected");
  }
  if (
    origin.host !== req.headers.host ||
    req.headers["x-wbooks-client"] !== "web" ||
    req.headers["sec-fetch-site"] === "cross-site"
  )
    throw new ApiError(403, "So‘rov manzili tasdiqlanmadi.", "origin_rejected");
}
export function createApp({
  databasePath,
  secureCookies = false,
  distPath = resolve("dist"),
  storeOptions = {},
}) {
  const store = createStore(databasePath, storeOptions);
  const server = createServer(async (req, res) => {
    let url;
    try {
      url = new URL(req.url ?? "/", "http://localhost");
    } catch {
      res.writeHead(400);
      res.end("Invalid request URL");
      return;
    }
    const api = url.pathname.startsWith("/api/");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    const json = (status, body) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(body));
    };
    const setCookie = (token, maxAge) =>
      res.setHeader(
        "Set-Cookie",
        `${cookieName}=${token}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookies ? "; Secure" : ""}`,
      );
    try {
      if (api) {
        const token = tokenFrom(req),
          method = req.method ?? "GET";
        if (method === "GET" && url.pathname === "/api/health")
          return json(200, { ok: true });
        if (method === "GET" && url.pathname === "/api/session")
          return json(200, store.sessionView(token));
        if (!["GET", "HEAD"].includes(method)) writeCheck(req);
        if (
          method === "POST" &&
          ["/api/auth/register", "/api/auth/login"].includes(url.pathname)
        ) {
          const body = await jsonBody(req);
          const result = await store[
            url.pathname.endsWith("register") ? "register" : "login"
          ](body, req.socket.remoteAddress ?? "unknown");
          const { token: sessionToken, ...view } = result;
          setCookie(sessionToken, store.sessionDays * 86400);
          return json(200, view);
        }
        if (method === "POST" && url.pathname === "/api/auth/logout") {
          await jsonBody(req);
          store.logout(token);
          setCookie("", 0);
          return json(200, { ok: true });
        }
        if (method === "POST" && url.pathname === "/api/children")
          return json(201, store.createChild(token, await jsonBody(req)));
        const match = url.pathname.match(
          /^\/api\/children\/([a-f0-9-]{36})\/(progress|events|select)$/,
        );
        if (match) {
          const [, id, action] = match;
          if (method === "GET" && action === "progress")
            return json(200, store.progress(token, id));
          if (method === "POST" && action === "select") {
            await jsonBody(req);
            return json(200, store.selectChild(token, id));
          }
          if (method === "POST" && action === "events")
            return json(200, store.applyEvents(token, id, await jsonBody(req)));
        }
        throw new ApiError(404, "Manzil topilmadi.", "not_found");
      }
      if (req.method !== "GET" && req.method !== "HEAD")
        throw new ApiError(405, "Bu amal mavjud emas.");
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        throw new ApiError(400, "Manzil noto‘g‘ri.");
      }
      if (
        pathname.split("/").some((part) => part.startsWith(".")) ||
        pathname.includes("\\")
      )
        throw new ApiError(404, "Fayl topilmadi.");
      const root = resolve(distPath),
        path = resolve(root, "." + pathname);
      if (path !== root && !path.startsWith(root + sep))
        throw new ApiError(404, "Fayl topilmadi.");
      let file = path;
      try {
        if (!(await stat(file)).isFile()) file = resolve(root, "index.html");
      } catch {
        if (!extname(pathname) && req.headers.accept?.includes("text/html"))
          file = resolve(root, "index.html");
        else throw new ApiError(404, "Fayl topilmadi.");
      }
      let bytes;
      try {
        bytes = await readFile(file);
      } catch {
        throw new ApiError(
          404,
          "Frontend build tayyor emas. Avval npm run build.",
        );
      }
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; frame-src https://www.youtube-nocookie.com; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      );
      res.writeHead(200, {
        "Content-Type":
          contentTypes[extname(file)] ?? "application/octet-stream",
        "Cache-Control": pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      if (error instanceof ApiError) {
        if (error.retryAfter)
          res.setHeader("Retry-After", String(error.retryAfter));
        json(error.status, { error: error.message, code: error.code });
      } else {
        console.error("API request failed:", error.code ?? error.name);
        json(500, {
          error: "Serverda xatolik. Qayta urinib ko‘ring.",
          code: "server_error",
        });
      }
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return {
    server,
    store,
    async close() {
      await new Promise((resolveClose, reject) =>
        server.close((error) => (error ? reject(error) : resolveClose())),
      );
      store.close();
    },
  };
}
