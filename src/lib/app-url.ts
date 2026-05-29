/** Canonical app URL for emails and OAuth redirects. */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function isMockEmail(): boolean {
  return process.env.USE_MOCK_EMAIL === "true" || !process.env.SMTP_HOST;
}

export function shouldSkipEmailVerification(): boolean {
  return process.env.SKIP_EMAIL_VERIFICATION === "true" || isMockEmail();
}

export function requiresAdminApproval(): boolean {
  return process.env.REQUIRE_ADMIN_APPROVAL === "true";
}
