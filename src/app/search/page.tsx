"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppLayout from "@/components/layout/app-layout";
import { Search, User } from "lucide-react";

interface UserResult {
  id: string;
  username: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || []);
        }
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <Search className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Search</h1>
          <p className="text-xs text-muted-foreground">
            {query.trim() ? `Results for "${query}"` : "Enter a search term from the navigation bar"}
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No users found.</p>
      )}

      {!loading && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((user) => (
            <li key={user.id}>
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
                  {user.profile?.avatarUrl ? (
                    <Image
                      src={user.profile.avatarUrl}
                      alt={user.username}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {user.profile?.displayName || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="py-12 text-center text-muted-foreground text-sm">Loading search...</div>
        }
      >
        <SearchResults />
      </Suspense>
    </AppLayout>
  );
}
