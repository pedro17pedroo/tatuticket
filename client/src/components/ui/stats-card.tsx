import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  change?: {
    value: string;
    type: "increase" | "decrease";
    label: string;
  };
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  iconColor, 
  change, 
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("p-2 rounded-md mr-4", iconColor)}>
            <i className={`fas ${icon} text-lg`}></i>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-500">{title}</div>
            <div className="text-2xl font-bold text-gray-900" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </div>
            {change && (
              <div className="flex items-center mt-1">
                <i className={cn(
                  "fas text-xs mr-1",
                  change.type === "increase" 
                    ? "fa-arrow-up text-green-500" 
                    : "fa-arrow-down text-red-500"
                )}></i>
                <span className={cn(
                  "text-sm font-medium",
                  change.type === "increase" ? "text-green-600" : "text-red-600"
                )}>
                  {change.value}
                </span>
                <span className="text-sm text-gray-500 ml-1">{change.label}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}