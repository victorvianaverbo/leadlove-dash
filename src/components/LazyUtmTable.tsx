import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginatedTable, Column } from '@/components/PaginatedTable';
import { Skeleton } from '@/components/ui/skeleton';

export interface UtmData {
  source: string;
  medium: string;
  campaign: string;
  count: number;
  revenue: number;
}

interface LazyUtmTableProps {
  data: UtmData[];
  formatCurrency: (value: number) => string;
  isLoading?: boolean;
}

function UtmTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden">
        <div className="bg-muted/50 p-3 flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 flex gap-4 border-t border-border">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function LazyUtmTable({ data, formatCurrency, isLoading = false }: LazyUtmTableProps) {
  const columns: Column<UtmData>[] = [
    { 
      key: 'source', 
      header: 'Fonte',
      className: 'font-medium'
    },
    { 
      key: 'medium', 
      header: 'Mídia',
    },
    { 
      key: 'campaign', 
      header: 'Campanha',
      className: 'max-w-[200px] truncate'
    },
    { 
      key: 'count', 
      header: 'Vendas',
      className: 'text-right',
      render: (row: UtmData) => (
        <span className="font-medium">{row.count}</span>
      )
    },
    { 
      key: 'revenue', 
      header: 'Faturamento',
      className: 'text-right',
      render: (row: UtmData) => (
        <span className="font-medium text-success">{formatCurrency(row.revenue)}</span>
      )
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Atribuição por UTM
        </CardTitle>
        <CardDescription>
          Vendas e receita agrupadas por fonte de tráfego
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <UtmTableSkeleton />
        ) : (
          <PaginatedTable<UtmData>
            data={data}
            columns={columns}
            defaultPageSize={10}
            emptyMessage="Nenhuma venda com UTM identificado"
          />
        )}
      </CardContent>
    </Card>
  );
}
