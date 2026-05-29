/** Normalize DATABASE_URL / DIRECT_URL from common Vercel & Supabase integration names. */
export function resolveDatabaseEnv(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL =
      process.env.POSTGRES_PRISMA_URL?.trim() ||
      process.env.POSTGRES_URL?.trim() ||
      process.env.SUPABASE_DATABASE_URL?.trim() ||
      "";
  }

  if (!process.env.DIRECT_URL?.trim()) {
    process.env.DIRECT_URL =
      process.env.POSTGRES_URL_NON_POOLING?.trim() ||
      process.env.POSTGRES_URL_UNPOOLED?.trim() ||
      deriveDirectUrlFromPooled(process.env.DATABASE_URL) ||
      "";
  }
}

function deriveDirectUrlFromPooled(pooled: string | undefined): string {
  if (!pooled?.trim()) return "";
  try {
    const normalized = pooled.replace(/^postgresql:/i, "postgres:");
    const url = new URL(normalized);
    if (url.port === "6543") url.port = "5432";
    url.searchParams.delete("pgbouncer");
    return url.toString().replace(/^postgres:/i, "postgresql:");
  } catch {
    return "";
  }
}
