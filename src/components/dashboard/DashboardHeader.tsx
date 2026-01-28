import { DollarSign, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardHeaderProps {
  userName?: string | null;
  projectCount: number;
  totalRevenue: number;
  averageRoas: number;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

export function DashboardHeader({
  userName,
  projectCount,
  totalRevenue,
  averageRoas,
}: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'Usuário';
  
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {projectCount > 0 
            ? `Aqui está o resumo dos seus ${projectCount} projeto${projectCount > 1 ? 's' : ''}`
            : 'Crie seu primeiro projeto para começar'
          }
        </p>
      </div>
      
      {/* Summary Cards */}
      {projectCount > 0 && (
        <div className="flex gap-3">
          {/* Total Revenue */}
          <Card className="border-0 gradient-primary text-white min-w-[140px]">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs text-white/70 uppercase tracking-wide">Faturamento</span>
              </div>
              <p className="text-lg font-bold font-display">
                R$ {formatCurrency(totalRevenue)}
              </p>
            </CardContent>
          </Card>
          
          {/* Average ROAS */}
          <Card className="border-0 gradient-success text-white min-w-[120px]">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Target className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs text-white/70 uppercase tracking-wide">ROAS Médio</span>
              </div>
              <p className="text-lg font-bold font-display">
                {averageRoas.toFixed(2)}x
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
