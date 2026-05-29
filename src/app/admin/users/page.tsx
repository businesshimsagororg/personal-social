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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">User management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Approve new members, change roles, or manage account status
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/admin/export");
              if (res.ok) {
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `apex-users-${Date.now()}.json`;
                a.click();
                toast.success("Export downloaded");
              } else toast.error("Export failed");
            }}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shrink-0"
          >
            Export all users
          </button>
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
                  <button
                    type="button"
                    onClick={async () => {
                      const note = prompt("Moderator note for @" + u.username);
                      if (!note?.trim()) return;
                      const res = await fetch(`/api/admin/users/${u.id}/notes`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ note: note.trim() }),
                      });
                      if (res.ok) toast.success("Note saved");
                      else toast.error("Could not save note");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Add note
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
