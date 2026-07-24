'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Dashboard error:', error);
  return (
    <div className="mx-auto max-w-lg py-16">
      <ErrorState
        title="Dashboard error"
        description="This view failed to load. Your data is safe — retry, or open another section from the sidebar."
        onRetry={reset}
      />
    </div>
  );
}
