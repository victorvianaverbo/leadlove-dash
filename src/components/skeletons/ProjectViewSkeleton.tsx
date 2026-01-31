import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricsGridSkeleton } from './MetricCardSkeleton';
import { SettingsCardSkeleton } from './SettingsCardSkeleton';

export function ProjectViewSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Skeleton className="h-9 w-20" />
              <div className="min-w-0">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Settings Card Skeleton */}
        <SettingsCardSkeleton className="mb-6" />

        {/* KPI Cards Skeleton */}
        <section className="mb-6 sm:mb-8">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Funnel Section Skeleton */}
        <section className="mb-6 sm:mb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          
          {/* Funnel Rows */}
          {[4, 4, 4, 4].map((count, rowIndex) => (
            <div key={rowIndex} className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-3 sm:mb-4">
              {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-3 w-16 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}
