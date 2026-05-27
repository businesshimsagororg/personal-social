"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldAlert, Sparkles, User } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(data.message || "Account registered successfully! Check your email.");
      
      // Clear inputs
      setEmail("");
      setUsername("");
      setPassword("");
      setInviteCode("");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-background">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full glow-overlay-primary filter blur-[120px] pointer-events-none opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full glow-overlay-secondary filter blur-[120px] pointer-events-none opacity-60"></div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-primary to-pink-500 bg-clip-text text-transparent">
            Join the Network
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Request membership or enter an invite code to join Apex
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl relative border border-border">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Registration Error:</span>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6 py-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Verification Required</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {success}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:bg-primary/95 transition duration-200"
                >
                  Proceed to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="username (letters, numbers, _)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-11 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Invite Code <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter code for instant access"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  No invite? You will need administrator approval after registration.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full mt-2 py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  <span>Request Membership</span>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline hover:text-primary/80 transition"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
