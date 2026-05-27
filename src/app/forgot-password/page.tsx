"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Mail, ShieldAlert, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset request failed");
      }

      setSuccess(data.message || "A reset link has been emailed to you!");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-background">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full glow-overlay-primary filter blur-[120px] pointer-events-none opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full glow-overlay-secondary filter blur-[120px] pointer-events-none opacity-60"></div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <KeyRound className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-primary to-pink-500 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl relative border border-border">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Reset Error:</span>
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
                <h3 className="text-xl font-bold text-foreground">Reset Email Sent</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {success}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:bg-primary/95 transition duration-200"
                >
                  Return to Login
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

              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>Sending Reset Link...</span>
                  </div>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
