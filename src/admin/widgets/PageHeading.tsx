import type { ReactNode } from 'react';

export function PageHeading({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ds-mid">{eyebrow}</p>
        <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight tracking-tight text-ds-base">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sub}</p>
      </div>
      {action}
    </header>
  );
}

/** Skeleton shown while the model writes the report. Deliberately shaped like
 * prose, not like a spinner over a chart — what's loading is writing. */
export function ReportSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy>
      <div className="h-8 w-2/3 rounded-lg bg-ds-tint" />
      <div className="flex flex-col gap-2.5">
        <div className="h-4 w-full rounded bg-ds-tint" />
        <div className="h-4 w-11/12 rounded bg-ds-tint" />
        <div className="h-4 w-9/12 rounded bg-ds-tint" />
      </div>
      <div className="h-40 w-full rounded-2xl bg-ds-tint" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-2xl bg-ds-tint" />
        <div className="h-32 rounded-2xl bg-ds-tint" />
      </div>
    </div>
  );
}
