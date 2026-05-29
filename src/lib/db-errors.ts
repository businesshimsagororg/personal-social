export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; name?: string; message?: string };
  return (
    e.code === "P1001" ||
    e.name === "PrismaClientInitializationError" ||
    (typeof e.message === "string" && e.message.includes("Can't reach database server"))
  );
}

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Cannot connect to the database. Start PostgreSQL (e.g. docker compose up -d) and check DATABASE_URL in .env.";
