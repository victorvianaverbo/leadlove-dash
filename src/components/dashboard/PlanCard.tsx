import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  planName: string;
  projectCount: number;
  projectLimit: number;
  subscriptionEnd?: string | null;
  isMaxPlan?: boolean;
}

export function PlanCard({
  planName,
  projectCount,
  projectLimit,
  subscriptionEnd,
  isMaxPlan = false,
}: PlanCardProps) {
  const isUnlimited = projectLimit === -1;
  const progressPercent = isUnlimited ? 0 : Math.min((projectCount / projectLimit) * 100, 100);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
      {/* Left: avatar + name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-soft flex-shrink-0">
          <Crown className="h-4 w-4 text-primary" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Plano atual
          </p>
          <p className="font-display font-semibold text-sm leading-tight truncate">
            {planName}
            {subscriptionEnd && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                · renova {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Center: usage + progress */}
      <div className="flex-1 max-w-xs hidden md:block">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Uso</span>
          <span className="tabular-nums font-medium text-foreground">
            {isUnlimited ? '∞ projetos' : `${projectCount} / ${projectLimit} projetos`}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-all duration-500",
              isUnlimited && "w-full bg-gradient-to-r from-primary to-primary-light"
            )}
            style={{ width: isUnlimited ? '100%' : `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Right: upgrade CTA */}
      {!isMaxPlan && (
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="text-primary hover:text-primary hover:bg-primary-soft font-medium flex-shrink-0"
        >
          <Link to="/pricing">Upgrade →</Link>
        </Button>
      )}
    </div>
  );
}
