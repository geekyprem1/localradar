import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Props = {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondary?: ReactNode;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondary,
}: Props) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary-bg/50 px-6 py-16 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" aria-hidden />
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-border bg-background shadow-sm">
          {Icon ? (
            <Icon className="h-7 w-7 text-primary" aria-hidden />
          ) : (
            <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary-text">{description}</p>
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90"
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90 cursor-pointer"
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        )
      )}
      {secondary && <div className="mt-4">{secondary}</div>}
    </div>
  );
}
