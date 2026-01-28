import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartSkeletonProps {
  height?: number;
  showHeader?: boolean;
  className?: string;
}

export function ChartSkeleton({ 
  height = 300, 
  showHeader = true,
  className 
}: ChartSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
      )}
      <CardContent>
        <div 
          className="flex items-end justify-between gap-2" 
          style={{ height: `${height}px` }}
        >
          {/* Simulated bar chart bars */}
          {Array.from({ length: 7 }).map((_, i) => {
            const randomHeight = 30 + Math.random() * 60;
            return (
              <div 
                key={i} 
                className="flex-1 flex flex-col items-center justify-end gap-2"
              >
                <Skeleton 
                  className="w-full rounded-t-md" 
                  style={{ height: `${randomHeight}%` }}
                />
                <Skeleton className="h-3 w-10" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function FunnelChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[100, 80, 60, 40, 20].map((width, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24 flex-shrink-0" />
              <Skeleton 
                className="h-8 rounded-md" 
                style={{ width: `${width}%` }}
              />
              <Skeleton className="h-4 w-16 flex-shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
