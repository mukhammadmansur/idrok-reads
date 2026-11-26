import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, rmSync } from "node:fs";

const apiPort = process.env.API_PORT ?? "3001";
const dbPath = process.env.WBOOKS_DB_PATH
  ? resolve(process.env.WBOOKS_DB_PATH)
  : resolve("django/db.sqlite3");
const djangoDir = resolve("django");
const python =
  process.platform === "win32"
    ? resolve("django/.venv/Scripts/python.exe")
    : resolve("django/.venv/bin/python");

if (process.env.WBOOKS_FRESH_DB === "1") {
  for (const path of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (existsSync(path)) rmSync(path);
  }
}

const apiEnv = { ...process.env, WBOOKS_DB_PATH: dbPath };

function run(args) {
  return new Promise((resolveRun) => {
    const child = spawn(python, args, {
      cwd: djangoDir,
      stdio: "inherit",
      env: apiEnv,
    });
    child.on("error", (error) => {
      console.error(error.message);
      resolveRun(1);
    });
    child.on("exit", (code) => resolveRun(code ?? 1));
  });
}

const migrate = await run(["manage.py", "migrate", "--noinput"]);
if (migrate !== 0) {
  console.error("migrate failed");
  process.exit(1);
}

const api = spawn(
  python,
  ["manage.py", "runserver", `127.0.0.1:${apiPort}`, "--noreload"],
  { cwd: djangoDir, stdio: "inherit", env: apiEnv },
);

let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  process.exitCode = code;
  api.kill("SIGTERM");
}
api.on("error", (error) => {
  console.error(error.message);
  stop(1);
});
api.on("exit", (code) => {
  if (!closing) stop(code ?? 1);
});
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
