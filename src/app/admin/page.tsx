"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/app/admin/layout";
import StatCard from "@/components/admin/StatCard";
import {
  Activity,
  FileText,
  Heart,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";

interface DashboardStats {
  totals: {
    users: number;
    pendingApproval: number;
    activeUsers: number;
    suspendedOrBanned: number;
    admins: number;
    moderators: number;
    pendingReports: number;
    totalReports: number;
    unusedInvites: number;
    usedInvites: number;
    newUsersThisWeek: number;
    newUsersToday: number;
    posts: number;
    postsToday: number;
    comments: number;
    messages: number;
    conversations: number;
    notifications: number;
    likes: number;
  };
  recentPendingUsers: {
    id: string;
    username: string;
    email: string;
    displayName?: string | null;
    createdAt: string;
  }[];
  recentUsers: {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    displayName?: string | null;
    createdAt: string;
  }[];
  recentReports: {
    id: string;
    targetType: string;
    reason: string;
    status: string;
    reporterUsername: string;
    createdAt: string;
  }[];
  recentPosts: {
    id: string;
    content: string;
    visibility: string;
    authorUsername: string;
    authorDisplayName?: string | null;
    commentCount: number;
    likeCount: number;
    createdAt: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    username: string | null;
    ipAddress: string | null;
    createdAt: string;
  }[];
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    PENDING_APPROVAL: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    SUSPENDED: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    BANNED: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span
      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
        styles[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load dashboard");
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <LayoutDashboard className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Admin overview</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Members, content, moderation, and platform activity in one place
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/users?filter=PENDING_APPROVAL"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              <Users className="h-4 w-4" />
              Manage users
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted/50"
            >
              <ShieldAlert className="h-4 w-4" />
              Reports
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : data ? (
          <>
            <section>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Action needed
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Pending approval"
                  value={data.totals.pendingApproval}
                  hint="Approve in Users"
                  href="/admin/users"
                  accent="amber"
                />
                <StatCard
                  label="Open reports"
                  value={data.totals.pendingReports}
                  href="/admin/reports"
                  accent="destructive"
                />
                <StatCard
                  label="Unused invites"
                  value={data.totals.unusedInvites}
                  href="/admin/invites"
                />
                <StatCard
                  label="Suspended / banned"
                  value={data.totals.suspendedOrBanned}
                  href="/admin/users"
                  accent="destructive"
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Platform totals
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Members" value={data.totals.users} hint={`${data.totals.activeUsers} active`} href="/admin/users" accent="emerald" />
                <StatCard label="Posts" value={data.totals.posts} hint={`+${data.totals.postsToday} today`} href="/admin/posts" />
                <StatCard label="Comments" value={data.totals.comments} />
                <StatCard label="Messages" value={data.totals.messages} hint={`${data.totals.conversations} chats`} accent="sky" />
                <StatCard label="Likes" value={data.totals.likes} accent="destructive" />
                <StatCard label="Notifications" value={data.totals.notifications} />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Growth (7 days)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="New members" value={data.totals.newUsersThisWeek} hint={`+${data.totals.newUsersToday} today`} accent="emerald" />
                <StatCard label="New posts" value={data.totals.postsToday} hint="Last 24h" />
                <StatCard label="Admins" value={data.totals.admins} />
                <StatCard label="Moderators" value={data.totals.moderators} />
              </div>
            </section>

            <div className="grid xl:grid-cols-2 gap-6">
              <section className="glass rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Recent members
                  </h2>
                  <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="pb-2 font-semibold">User</th>
                        <th className="pb-2 font-semibold">Role</th>
                        <th className="pb-2 font-semibold">Status</th>
                        <th className="pb-2 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border/40 last:border-0">
                          <td className="py-2.5">
                            <p className="font-medium">{u.displayName || u.username}</p>
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          </td>
                          <td className="py-2.5 text-xs">{u.role}</td>
                          <td className="py-2.5">{statusBadge(u.status)}</td>
                          <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="glass rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-sky-500" />
                    Recent posts
                  </h2>
                  <Link href="/admin/posts" className="text-xs font-semibold text-primary hover:underline">
                    View all
                  </Link>
                </div>
                {data.recentPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No posts yet.</p>
                ) : (
                  <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {data.recentPosts.map((p) => (
                      <li key={p.id} className="text-sm border-b border-border/40 pb-3 last:border-0">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          @{p.authorUsername} · {p.visibility} ·{" "}
                          <Heart className="inline h-3 w-3" /> {p.likeCount} ·{" "}
                          <MessageSquare className="inline h-3 w-3" /> {p.commentCount}
                        </p>
                        <p className="line-clamp-2">{p.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <section className="glass rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    Open reports
                  </h2>
                  <Link href="/admin/reports" className="text-xs font-semibold text-primary hover:underline">
                    Review
                  </Link>
                </div>
                {data.recentReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open reports.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.recentReports.map((r) => (
                      <li key={r.id} className="text-sm border-b border-border/40 pb-3 last:border-0">
                        <p className="font-medium">
                          {r.targetType}: {r.reason.slice(0, 80)}
                          {r.reason.length > 80 ? "…" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{r.reporterUsername} · {r.status}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="glass rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Activity log
                  </h2>
                  <Link href="/admin/activity" className="text-xs font-semibold text-primary hover:underline">
                    Full log
                  </Link>
                </div>
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
                    {data.recentActivity.map((a) => (
                      <li key={a.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
                        <span className="text-foreground">{a.action}</span>
                        {a.username && <span>@{a.username}</span>}
                        <span>{new Date(a.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {data.recentPendingUsers.length > 0 && (
              <section className="glass rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                <h2 className="font-bold flex items-center gap-2 text-amber-500 mb-3">
                  <UserPlus className="h-5 w-5" />
                  Waiting for approval
                </h2>
                <ul className="space-y-2">
                  {data.recentPendingUsers.map((u) => (
                    <li key={u.id} className="flex justify-between text-sm">
                      <span>
                        {u.displayName || u.username} (@{u.username}) — {u.email}
                      </span>
                      <Link href="/admin/users" className="text-primary font-semibold text-xs">
                        Approve →
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
