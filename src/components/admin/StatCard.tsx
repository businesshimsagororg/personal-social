import Link from "next/link";

export default function StatCard({
  label,
  value,
  hint,
  href,
  accent = "primary",
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  accent?: "primary" | "amber" | "emerald" | "destructive" | "sky";
}) {
  const valueColor = {
    primary: "text-primary",
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    destructive: "text-destructive",
    sky: "text-sky-500",
  }[accent];

  const inner = (
    <div
      className={`glass rounded-2xl border border-border/80 p-4 transition hover:shadow-lg ${
        href ? "cursor-pointer hover:border-primary/40" : ""
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-2xl font-extrabold tabular-nums ${valueColor}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
