import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryItem {
  title: string;
  value: string;
  changePercent?: string;
  isPositive?: boolean;
  icon?: ReactNode;
}

interface CombinedSummaryCardProps {
  items: SummaryItem[];
  className?: string;
  showDistributionBars?: boolean;
}

const CombinedSummaryCard = ({
  items,
  className = "",
  showDistributionBars = false,
}: CombinedSummaryCardProps) => {
  return (
    <Card
      className={cn(
        "shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900 h-full",
        className,
      )}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Title */}
        <h3 className="text-sm font-semibold mb-4 text-primary dark:text-primary-foreground">Portfolio Summary</h3>
        
        {/* Summary items grid with increased spacing and better visual separation */}
        <div className="grid grid-cols-2 gap-4 flex-grow">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="summary-item bg-background dark:bg-zinc-800 p-3 rounded-md border border-border dark:border-zinc-700 shadow-sm"
            >
              {/* Title and icon row */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {item.icon && (
                    <div className="bg-primary bg-opacity-10 text-primary rounded-full p-2">
                      {item.icon}
                    </div>
                  )}
                  <h3 className="text-foreground dark:text-gray-200 text-xs font-medium">
                    {item.title}
                  </h3>
                </div>

                {/* Change percentage badge */}
                {item.changePercent && (
                  <div
                    className={cn(
                      "flex items-center rounded-full text-xs font-medium py-1 px-2",
                      item.isPositive
                        ? "bg-accent-green bg-opacity-10 text-accent-green"
                        : "bg-accent-red bg-opacity-10 text-accent-red",
                    )}
                  >
                    {item.isPositive ? (
                      <ArrowUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-0.5" />
                    )}
                    <span>{item.changePercent}</span>
                  </div>
                )}
              </div>

              {/* Value with increased size */}
              <p
                className={cn(
                  "text-2xl font-bold mt-1",
                  item.changePercent && !item.isPositive
                    ? "text-accent-red"
                    : "",
                  item.changePercent && item.isPositive
                    ? "text-accent-green"
                    : "",
                  "dark:text-white",
                )}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Asset distribution bars - shown at the bottom if enabled */}
        {showDistributionBars && (
          <div className="mt-4 pt-2 border-t border-border dark:border-zinc-700">
            <h4 className="text-xs text-muted-foreground mb-2">Asset Distribution</h4>
            <div className="grid grid-cols-7 gap-1">
              <div className="h-2 rounded-full bg-primary"></div>
              <div className="h-2 rounded-full bg-secondary"></div>
              <div className="h-2 rounded-full bg-accent-green"></div>
              <div className="h-2 rounded-full bg-accent-yellow"></div>
              <div className="h-2 rounded-full bg-accent-red"></div>
              <div className="h-2 rounded-full bg-purple-500"></div>
              <div className="h-2 rounded-full bg-gray-400"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CombinedSummaryCard;
