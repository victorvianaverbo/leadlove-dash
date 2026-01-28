import { Clock, DollarSign, TrendingDown, TrendingUp, Target, MoreVertical, ArrowRight, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

const getInitials = (name: string) => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
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
  
  // Determine accent bar color based on ROAS
  const getAccentColor = () => {
    if (hasNoData) return 'bg-primary';
    if (roas >= 1) return 'bg-success';
    return 'bg-destructive';
  };

  const lastUpdate = project.last_sync_at || project.updated_at;
  const timeAgo = lastUpdate 
    ? formatDistanceToNow(new Date(lastUpdate), { addSuffix: true, locale: ptBR })
    : null;

  return (
    <Card
      className="cursor-pointer overflow-hidden group relative card-elevate border-border hover:border-primary/30"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Accent Bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", getAccentColor())} />
      
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar + Info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with initials */}
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-purple-sm">
              <span className="text-sm font-semibold text-white">
                {getInitials(project.name)}
              </span>
            </div>
            
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors truncate font-display">
                {project.name}
              </h3>
              {timeAgo && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </p>
              )}
            </div>
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="px-5 pb-5 pt-0">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Revenue */}
          <div className="bg-success/5 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="h-3 w-3 text-success" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Faturamento</p>
            <p className="text-sm font-bold text-foreground mt-0.5">
              R$ {formatCurrency(revenue)}
            </p>
          </div>
          
          {/* Spend */}
          <div className="bg-destructive/5 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-3 w-3 text-destructive" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Investimento</p>
            <p className="text-sm font-bold text-foreground mt-0.5">
              R$ {formatCurrency(spend)}
            </p>
          </div>
          
          {/* ROAS */}
          <div className={cn(
            "rounded-lg p-2.5 text-center",
            isPositive ? "bg-success/5" : "bg-destructive/5"
          )}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center",
                isPositive ? "bg-success/10" : "bg-destructive/10"
              )}>
                <Target className={cn("h-3 w-3", isPositive ? "text-success" : "text-destructive")} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ROAS</p>
            <p className={cn(
              "text-sm font-bold mt-0.5",
              isPositive ? "text-success" : "text-destructive"
            )}>
              {roas.toFixed(2)}x
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 h-5 font-medium",
              isPositive
                ? "border-success/30 text-success bg-success/5"
                : "border-destructive/30 text-destructive bg-destructive/5"
            )}
          >
            {isPositive ? (
              <><TrendingUp className="h-3 w-3 mr-1" /> Lucrativo</>
            ) : (
              <><TrendingDown className="h-3 w-3 mr-1" /> Negativo</>
            )}
          </Badge>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {/* Integration Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {integrations.slice(0, 2).map((integration) => (
              <Badge
                key={integration.type}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 font-normal"
              >
                {integrationLabels[integration.type] || integration.type}
              </Badge>
            ))}
            {integrations.length > 2 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 font-normal"
              >
                +{integrations.length - 2}
              </Badge>
            )}
          </div>
          
          {/* View Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/5 group/btn"
          >
            Ver Dashboard
            <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
