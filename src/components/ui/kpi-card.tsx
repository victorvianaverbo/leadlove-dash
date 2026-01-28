import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

export type KpiVariant = "default" | "success" | "destructive" | "info" | "warning" | "primary"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  variant?: KpiVariant
  className?: string
  showAccentBar?: boolean
}

const variantStyles: Record<KpiVariant, {
  border: string
  accent: string
  iconBg: string
  iconColor: string
  valueColor: string
}> = {
  default: {
    border: "border-border",
    accent: "bg-muted-foreground",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
  },
  success: {
    border: "border-success",
    accent: "bg-success",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    valueColor: "text-success",
  },
  destructive: {
    border: "border-destructive",
    accent: "bg-destructive",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    valueColor: "text-destructive",
  },
  info: {
    border: "border-info",
    accent: "bg-info",
    iconBg: "bg-info/10",
    iconColor: "text-info",
    valueColor: "text-info",
  },
  warning: {
    border: "border-warning",
    accent: "bg-warning",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    valueColor: "text-warning",
  },
  primary: {
    border: "border-primary-color",
    accent: "bg-primary",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
    valueColor: "text-foreground",
  },
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
  showAccentBar = true,
}: KpiCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card
      className={cn(
        // Base styles
        "relative overflow-hidden border",
        styles.border,
        // Micro-interactions: hover elevation + shadow
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {/* Accent bar no topo */}
      {showAccentBar && (
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 h-1",
            styles.accent
          )} 
        />
      )}
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <div className={cn(
            "w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center",
            "transition-transform duration-300",
            "group-hover:scale-110",
            styles.iconBg
          )}>
            <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4", styles.iconColor)} />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className={cn("text-lg sm:text-2xl font-bold", styles.valueColor)}>
          {value}
        </div>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Versão para cards do funil (sem borda colorida, apenas accent bar)
interface FunnelCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  className?: string
}

export function FunnelCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: FunnelCardProps) {
  return (
    <Card
      className={cn(
        // Base styles
        "relative overflow-hidden",
        // Micro-interactions: hover elevation + shadow
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-md",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
        )}
      </CardHeader>
      
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="text-lg sm:text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

export { type KpiCardProps, type FunnelCardProps }
