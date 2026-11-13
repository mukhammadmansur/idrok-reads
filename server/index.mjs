import { resolve } from "node:path";
import { createApp } from "./app.mjs";
process.umask(0o077);
const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("API_PORT noto‘g‘ri.");
const host = process.env.HOST ?? "127.0.0.1";
const registerLimit = Number(process.env.WBOOKS_REGISTER_LIMIT ?? 10);
if (
  !Number.isInteger(registerLimit) ||
  registerLimit < 1 ||
  registerLimit > 1000
)
  throw new Error("WBOOKS_REGISTER_LIMIT noto‘g‘ri.");
const app = createApp({
  storeOptions: { registerLimit },
  databasePath: process.env.WBOOKS_DB_PATH ?? resolve("data/wbooks.db"),
  googleOptions: { clientId: process.env.GOOGLE_CLIENT_ID ?? "" },
  secureCookies:
    process.env.WBOOKS_COOKIE_SECURE === "1" ||
    process.env.NODE_ENV === "production",
});
app.server.listen(port, host, () =>
  console.log(`WBooks API: http://${host}:${port}`),
);
let closing = false;
const close = async () => {
  if (closing) return;
  closing = true;
  try {
    await app.close();
    process.exitCode = 0;
  } catch {
    process.exitCode = 1;
  }
};
process.on("SIGTERM", close);
process.on("SIGINT", close);
