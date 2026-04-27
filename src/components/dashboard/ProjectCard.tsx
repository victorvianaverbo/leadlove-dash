import { MoreVertical, Trash2, ArrowUpRight, ArrowDownRight, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectMetrics {
  revenue: number;
  spend: number;
  roas: number;
}

interface Integration {
  type: string;
  is_active: boolean;
}

interface Project {
  id: string;
  name: string;
  last_sync_at?: string | null;
  updated_at: string;
}

interface ProjectCardProps {
  project: Project;
  metrics: ProjectMetrics;
  integrations: Integration[];
  onDelete: (e: React.MouseEvent) => void;
  onClick: () => void;
  index?: number;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const integrationLabels: Record<string, string> = {
  meta_ads: 'Meta Ads',
  hotmart: 'Hotmart',
  kiwify: 'Kiwify',
  guru: 'Guru',
  eduzz: 'Eduzz',
};

export function ProjectCard({
  project,
  metrics,
  integrations,
  onDelete,
  onClick,
  index = 0,
}: ProjectCardProps) {
  const { revenue, spend, roas } = metrics;
  const isPositive = roas >= 1;
  const hasNoData = revenue === 0 && spend === 0;
  const hasSynced = !!project.last_sync_at;

  const lastUpdate = project.last_sync_at || project.updated_at;
  const timeAgo = lastUpdate
    ? formatDistanceToNow(new Date(lastUpdate), { addSuffix: true, locale: ptBR })
    : null;

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden card-elevate border-border hover:border-primary/30"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-lg leading-tight tracking-tight truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {integrations.length === 0 ? (
                <span className="text-xs text-muted-foreground">Nenhuma integração</span>
              ) : (
                integrations.slice(0, 4).map((integration) => (
                  <Badge
                    key={integration.type}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-5 font-normal bg-muted text-muted-foreground hover:bg-muted"
                  >
                    {integrationLabels[integration.type] || integration.type}
                  </Badge>
                ))
              )}
              {integrations.length > 4 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                  +{integrations.length - 4}
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1"
              >
                <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.75} />
                Excluir projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* KPIs in row */}
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-border">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Faturamento
            </p>
            <p className="font-display text-base font-semibold tabular-nums mt-0.5">
              R$ {formatCurrency(revenue)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Investimento
            </p>
            <p className="font-display text-base font-semibold tabular-nums mt-0.5">
              R$ {formatCurrency(spend)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              ROAS
            </p>
            <p className={cn(
              "font-display text-base font-semibold tabular-nums mt-0.5 inline-flex items-center gap-1",
              hasNoData ? "text-foreground" : isPositive ? "text-success" : "text-destructive"
            )}>
              {roas.toFixed(2)}x
              {!hasNoData && (
                isPositive
                  ? <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  : <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {(() => {
              const daysSinceSync = project.last_sync_at
                ? (Date.now() - new Date(project.last_sync_at).getTime()) / (1000 * 60 * 60 * 24)
                : Infinity;
              const isActive = integrations.length > 0 && hasSynced && daysSinceSync <= 7;
              return (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0",
                    isActive
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Circle
                    className={cn(
                      "h-1.5 w-1.5 fill-current",
                      isActive ? "text-success" : "text-muted-foreground/60"
                    )}
                  />
                  {isActive ? "Ativo" : "Inativo"}
                </span>
              );
            })()}
            <span className="text-[11px] text-muted-foreground truncate">
              {timeAgo ? `sincronizado ${timeAgo}` : 'nunca sincronizado'}
            </span>
          </div>
          <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            Ver dashboard →
          </span>
        </div>
      </div>
    </Card>
  );
}
