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
  premium?: boolean
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
    accent: "bg-muted-foreground/40",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
  },
  success: {
    border: "border-border",
    accent: "bg-success",
    iconBg: "bg-success-soft",
    iconColor: "text-success",
    valueColor: "text-foreground",
  },
  destructive: {
    border: "border-border",
    accent: "bg-destructive",
    iconBg: "bg-destructive-soft",
    iconColor: "text-destructive",
    valueColor: "text-foreground",
  },
  info: {
    border: "border-border",
    accent: "bg-info",
    iconBg: "bg-info-soft",
    iconColor: "text-info",
    valueColor: "text-foreground",
  },
  warning: {
    border: "border-border",
    accent: "bg-warning",
    iconBg: "bg-warning-soft",
    iconColor: "text-warning",
    valueColor: "text-foreground",
  },
  primary: {
    border: "border-border",
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
  showAccentBar = false,
  premium = false,
}: KpiCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card
      data-kpi
      className={cn(
        "group relative overflow-hidden border",
        styles.border,
        premium && "gradient-kpi-premium shadow-purple-sm border-primary/20",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      {showAccentBar && (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-0.5",
            styles.accent
          )}
        />
      )}

      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5 sm:pb-2">
        <CardTitle className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            "flex items-center justify-center rounded-lg p-2 sm:p-2.5",
            "transition-transform duration-200",
            "group-hover:scale-105",
            styles.iconBg
          )}>
            <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", styles.iconColor)} strokeWidth={1.75} />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className={cn(
          "font-display font-semibold tabular-nums tracking-tight",
          premium ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
          styles.valueColor
        )}>
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Funnel card variant
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
      data-kpi
      className={cn(
        "group relative overflow-hidden",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-sm",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4 sm:p-4 sm:pb-1.5">
        <CardTitle className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground transition-transform duration-200 group-hover:scale-105"
            strokeWidth={1.75}
          />
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-4 sm:pt-0">
        <div className="font-display text-lg sm:text-xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

export { type KpiCardProps, type FunnelCardProps }
