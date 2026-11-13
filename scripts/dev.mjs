import { spawn } from "node:child_process";
import { resolve } from "node:path";
const children = [];
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  process.exitCode = code;
  for (const child of children) child.kill("SIGTERM");
}
for (const args of [
  ["server/index.mjs"],
  [
    resolve("node_modules/vite/bin/vite.js"),
    "--host",
    "0.0.0.0",
    ...process.argv.slice(2),
  ],
]) {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!closing) stop(code ?? 1);
  });
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
