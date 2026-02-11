import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

interface AdminFiltersProps {
  planFilter: string;
  statusFilter: string;
  tagFilter: string;
  allTags: string[];
  onPlanChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function AdminFilters({
  planFilter,
  statusFilter,
  tagFilter,
  allTags,
  onPlanChange,
  onStatusChange,
  onTagChange,
  onClear,
  hasActiveFilters,
}: AdminFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtros:
      </div>

      <Select value={planFilter} onValueChange={onPlanChange}>
        <SelectTrigger className="h-8 w-[140px] text-sm">
          <SelectValue placeholder="Plano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos planos</SelectItem>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="business">Business</SelectItem>
          <SelectItem value="agencia">Agência</SelectItem>
          <SelectItem value="none">Sem plano</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-[140px] text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          <SelectItem value="active">Ativo</SelectItem>
          <SelectItem value="trialing">Trial</SelectItem>
          <SelectItem value="canceled">Cancelado</SelectItem>
          <SelectItem value="inactive">Inativo</SelectItem>
        </SelectContent>
      </Select>

      <Select value={tagFilter} onValueChange={onTagChange}>
        <SelectTrigger className="h-8 w-[140px] text-sm">
          <SelectValue placeholder="Tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas tags</SelectItem>
          {allTags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-sm" onClick={onClear}>
          <X className="h-3 w-3 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
