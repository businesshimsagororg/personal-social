"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { CheckCircle2, Globe, MapPin, ShieldAlert, Sparkles, User } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [privacySetting, setPrivacySetting] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          
          const profile = data.user.profile || {};
          setDisplayName(profile.displayName || "");
          setBio(profile.bio || "");
          setLocation(profile.location || "");
          setWebsite(profile.website || "");
          setAvatarUrl(profile.avatarUrl || "");
          setPrivacySetting(profile.privacySetting || "PUBLIC");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch(`/api/users/${currentUser.username}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          location,
          website: website || null,
          avatarUrl: avatarUrl || null,
          privacySetting,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess("Profile settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-muted rounded" />
          <div className="h-40 w-full bg-muted rounded-3xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Profile Settings</h1>
            <p className="text-xs text-muted-foreground">Customize your profile card and privacy settings</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl p-6 md:p-8 border border-border/80 shadow-xl relative overflow-hidden">
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-fade-in">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or similar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Bio Description
              </label>
              <textarea
                rows={3}
                maxLength={160}
                placeholder="Write a short summary about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="block w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none leading-relaxed"
              />
              <p className="mt-1.5 text-right text-xs text-muted-foreground">
                {bio.length}/160 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Globe className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Account Privacy Boundary</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setPrivacySetting("PUBLIC")}
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition ${
                    privacySetting === "PUBLIC"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background/30 text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <span className="font-bold text-xs text-foreground">Public Feed</span>
                  <span className="text-[10px] mt-1">Anyone inside the closed community can read your profile, posts, and follows.</span>
                </div>

                <div
                  onClick={() => setPrivacySetting("FOLLOWERS")}
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition ${
                    privacySetting === "FOLLOWERS"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background/30 text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <span className="font-bold text-xs text-foreground">Followers Only</span>
                  <span className="text-[10px] mt-1">Only approved followers can view your posts and media feed. Follow requests require your approval.</span>
                </div>

                <div
                  onClick={() => setPrivacySetting("PRIVATE")}
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition ${
                    privacySetting === "PRIVATE"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background/30 text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <span className="font-bold text-xs text-foreground">Private Profile</span>
                  <span className="text-[10px] mt-1">Only you can view your profile contents and posts list. Standard lock display for others.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition shadow-[0_4px_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
