import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className 
}: TableSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="border rounded-md overflow-hidden">
          {/* Header row */}
          <div className="bg-muted/50 p-3 flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-4 flex-1" />
            ))}
          </div>
          
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
              key={`row-${rowIndex}`} 
              className="p-3 flex gap-4 border-t border-border"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={`cell-${rowIndex}-${colIndex}`} 
                  className="h-4 flex-1" 
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Pagination skeleton */}
        <div className="p-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
