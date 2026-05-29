const PLACEHOLDER_MARKERS = [
  "[YOUR-PASSWORD]",
  "[PASSWORD]",
  "[PROJECT-REF]",
  "[REGION]",
  "YOUR_DB_PASSWORD",
  "USER:PASSWORD@HOST",
  "postgres.[PROJECT-REF]",
];

function hasPlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return PLACEHOLDER_MARKERS.some((marker) => value.includes(marker));
}

/** Returns a user-facing message when database URLs are missing or still templated. */
export function getDatabaseConfigError(): string | null {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (hasPlaceholder(databaseUrl) || hasPlaceholder(directUrl)) {
    const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    if (isProduction) {
      return (
        "Database is not configured on the server. In Vercel → Project Settings → Environment Variables, " +
        "add DATABASE_URL and DIRECT_URL (Supabase pooler URLs), then redeploy."
      );
    }
    return (
      "Database is not configured yet. Add Supabase DATABASE_URL and DIRECT_URL to .env " +
      "(Project Settings → Database → Connection string), then run: npx prisma migrate deploy"
    );
  }

  return null;
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; name?: string; message?: string };
  const message = typeof e.message === "string" ? e.message : "";
  return (
    e.code === "P1000" ||
    e.code === "P1001" ||
    e.code === "P1013" ||
    e.name === "PrismaClientInitializationError" ||
    message.includes("Can't reach database server") ||
    message.includes("invalid domain character in database URL") ||
    message.includes("Tenant or user not found") ||
    message.includes("tenant/user") ||
    message.includes("ENOTFOUND") ||
    message.includes("Authentication failed") ||
    message.includes("password authentication failed")
  );
}

export function isPrismaSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code: string }).code) : "";
  return code === "P2021" || code === "P2022";
}

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Cannot connect to the database. Check DATABASE_URL and DIRECT_URL (Supabase pooler host must match your project, e.g. aws-1-ap-northeast-1).";

export function databaseErrorResponse() {
  return getDatabaseConfigError() ?? DATABASE_UNAVAILABLE_MESSAGE;
}

/** Map Prisma and auth errors to a safe user-facing login/signup message. */
export function getAuthErrorMessage(error: unknown): string {
  if (getDatabaseConfigError()) return getDatabaseConfigError()!;
  if (isPrismaConnectionError(error)) return databaseErrorResponse();
  if (isPrismaSchemaError(error)) {
    return "Database tables are missing or out of date. Run: npx prisma migrate deploy";
  }

  if (error instanceof Error) {
    if (error.message.includes("Illegal arguments")) {
      return "This account uses Google sign-in. Sign in with Google or reset your password.";
    }
  }

  return "Something went wrong. Please try again.";
}
