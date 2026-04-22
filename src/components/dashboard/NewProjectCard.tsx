import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewProjectCardProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NewProjectCard({ onClick, disabled = false }: NewProjectCardProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center justify-center w-full min-h-[220px] rounded-xl border-2 border-dashed transition-all duration-200 text-center p-6",
        disabled
          ? "opacity-50 cursor-not-allowed border-border bg-muted/20"
          : "border-primary/30 bg-primary-soft/30 hover:border-primary hover:bg-primary-soft cursor-pointer hover:-translate-y-0.5"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full mb-4 transition-all",
          disabled
            ? "bg-muted"
            : "bg-primary-soft group-hover:bg-primary group-hover:scale-110"
        )}
      >
        <Plus
          className={cn(
            "h-5 w-5 transition-colors",
            disabled ? "text-muted-foreground" : "text-primary group-hover:text-white"
          )}
          strokeWidth={2}
        />
      </div>

      <h3
        className={cn(
          "font-display font-semibold text-base transition-colors",
          disabled
            ? "text-muted-foreground"
            : "text-foreground group-hover:text-primary"
        )}
      >
        Novo projeto
      </h3>

      <p className="text-xs text-muted-foreground mt-1.5 max-w-[180px]">
        {disabled
          ? "Limite de projetos atingido"
          : "Conecte suas plataformas e comece a rastrear"}
      </p>
    </button>
  );
}
