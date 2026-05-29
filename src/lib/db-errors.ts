const PLACEHOLDER_MARKERS = [
  "[YOUR-PASSWORD]",
  "[PROJECT-REF]",
  "[REGION]",
  "USER:PASSWORD@HOST",
];

function hasPlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return PLACEHOLDER_MARKERS.some((marker) => value.includes(marker));
}

/** Returns a user-facing message when .env database URLs are missing or still templated. */
export function getDatabaseConfigError(): string | null {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (hasPlaceholder(databaseUrl) || hasPlaceholder(directUrl)) {
    return (
      "Database is not configured yet. Open .env and paste your Supabase connection strings " +
      "(Project Settings → Database → Connection string → URI). Replace [YOUR-PASSWORD] with your database password, then run: npx prisma migrate deploy"
    );
  }

  return null;
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; name?: string; message?: string };
  return (
    e.code === "P1001" ||
    e.code === "P1013" ||
    e.name === "PrismaClientInitializationError" ||
    (typeof e.message === "string" &&
      (e.message.includes("Can't reach database server") ||
        e.message.includes("invalid domain character in database URL")))
  );
}

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Cannot connect to the database. Check DATABASE_URL and DIRECT_URL in .env (Supabase: Project Settings → Database), then run: npx prisma migrate deploy";

export function databaseErrorResponse() {
  return getDatabaseConfigError() ?? DATABASE_UNAVAILABLE_MESSAGE;
}
