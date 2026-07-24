import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-0">
      <DashboardSkeleton />
    </div>
  );
}
