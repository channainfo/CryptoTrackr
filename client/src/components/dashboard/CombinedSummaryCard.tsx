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
      <CardContent className="p-2 sm:p-3 md:p-4 h-full flex flex-col">
        {/* Title - more compact on mobile */}
        <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 md:mb-4 text-primary dark:text-primary-foreground">
          Portfolio Summary
        </h3>

        {/* Summary items grid with improved responsive layout */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-2 sm:gap-3 flex-grow">
          {items.map((item, index) => (
            <div
              key={index}
              className="summary-item bg-background dark:bg-zinc-800 p-1.5 sm:p-3 rounded-md border border-border dark:border-zinc-700 shadow-sm"
            >
              {/* Title and icon row - more compact on mobile */}
              <div className="flex justify-between items-center mb-0.5 sm:mb-1.5">
                <div className="flex items-center gap-1">
                  {item.icon && (
                    <div className="bg-primary bg-opacity-10 text-primary rounded-full p-1 sm:p-1.5">
                      {item.icon}
                    </div>
                  )}
                  <h3 className="text-foreground dark:text-gray-200 text-[10px] sm:text-xs font-medium line-clamp-1">
                    {item.title}
                  </h3>
                </div>

                {/* Change percentage badge - more compact on mobile */}
                {item.changePercent && (
                  <div
                    className={cn(
                      "flex items-center rounded-full text-[9px] sm:text-xs font-medium py-0.5 px-1 sm:px-1.5",
                      item.isPositive
                        ? "bg-accent-green bg-opacity-10 text-accent-green"
                        : "bg-accent-red bg-opacity-10 text-accent-red",
                    )}
                  >
                    {item.isPositive ? (
                      <ArrowUp className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" />
                    ) : (
                      <ArrowDown className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" />
                    )}
                    <span className="text-[8px] sm:text-[10px] md:text-xs">
                      {item.changePercent}
                    </span>
                  </div>
                )}
              </div>

              {/* Value with responsive sizing - more compact on mobile */}
              <p
                className={cn(
                  "text-base sm:text-lg md:text-xl lg:text-2xl font-bold mt-0.5 sm:mt-1 truncate",
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

        {/* Asset distribution bars - shown at the bottom if enabled - more compact on mobile */}
        {showDistributionBars && (
          <div className="mt-2 sm:mt-3 md:mt-4 pt-1 sm:pt-2 border-t border-border dark:border-zinc-700">
            <h4 className="text-[9px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">
              Asset Distribution
            </h4>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              <div className="h-1 sm:h-2 rounded-full bg-primary"></div>
              <div className="h-1 sm:h-2 rounded-full bg-secondary"></div>
              <div className="h-1 sm:h-2 rounded-full bg-accent-green"></div>
              <div className="h-1 sm:h-2 rounded-full bg-accent-yellow"></div>
              <div className="h-1 sm:h-2 rounded-full bg-accent-red"></div>
              <div className="h-1 sm:h-2 rounded-full bg-purple-500"></div>
              <div className="h-1 sm:h-2 rounded-full bg-gray-400"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CombinedSummaryCard;
