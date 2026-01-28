import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SettingsCardSkeletonProps {
  className?: string;
}

export function SettingsCardSkeleton({ className }: SettingsCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
