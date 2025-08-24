import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  iconColor = "bg-blue-100 text-blue-600",
  change,
  className 
}: StatsCardProps) {
  const changeColorMap = {
    increase: "text-green-600",
    decrease: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <Card className={cn("stats-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600" data-testid={`text-stats-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900" data-testid={`text-stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconColor)}>
            <i className={`fas ${icon} text-xl`}></i>
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center">
            <span className={cn("text-sm font-medium", changeColorMap[change.type])}>
              {change.value}
            </span>
            {change.label && (
              <span className="text-gray-600 text-sm ml-2">{change.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
