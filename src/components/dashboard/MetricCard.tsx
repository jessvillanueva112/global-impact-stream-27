import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  className = "",
  variant = 'default'
}: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-accent-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return "bg-gradient-primary text-primary-foreground shadow-primary";
      case 'success':
        return "bg-gradient-success text-accent-success-foreground shadow-impact";
      case 'warning':
        return "bg-gradient-warm text-accent-warm-foreground";
      default:
        return "bg-card text-card-foreground shadow-card hover:shadow-impact";
    }
  };

  return (
    <Card className={`transition-all duration-300 hover:scale-[1.02] ${getVariantStyles()} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium opacity-80">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trendValue && (
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon()}
                  <span className={
                    trend === 'up' ? 'text-accent-success' : 
                    trend === 'down' ? 'text-destructive' : 
                    'text-muted-foreground'
                  }>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-sm opacity-70">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="ml-4 opacity-80">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};