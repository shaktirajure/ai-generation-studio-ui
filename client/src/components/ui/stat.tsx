import { cn } from "@/lib/utils";

interface StatProps {
  value: string | number;
  label: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function Stat({ 
  value, 
  label, 
  description, 
  trend, 
  className 
}: StatProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-3xl font-bold font-heading text-foreground">
        {value}
      </div>
      <div className="text-sm font-medium text-muted-foreground">
        {label}
      </div>
      {description && (
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
      )}
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium",
          trend.isPositive ? "text-success" : "text-danger"
        )}>
          <span>{trend.isPositive ? "↗" : "↘"}</span>
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  );
}