import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaginatedTable, Column } from '@/components/PaginatedTable';
import { Filter } from 'lucide-react';

interface Sale {
  amount: number;
  gross_amount?: number | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  [key: string]: any;
}

interface SalesByUtmTableProps {
  sales: Sale[];
  formatCurrency: (value: number) => string;
  ticketPrice?: number | null;
  useGrossForRoas?: boolean;
}

interface UtmRow {
  value: string;
  count: number;
  revenue: number;
  percent: number;
}

const UTM_TABS = [
  { key: 'utm_source', label: 'Source', header: 'Origem', fallback: '(direto)' },
  { key: 'utm_campaign', label: 'Campaign', header: 'Campanha', fallback: '-' },
  { key: 'utm_medium', label: 'Medium', header: 'Meio', fallback: '-' },
  { key: 'utm_content', label: 'Content', header: 'Conteúdo', fallback: '-' },
] as const;

function groupByField(
  sales: Sale[],
  field: string,
  fallback: string,
  ticketPrice?: number | null,
  useGrossForRoas?: boolean,
): UtmRow[] {
  if (!sales || sales.length === 0) return [];

  const groups = new Map<string, { count: number; revenue: number }>();

  for (const sale of sales) {
    const value = (sale[field] as string) || fallback;

    let amount: number;
    if (ticketPrice) {
      amount = ticketPrice;
    } else if (useGrossForRoas) {
      amount = Number(sale.gross_amount || sale.amount);
    } else {
      amount = Number(sale.amount);
    }

    const existing = groups.get(value);
    if (existing) {
      existing.count++;
      existing.revenue += amount;
    } else {
      groups.set(value, { count: 1, revenue: amount });
    }
  }

  const totalRevenue = Array.from(groups.values()).reduce((sum, g) => sum + g.revenue, 0);

  return Array.from(groups.entries())
    .map(([value, g]) => ({
      value,
      count: g.count,
      revenue: g.revenue,
      percent: totalRevenue > 0 ? (g.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function SalesByUtmTable({ sales, formatCurrency, ticketPrice, useGrossForRoas }: SalesByUtmTableProps) {
  const dataByTab = useMemo(() => {
    const result: Record<string, UtmRow[]> = {};
    for (const tab of UTM_TABS) {
      result[tab.key] = groupByField(sales, tab.key, tab.fallback, ticketPrice, useGrossForRoas);
    }
    return result;
  }, [sales, ticketPrice, useGrossForRoas]);

  const makeColumns = (headerLabel: string): Column<UtmRow>[] => [
    { key: 'value', header: headerLabel },
    { key: 'count', header: 'Vendas', className: 'text-right', render: (row) => row.count },
    { key: 'revenue', header: 'Receita', className: 'text-right', render: (row) => formatCurrency(row.revenue) },
    { key: 'percent', header: '% do Total', className: 'text-right', render: (row) => `${row.percent.toFixed(1)}%` },
  ];

  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base sm:text-lg">Vendas por UTM</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="utm_source">
          <TabsList className="mb-4 w-full sm:w-auto">
            {UTM_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {UTM_TABS.map((tab) => (
            <TabsContent key={tab.key} value={tab.key}>
              <PaginatedTable
                data={dataByTab[tab.key]}
                columns={makeColumns(tab.header)}
                defaultPageSize={10}
                emptyMessage={`Nenhuma venda com ${tab.label} encontrada`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
