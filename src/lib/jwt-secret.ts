const MIN_LENGTH = 32;

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set and at least ${MIN_LENGTH} characters. Generate one with: openssl rand -base64 32`
    );
  }
  return new TextEncoder().encode(secret);
}
