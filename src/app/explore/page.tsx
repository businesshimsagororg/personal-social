"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/app-layout";
import { Compass, Hash, Loader2, Users } from "lucide-react";

export default function ExplorePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/explore")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Compass className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Explore</h1>
            <p className="text-sm text-muted-foreground">Discover people and topics</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4" /> Trending hashtags
              </h2>
              <div className="flex flex-wrap gap-2">
                {(data?.hashtags || []).map((h: { name: string; postCount: number }) => (
                  <Link
                    key={h.name}
                    href={`/hashtag/${h.name}`}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20 hover:bg-primary/20"
                  >
                    #{h.name} <span className="text-muted-foreground font-normal">({h.postCount})</span>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> New members
              </h2>
              <ul className="space-y-2">
                {(data?.suggestedUsers || []).map((u: any) => (
                  <li key={u.id}>
                    <Link
                      href={`/profile/${u.username}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30"
                    >
                      <span className="font-semibold">
                        {u.displayName || u.username}
                        <span className="text-muted-foreground font-normal text-sm"> @{u.username}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{u.followersCount} followers</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
