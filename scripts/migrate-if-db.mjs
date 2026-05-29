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
loadEnvVar("POSTGRES_PRISMA_URL");
loadEnvVar("POSTGRES_URL");
loadEnvVar("POSTGRES_URL_NON_POOLING");

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    "";
}

if (!process.env.DIRECT_URL?.trim() && process.env.DATABASE_URL?.trim()) {
  try {
    const normalized = process.env.DATABASE_URL.replace(/^postgresql:/i, "postgres:");
    const url = new URL(normalized);
    if (url.port === "6543") url.port = "5432";
    url.searchParams.delete("pgbouncer");
    process.env.DIRECT_URL = url.toString().replace(/^postgres:/i, "postgresql:");
  } catch {
    process.env.DIRECT_URL =
      process.env.POSTGRES_URL_NON_POOLING?.trim() || "";
  }
} else if (!process.env.DIRECT_URL?.trim()) {
  process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING?.trim() || "";
}

if (!process.env.DATABASE_URL) {
  console.log("Skipping prisma migrate deploy: DATABASE_URL is not set.");
  process.exit(0);
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
