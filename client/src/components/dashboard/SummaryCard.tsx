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
    <Card className="shadow-sm border border-gray-100">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-neutral-mid text-sm">{title}</h3>
            <p className={cn(
              "text-2xl font-bold mt-1",
              change && !isPositive ? "text-accent-red" : "",
              change && isPositive ? "text-accent-green" : ""
            )}>
              {value}
            </p>
          </div>
          {(change && changePercent) ? (
            <div className={cn(
              "flex items-center px-2 py-1 rounded-full text-xs font-medium",
              isPositive 
                ? "bg-accent-green bg-opacity-10 text-accent-green" 
                : "bg-accent-red bg-opacity-10 text-accent-red"
            )}>
              {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              <span>{changePercent}</span>
            </div>
          ) : icon ? (
            <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-full">
              {icon}
            </div>
          ) : null}
        </div>
        
        {assetDistribution ? (
          <div className="grid grid-cols-7 gap-1 mt-2">
            <div className="h-2 rounded-full bg-primary"></div>
            <div className="h-2 rounded-full bg-secondary"></div>
            <div className="h-2 rounded-full bg-accent-green"></div>
            <div className="h-2 rounded-full bg-accent-yellow"></div>
            <div className="h-2 rounded-full bg-accent-red"></div>
            <div className="h-2 rounded-full bg-purple-500"></div>
            <div className="h-2 rounded-full bg-gray-400"></div>
          </div>
        ) : (
          <div className="h-12 w-full">
            <div className="crypto-chart"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
