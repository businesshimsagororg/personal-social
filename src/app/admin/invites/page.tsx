"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/admin/layout";
import { Copy, Loader2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";

interface Invite {
  id: string;
  code: string;
  status: string;
  maxUses: number;
  useCount: number;
  expiresAt: string | null;
  createdAt: string;
  createdByUsername: string;
  usedByUsername: string | null;
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [expiresDays, setExpiresDays] = useState(7);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invites");
      if (res.ok) setInvites(await res.json());
    } catch {
      toast.error("Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: customCode.trim() || undefined,
          maxUses,
          expiresDays: expiresDays > 0 ? expiresDays : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invite");
      toast.success(`Invite created: ${data.code}`);
      setCustomCode("");
      fetchInvites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Invite codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate codes for instant member access
          </p>
        </div>

        <form onSubmit={createInvite} className="glass p-4 rounded-xl border border-border space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Custom code (optional)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              className="px-3 py-2 rounded-lg border border-border bg-background/50 text-sm"
            />
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
              className="px-3 py-2 rounded-lg border border-border bg-background/50 text-sm"
              title="Max uses"
            />
            <input
              type="number"
              min={1}
              value={expiresDays}
              onChange={(e) => setExpiresDays(parseInt(e.target.value) || 7)}
              className="px-3 py-2 rounded-lg border border-border bg-background/50 text-sm"
              title="Expires in days"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create invite
          </button>
        </form>

        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        ) : (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="glass p-4 rounded-xl border border-border flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-mono font-bold text-primary">{inv.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.status} · {inv.useCount}/{inv.maxUses} uses
                    {inv.expiresAt && ` · expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                    {inv.usedByUsername && ` · used by @${inv.usedByUsername}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCode(inv.code)}
                  className="p-2 rounded-lg hover:bg-muted border border-border"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
