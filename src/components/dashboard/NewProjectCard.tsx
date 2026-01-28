import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NewProjectCardProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NewProjectCard({ onClick, disabled = false }: NewProjectCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer border-2 border-dashed transition-all duration-300 group",
        disabled 
          ? "opacity-50 cursor-not-allowed border-border"
          : "border-muted-foreground/20 hover:border-primary hover:bg-primary/5"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent className="py-12 flex flex-col items-center justify-center text-center">
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors",
          disabled
            ? "bg-muted"
            : "bg-primary/10 group-hover:bg-primary/20"
        )}>
          <Plus className={cn(
            "h-7 w-7 transition-colors",
            disabled
              ? "text-muted-foreground"
              : "text-primary"
          )} />
        </div>
        
        <h3 className={cn(
          "font-semibold text-base font-display transition-colors",
          disabled
            ? "text-muted-foreground"
            : "text-foreground group-hover:text-primary"
        )}>
          Novo Projeto
        </h3>
        
        <p className="text-sm text-muted-foreground mt-1">
          {disabled 
            ? "Limite de projetos atingido"
            : "Conecte suas plataformas"
          }
        </p>
      </CardContent>
    </Card>
  );
}
