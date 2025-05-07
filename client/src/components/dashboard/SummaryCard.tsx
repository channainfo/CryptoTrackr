import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  changePercent?: string;
  isPositive?: boolean;
  icon?: ReactNode;
  assetDistribution?: boolean;
}

const SummaryCard = ({
  title,
  value,
  change,
  changePercent,
  isPositive = true,
  icon,
  assetDistribution = false
}: SummaryCardProps) => {
  return (
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900">
      <CardContent className="p-3">
        {/* Combined title and icon */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            {icon && (
              <div className="bg-primary bg-opacity-10 text-primary rounded-full p-1.5">
                {icon}
              </div>
            )}
            <h3 className="text-neutral-mid text-xs font-medium">{title}</h3>
          </div>
          
          {/* Change percentage badge - now moved to right side */}
          {changePercent && (
            <div className={cn(
              "flex items-center rounded text-xs font-medium py-0.5 px-1.5",
              isPositive 
                ? "bg-accent-green bg-opacity-10 text-accent-green" 
                : "bg-accent-red bg-opacity-10 text-accent-red"
            )}>
              {isPositive ? <ArrowUp className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDown className="h-2.5 w-2.5 mr-0.5" />}
              <span>{changePercent}</span>
            </div>
          )}
        </div>
        
        {/* Value */}
        <p className={cn(
          "text-xl font-bold",
          change && !isPositive ? "text-accent-red" : "",
          change && isPositive ? "text-accent-green" : "",
          "dark:text-white"
        )}>
          {value}
        </p>
        
        {/* Asset distribution bars - made smaller */}
        {assetDistribution ? (
          <div className="grid grid-cols-7 gap-0.5 mt-2">
            <div className="h-1.5 rounded-full bg-primary"></div>
            <div className="h-1.5 rounded-full bg-secondary"></div>
            <div className="h-1.5 rounded-full bg-accent-green"></div>
            <div className="h-1.5 rounded-full bg-accent-yellow"></div>
            <div className="h-1.5 rounded-full bg-accent-red"></div>
            <div className="h-1.5 rounded-full bg-purple-500"></div>
            <div className="h-1.5 rounded-full bg-gray-400"></div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
