import { AlertTriangle, RefreshCw } from 'lucide-react';

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We could not complete that request. Check your connection and try again. If it keeps happening, contact support.',
  onRetry,
  retryLabel = 'Try again',
}: Props) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-[#FF5C5C]/25 bg-[#FF5C5C]/5 px-6 py-12 text-center"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#FF5C5C]/30 bg-[#FF5C5C]/10 text-[#FF5C5C]">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary-text">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary-bg cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
