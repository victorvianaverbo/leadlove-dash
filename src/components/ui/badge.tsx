import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "text-foreground border-border",
        midnight:
          "border-transparent bg-midnight text-midnight-foreground hover:bg-midnight/90",
        "success-soft":
          "border-transparent bg-success-soft text-success hover:bg-success-soft/80",
        "warning-soft":
          "border-transparent bg-warning-soft text-warning-foreground hover:bg-warning-soft/80",
        "destructive-soft":
          "border-transparent bg-destructive-soft text-destructive hover:bg-destructive-soft/80",
        "info-soft":
          "border-transparent bg-info-soft text-info hover:bg-info-soft/80",
        "primary-soft":
          "border-transparent bg-primary-soft text-primary hover:bg-primary-soft/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
