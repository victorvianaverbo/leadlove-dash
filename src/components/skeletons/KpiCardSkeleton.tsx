import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardSkeletonProps {
  className?: string;
}

export function KpiCardSkeleton({ className }: KpiCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-16 mt-2" />
      </CardContent>
    </Card>
  );
}

interface KpiGridSkeletonProps {
  count?: number;
  columns?: 4 | 5;
  className?: string;
}

export function KpiGridSkeleton({ count = 5, columns = 5, className }: KpiGridSkeletonProps) {
  const gridClass = columns === 5 
    ? "grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5" 
    : "grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4";
  
  return (
    <div className={`${gridClass} ${className || ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FunnelSectionSkeleton() {
  return (
    <div className="mb-6 sm:mb-8">
      <Skeleton className="h-6 w-32 mb-4" />
      
      {/* 4 rows of funnel metrics */}
      {[4, 4, 4, 4].map((count, rowIndex) => (
        <div key={rowIndex} className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-3 sm:mb-4">
          {Array.from({ length: count }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      ))}
    </div>
  );
}
