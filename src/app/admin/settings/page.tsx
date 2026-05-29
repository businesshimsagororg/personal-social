import AdminLayout from "@/app/admin/layout";
import { requiresAdminApproval, shouldSkipEmailVerification, isMockEmail } from "@/lib/app-url";

export default function AdminSettingsPage() {
  const flags = {
    requireAdminApproval: requiresAdminApproval(),
    skipEmailVerification: shouldSkipEmailVerification(),
    mockEmail: isMockEmail(),
    hasPusher: Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER),
    hasRedis: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-bold">Platform settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Runtime flags (configure via environment variables on the server)
          </p>
        </div>
        <ul className="glass rounded-xl border border-border divide-y divide-border text-sm">
          <li className="flex justify-between p-4">
            <span>Require admin approval</span>
            <span className="font-semibold">{flags.requireAdminApproval ? "On" : "Off"}</span>
          </li>
          <li className="flex justify-between p-4">
            <span>Skip email verification</span>
            <span className="font-semibold">{flags.skipEmailVerification ? "Yes" : "No"}</span>
          </li>
          <li className="flex justify-between p-4">
            <span>Mock email (no SMTP)</span>
            <span className="font-semibold">{flags.mockEmail ? "Yes" : "No"}</span>
          </li>
          <li className="flex justify-between p-4">
            <span>Pusher realtime</span>
            <span className="font-semibold">{flags.hasPusher ? "Configured" : "Not configured"}</span>
          </li>
          <li className="flex justify-between p-4">
            <span>Upstash Redis rate limit</span>
            <span className="font-semibold">{flags.hasRedis ? "Configured" : "In-memory fallback"}</span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Set REQUIRE_ADMIN_APPROVAL=true to require manual approval on signup. Use the Users tab to
          approve pending accounts.
        </p>
      </div>
    </AdminLayout>
  );
}
