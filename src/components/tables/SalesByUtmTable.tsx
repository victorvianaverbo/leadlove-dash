import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginatedTable, Column } from '@/components/PaginatedTable';
import { Filter } from 'lucide-react';

interface Sale {
  amount: number;
  gross_amount?: number | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  [key: string]: any;
}

interface SalesByUtmTableProps {
  sales: Sale[];
  formatCurrency: (value: number) => string;
  ticketPrice?: number | null;
  useGrossForRoas?: boolean;
}

interface UtmRow {
  source: string;
  campaign: string;
  count: number;
  revenue: number;
  percent: number;
}

export function SalesByUtmTable({ sales, formatCurrency, ticketPrice, useGrossForRoas }: SalesByUtmTableProps) {
  const utmData = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    const groups = new Map<string, { count: number; revenue: number; source: string; campaign: string }>();

    for (const sale of sales) {
      const source = sale.utm_source || '(direto)';
      const campaign = sale.utm_campaign || '-';
      const key = `${source}||${campaign}`;

      let value: number;
      if (ticketPrice) {
        value = ticketPrice;
      } else if (useGrossForRoas) {
        value = Number(sale.gross_amount || sale.amount);
      } else {
        value = Number(sale.amount);
      }

      const existing = groups.get(key);
      if (existing) {
        existing.count++;
        existing.revenue += value;
      } else {
        groups.set(key, { count: 1, revenue: value, source, campaign });
      }
    }

    const totalRevenue = Array.from(groups.values()).reduce((sum, g) => sum + g.revenue, 0);

    const rows: UtmRow[] = Array.from(groups.values())
      .map(g => ({
        source: g.source,
        campaign: g.campaign,
        count: g.count,
        revenue: g.revenue,
        percent: totalRevenue > 0 ? (g.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return rows;
  }, [sales, ticketPrice, useGrossForRoas]);

  const columns: Column<UtmRow>[] = [
    { key: 'source', header: 'Origem (Source)' },
    { key: 'campaign', header: 'Campanha' },
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
          <CardTitle className="text-base sm:text-lg">Vendas por Origem (UTM)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <PaginatedTable
          data={utmData}
          columns={columns}
          defaultPageSize={10}
          emptyMessage="Nenhuma venda com dados de UTM encontrada"
        />
      </CardContent>
    </Card>
  );
}
