/** Parse JSON API responses safely; returns null when the body is HTML or empty. */
export async function parseApiJson(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function apiErrorMessage(
  data: Record<string, unknown> | null,
  fallback: string
): string {
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  return fallback;
}
