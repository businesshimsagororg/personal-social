"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import PostCard from "@/components/posts/post-card";
import {
  Calendar,
  Globe,
  Lock,
  MapPin,
  Sparkles,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username ? (params.username as string) : "";

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"posts" | "media" | "info">("posts");

  const [followLoading, setFollowLoading] = useState(false);
  const [listModal, setListModal] = useState<"followers" | "following" | null>(null);
  const [listUsers, setListUsers] = useState<{ username: string; displayName?: string | null }[]>([]);
  const [mediaItems, setMediaItems] = useState<{ url: string; type: string }[]>([]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/feed");
          return;
        }
        throw new Error();
      }
      const data = await res.json();
      setProfileData(data);

      if (data.relationship.canViewContent) {
        setPostsLoading(true);
        const [postsRes, mediaRes] = await Promise.all([
          fetch(`/api/users/${username}/posts`),
          fetch(`/api/users/${username}/media`),
        ]);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData.posts);
        }
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          setMediaItems(mediaData.media || []);
        }
        setPostsLoading(false);
      }
    } catch (e) {
      console.error("Error loading profile", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.user.id);
        }
      } catch (e) {
        console.error(e);
      }
    };

    checkUser();
    fetchProfile();
  }, [username]);

  const handleFollowToggle = async () => {
    if (!profileData) return;
    setFollowLoading(true);

    const isFollowing = profileData.relationship.isFollowing;

    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      if (res.ok) {
        await fetchProfile(); // Reload profile states
      }
    } catch (e) {
      console.error("Error toggling follow", e);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
          <div className="h-24 w-24 rounded-full bg-muted" />
          <div className="h-6 w-1/3 bg-muted rounded" />
          <div className="h-4 w-1/4 bg-muted rounded" />
        </div>
      </AppLayout>
    );
  }

  if (!profileData) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">Could not load profile</p>
          <p className="text-sm text-muted-foreground">Please try again later.</p>
          <button
            onClick={() => fetchProfile()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  const { user, stats, relationship } = profileData;
  const profile = user.profile;

  const getFollowButton = () => {
    if (relationship.isSelf) {
      return (
        <button
          onClick={() => router.push("/settings")}
          className="px-5 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-semibold text-sm transition"
        >
          Edit Profile
        </button>
      );
    }

    if (relationship.isFollowing) {
      if (relationship.isPending) {
        return (
          <button
            onClick={handleFollowToggle}
            disabled={followLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted/80 text-muted-foreground border border-border font-semibold text-sm hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition group"
          >
            <UserCheck className="h-4 w-4 group-hover:hidden" />
            <UserX className="h-4 w-4 hidden group-hover:inline" />
            <span className="group-hover:hidden">Pending Approval</span>
            <span className="hidden group-hover:inline">Cancel Request</span>
          </button>
        );
      }

      return (
        <button
          onClick={handleFollowToggle}
          disabled={followLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-destructive/10 border border-border hover:border-destructive/30 hover:text-destructive text-foreground font-semibold text-sm transition group"
        >
          <UserCheck className="h-4 w-4 group-hover:hidden" />
          <UserX className="h-4 w-4 hidden group-hover:inline" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleFollowToggle}
        disabled={followLoading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition shadow-[0_4px_15px_rgba(139,92,246,0.2)]"
      >
        <UserPlus className="h-4 w-4" />
        <span>Follow</span>
      </button>
    );
  };

  const openList = async (type: "followers" | "following") => {
    setListModal(type);
    const res = await fetch(`/api/users/${username}/${type}`);
    if (res.ok) {
      const data = await res.json();
      setListUsers(data.users || []);
    }
  };

  const filteredPosts =
    activeTab === "media" ? posts.filter((p) => p.media && p.media.length > 0) : posts;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="glass rounded-3xl overflow-hidden border border-border/80 shadow-xl relative">
          {/* Custom Aesthetic Cover Banner */}
          <div
            className="h-36 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 relative bg-cover bg-center"
            style={profile?.coverUrl ? { backgroundImage: `url(${profile.coverUrl})` } : undefined}
          >
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          <div className="px-6 pb-6 relative">
            {/* Avatar & Follow Actions Panel */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-5 gap-4">
              <div className="h-28 w-28 rounded-3xl bg-background p-1.5 border-4 border-background shadow-2xl overflow-hidden">
                <div className="h-full w-full rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-3xl border border-primary/20">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={user.username}
                      className="h-full w-full object-cover rounded-2xl"
                    />
                  ) : (
                    user.username.substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              <div className="flex gap-2 self-start sm:self-end">
                {getFollowButton()}
              </div>
            </div>

            {/* Profile Meta Info */}
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {profile?.displayName || user.username}
                </h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>

              {profile?.bio && (
                <p className="text-sm text-foreground/90 max-w-xl leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              )}

              {/* Badges and metadata */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground pt-1.5 font-medium">
                {profile?.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </span>
                )}
                {profile?.website && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.website.replace(/(^\w+:|^)\/\//, "")}
                    </a>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </span>
              </div>

              {/* Counters */}
              <div className="flex items-center gap-6 pt-4 border-t border-border/30 text-sm font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground font-extrabold">{stats.postsCount}</span>
                  <span className="text-muted-foreground font-medium">Posts</span>
                </div>
                <button
                  type="button"
                  onClick={() => openList("followers")}
                  className="flex items-center gap-1.5 hover:text-primary transition"
                >
                  <span className="text-foreground font-extrabold">{stats.followersCount}</span>
                  <span className="text-muted-foreground font-medium">Followers</span>
                </button>
                <button
                  type="button"
                  onClick={() => openList("following")}
                  className="flex items-center gap-1.5 hover:text-primary transition"
                >
                  <span className="text-foreground font-extrabold">{stats.followingCount}</span>
                  <span className="text-muted-foreground font-medium">Following</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Privacy Content Boundary */}
        {!relationship.canViewContent ? (
          <div className="glass rounded-3xl p-16 border border-border/80 text-center space-y-4 shadow-lg">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">This Profile is Private</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Follow this user to view their posts, shared media, and mutual connections in our closed community network.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Tab selection */}
            <div className="flex border-b border-border/50 text-sm font-semibold">
              <button
                onClick={() => setActiveTab("posts")}
                className={`py-3 px-6 border-b-2 transition ${
                  activeTab === "posts"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                All Posts
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`py-3 px-6 border-b-2 transition ${
                  activeTab === "media"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Media
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`py-3 px-6 border-b-2 transition ${
                  activeTab === "info"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                About
              </button>
            </div>

            {/* Rendered Tab content */}
            {activeTab === "info" ? (
              <div className="glass rounded-3xl p-6 border border-border/80 space-y-4">
                <h3 className="font-bold text-base text-foreground">Extended Information</h3>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span>Username</span>
                    <span className="text-foreground font-semibold">@{user.username}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span>Role Hierarchy</span>
                    <span className="text-foreground font-semibold">{user.role}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span>Privacy Boundaries</span>
                    <span className="text-foreground font-semibold">{profile?.privacySetting || "PUBLIC"}</span>
                  </div>
                </div>
              </div>
            ) : activeTab === "media" ? (
              mediaItems.length === 0 ? (
                <div className="glass rounded-3xl p-12 border border-border/80 text-center text-muted-foreground text-sm">
                  No media yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mediaItems.map((m) => (
                    <a
                      key={m.url}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-border"
                    >
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )
            ) : postsLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-muted rounded-3xl" />
                <div className="h-32 bg-muted rounded-3xl" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="glass rounded-3xl p-12 border border-border/80 text-center text-muted-foreground text-sm font-semibold">
                No posts found in this tab.
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {listModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-border p-4 max-h-[70vh] overflow-y-auto">
            <h3 className="font-bold capitalize mb-3">{listModal}</h3>
            <ul className="space-y-2">
              {listUsers.map((u) => (
                <li key={u.username}>
                  <a
                    href={`/profile/${u.username}`}
                    className="block p-2 rounded-lg hover:bg-muted text-sm font-medium"
                    onClick={() => setListModal(null)}
                  >
                    {u.displayName || u.username}{" "}
                    <span className="text-muted-foreground">@{u.username}</span>
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setListModal(null)}
              className="mt-4 w-full py-2 rounded-xl bg-muted text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
