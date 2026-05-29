"use client";

import React, { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/app/admin/layout";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface AuditEntry {
  id: string;
  action: string;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
  userId: string | null;
  username: string | null;
  email: string | null;
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "150" });
      if (actionFilter.trim()) params.set("action", actionFilter.trim());
      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error("Failed to load activity");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      toast.error("Could not load activity log");
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            Activity log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Logins, admin actions, and security events
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter by action (e.g. USER_LOGIN)"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm"
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity found.</p>
        ) : (
          <div className="glass rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground bg-muted/30 border-b border-border">
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                      <td className="px-4 py-3">
                        {l.username ? (
                          <span>
                            @{l.username}
                            {l.email && (
                              <span className="block text-xs text-muted-foreground">{l.email}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.ipAddress || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
