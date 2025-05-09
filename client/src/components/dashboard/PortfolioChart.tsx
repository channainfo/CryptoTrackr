import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TimeRange } from "@/types/crypto";
import { usePortfolio } from "@/hooks/usePortfolio";

interface TimeRangeButtonProps {
  range: TimeRange;
  activeRange: TimeRange;
  onClick: (range: TimeRange) => void;
}

const TimeRangeButton = ({
  range,
  activeRange,
  onClick,
}: TimeRangeButtonProps) => (
  <button
    className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs ${
      activeRange === range
        ? "bg-primary text-white"
        : "bg-neutral-light dark:bg-zinc-700 text-neutral-dark dark:text-gray-300"
    }`}
    onClick={() => onClick(range)}
  >
    {range}
  </button>
);

interface PortfolioChartProps {
  className?: string;
  portfolioId?: string;
}

const PortfolioChart = ({
  className = "",
  portfolioId,
}: PortfolioChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("1D");
  const { getPortfolioChartData, isLoading } = usePortfolio(portfolioId);

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    return getPortfolioChartData(timeRange);
  }, [portfolioId, timeRange, getPortfolioChartData]);

  const timeRanges: TimeRange[] = ["1D", "1W", "1M", "1Y", "ALL"];

  return (
    <Card
      className={`shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900 h-full ${className}`}
    >
      <CardContent className="p-3 sm:p-4 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between mb-2 sm:mb-4">
          <div className="mb-2 sm:mb-0">
            <h3 className="text-xs sm:text-sm font-semibold text-primary dark:text-primary-foreground">
              Portfolio Chart
            </h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {timeRanges.map((range) => (
              <TimeRangeButton
                key={range}
                range={range}
                activeRange={timeRange}
                onClick={setTimeRange}
              />
            ))}
          </div>
        </div>

        <div className="flex-grow mt-2 relative min-h-[250px] md:min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[250px] bg-neutral-lighter dark:bg-zinc-800 rounded">
              <div className="text-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <p className="text-xs text-neutral-mid">
                  Loading portfolio data...
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={5}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  className="dark:text-gray-400"
                  height={20}
                />
                <YAxis
                  dataKey="value"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  width={60}
                  className="dark:text-gray-400"
                />
                <CartesianGrid
                  vertical={false}
                  stroke="#F3F4F6"
                  className="dark:stroke-gray-700"
                  strokeDasharray="3 3"
                />
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Value",
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioChart;
