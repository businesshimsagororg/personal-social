"use client";

import { useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AuthErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  if (!error) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
      <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">Authentication Error:</span>
        <p className="mt-0.5">{decodeURIComponent(error)}</p>
      </div>
    </div>
  );
}
