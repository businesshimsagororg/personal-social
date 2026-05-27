"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  Bell,
  Home,
  LogOut,
  Mail,
  Menu,
  Moon,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    // Fetch current user details
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          // If auth check fails, redirect to login
          router.push("/login");
        }
      } catch (err) {
        console.error("Error fetching user session", err);
      }
    };
    fetchUser();
  }, [router]);

  // Fetch unread notification and message counts
  const fetchCounts = async () => {
    try {
      const [notifRes, msgRes] = await Promise.all([
        fetch("/api/notifications?unreadCount=true"),
        fetch("/api/conversations?unreadCount=true") // or query conversations endpoint
      ]);
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotificationsCount(notifData.unreadCount || 0);
      }
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessagesCount(msgData.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to fetch counts", e);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchCounts();
    // Smart poll every 30s
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { name: "Home Feed", href: "/feed", icon: Home },
    { name: "Messages", href: "/messages", icon: Mail, badge: messagesCount },
    { name: "Notifications", href: "/notifications", icon: Bell, badge: notificationsCount },
    { name: "My Profile", href: currentUser ? `/profile/${currentUser.username}` : "#", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MODERATOR";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Background radial overlays for premium aesthetics */}
      <div className="absolute top-0 right-0 w-[30%] h-[30%] rounded-full glow-overlay-primary filter blur-[120px] pointer-events-none opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] rounded-full glow-overlay-secondary filter blur-[120px] pointer-events-none opacity-40"></div>

      {/* Mobile Top Header */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 glass border-b border-border z-30 sticky top-0">
        <Link href="/feed" className="flex items-center gap-2 text-primary font-bold text-xl">
          <Sparkles className="h-6 w-6 text-primary shadow-[0_0_10px_rgba(139,92,246,0.3)] animate-pulse" />
          <span>Apex</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 px-6 py-8 glass border-r border-border shrink-0 z-20">
        <div className="flex items-center gap-3 text-primary font-extrabold text-2xl mb-10 px-2">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <span>Apex</span>
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search community..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
        </form>

        {/* Main Menu Navigation */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(139,92,246,0.25)]"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`h-5 w-5 transition ${isActive ? "scale-110" : "group-hover:scale-105"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? "bg-primary-foreground text-primary" : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin Panel Nav (Conditional) */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition group mt-6 ${
                pathname.startsWith("/admin")
                  ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.25)]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Admin Moderation</span>
            </Link>
          )}
        </nav>

        {/* Footer User Panel */}
        <div className="pt-6 border-t border-border mt-auto space-y-4">
          <div className="flex items-center justify-between px-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted text-foreground transition w-full flex items-center justify-center gap-2 border border-border/50 text-xs font-semibold"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400 animate-spin-slow" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {currentUser && (
            <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0 shadow-inner">
                  {currentUser.profile?.avatarUrl ? (
                    <img
                      src={currentUser.profile.avatarUrl}
                      alt={currentUser.username}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    currentUser.username.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden leading-tight">
                  <h4 className="font-semibold text-sm text-foreground truncate">
                    {currentUser.profile?.displayName || currentUser.username}
                  </h4>
                  <span className="text-xs text-muted-foreground">@{currentUser.username}</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 md:hidden flex flex-col justify-between p-8 animate-fade-in">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-primary font-bold text-2xl">
                <Sparkles className="h-6 w-6" />
                <span>Apex</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-muted text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background text-foreground"
              />
            </form>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-base transition ${
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-foreground text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold text-base transition mt-4 ${
                    pathname.startsWith("/admin") ? "bg-indigo-600 text-white" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="space-y-4 pt-6 border-t border-border">
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {currentUser.profile?.avatarUrl ? (
                    <img
                      src={currentUser.profile.avatarUrl}
                      alt={currentUser.username}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  ) : (
                    currentUser.username.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{currentUser.profile?.displayName || currentUser.username}</h4>
                  <span className="text-xs text-muted-foreground">@{currentUser.username}</span>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold hover:bg-destructive/20 transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 w-full min-h-0 flex flex-col overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto px-4 md:px-8 py-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Quick Links) */}
      <nav className="md:hidden flex items-center justify-around py-3 glass border-t border-border sticky bottom-0 z-30">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative p-2.5 rounded-xl transition ${
                isActive ? "text-primary bg-primary/10 border border-primary/20" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5.5 w-5.5" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-primary text-primary-foreground text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
