"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token") || null;

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage("Verification token is missing.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Verification failed");
        }

        setSuccess(true);
        setMessage(data.message || "Your email address has been verified successfully!");
      } catch (err: any) {
        setSuccess(false);
        setMessage(err.message || "Failed to verify email address. The token may be expired or invalid.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="glass rounded-3xl p-8 shadow-2xl relative border border-border">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Verifying your email, please wait...</p>
        </div>
      ) : success ? (
        <div className="text-center space-y-6 py-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Email Verified!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:bg-primary/95 transition duration-200"
            >
              Log In to Apex
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-6 py-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
            <XCircle className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Verification Failed</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/signup"
              className="inline-block w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:bg-primary/95 transition duration-200"
            >
              Sign Up Again
            </Link>
            <Link
              href="/login"
              className="inline-block w-full py-3.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition duration-200"
            >
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-background">
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
            Verify Email
          </h1>
        </div>

        <Suspense fallback={
          <div className="glass rounded-3xl p-8 shadow-2xl relative border border-border flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading verification details...</p>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
