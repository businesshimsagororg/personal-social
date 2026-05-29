import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvVar(key) {
  if (process.env[key]) return;
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const envKey = trimmed.slice(0, eq).trim();
    if (envKey !== key) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
    break;
  }
}

loadEnvVar("DATABASE_URL");
loadEnvVar("DIRECT_URL");

if (!process.env.DATABASE_URL) {
  console.log("Skipping prisma migrate deploy: DATABASE_URL is not set.");
  process.exit(0);
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
