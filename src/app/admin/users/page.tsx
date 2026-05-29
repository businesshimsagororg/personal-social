"use client";

import React, { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/app/admin/layout";
import { Check, Loader2, UserCheck, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  profile?: { displayName?: string | null; avatarUrl?: string | null };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "BANNED"
  >("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?status=${filter}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        toast.error("Failed to load users");
      }
    } catch {
      toast.error("Error loading users");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`User ${status === "ACTIVE" ? "approved" : "updated"}`);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 w-full max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">User management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve new members, change roles, or manage account status
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING_APPROVAL", "ACTIVE", "SUSPENDED", "BANNED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {s === "ALL" ? "All users" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users in this category.</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="glass p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold">
                    {u.profile?.displayName || u.username}{" "}
                    <span className="text-muted-foreground font-normal">@{u.username}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined {new Date(u.createdAt).toLocaleDateString()} · {u.role} · {u.status} ·{" "}
                    {u.emailVerified ? "Email verified" : "Email pending"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.status === "PENDING_APPROVAL" && (
                    <button
                      type="button"
                      disabled={updatingId === u.id}
                      onClick={() => updateUser(u.id, "ACTIVE")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {updatingId === u.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      Approve
                    </button>
                  )}
                  {u.status === "ACTIVE" && (
                    <button
                      type="button"
                      disabled={updatingId === u.id}
                      onClick={() => updateUser(u.id, "SUSPENDED")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  )}
                  {(u.status === "ACTIVE" || u.status === "SUSPENDED") && (
                    <button
                      type="button"
                      disabled={updatingId === u.id}
                      onClick={() => updateUser(u.id, "BANNED")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Ban
                    </button>
                  )}
                  {(u.status === "SUSPENDED" || u.status === "BANNED") && (
                    <button
                      type="button"
                      disabled={updatingId === u.id}
                      onClick={() => updateUser(u.id, "ACTIVE")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Reinstate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
