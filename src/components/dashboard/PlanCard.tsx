import { Crown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

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
  const progressPercent = isUnlimited ? 0 : (projectCount / projectLimit) * 100;
  const isNearLimit = !isUnlimited && progressPercent >= 80;

  return (
    <Card className="relative overflow-hidden border-0 gradient-purple-indigo text-white">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="py-5 px-5 relative z-10">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Info */}
          <div className="flex items-center gap-4">
            {/* Crown Icon */}
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Crown className="h-5 w-5 text-yellow-300" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base font-display">Plano {planName}</h3>
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </div>
              <p className="text-white/70 text-sm mt-0.5">
                Acesso a recursos avançados
              </p>
            </div>
          </div>
          
          {/* Right: Progress + Upgrade */}
          <div className="flex items-center gap-4">
            {/* Progress Section */}
            <div className="text-right min-w-[100px]">
              <p className="text-sm font-medium">
                {isUnlimited ? (
                  <span>∞ projetos</span>
                ) : (
                  <span>{projectCount}/{projectLimit} projetos</span>
                )}
              </p>
              
              {!isUnlimited && (
                <div className="mt-1.5">
                  <Progress 
                    value={progressPercent} 
                    className="h-1.5 bg-white/20 [&>div]:bg-white"
                  />
                </div>
              )}
              
              {subscriptionEnd && (
                <p className="text-xs text-white/60 mt-1 hidden sm:block">
                  Renova em {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            
            {/* Upgrade Button */}
            {!isMaxPlan && isNearLimit && (
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90 font-medium"
              >
                <Link to="/pricing">
                  Upgrade
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
