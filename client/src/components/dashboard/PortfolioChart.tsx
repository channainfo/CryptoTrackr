import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from "recharts";
import { TimeRange, ChartData } from "@/types/crypto";
import { usePortfolio } from "@/hooks/usePortfolio";

interface TimeRangeButtonProps {
  range: TimeRange;
  activeRange: TimeRange;
  onClick: (range: TimeRange) => void;
}

const TimeRangeButton = ({ range, activeRange, onClick }: TimeRangeButtonProps) => (
  <button
    className={`px-3 py-1 rounded-md text-sm ${
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

const PortfolioChart = ({ className = '', portfolioId }: PortfolioChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("1D");
  const { getPortfolioChartData } = usePortfolio(portfolioId);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  useEffect(() => {
    const data = getPortfolioChartData(timeRange);
    setChartData(data);
  }, [timeRange, getPortfolioChartData]);
  
  const timeRanges: TimeRange[] = ["1D", "1W", "1M", "1Y", "ALL"];
  
  return (
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold dark:text-white">Portfolio Performance</h3>
            <p className="text-neutral-mid text-sm dark:text-gray-400">Track your crypto portfolio performance</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            {timeRanges.map(range => (
              <TimeRangeButton
                key={range}
                range={range}
                activeRange={timeRange}
                onClick={setTimeRange}
              />
            ))}
          </div>
        </div>
        
        <div className="h-64 mt-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
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
                tickMargin={10}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                className="dark:text-gray-400"
              />
              <YAxis 
                dataKey="value"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                width={80}
                className="dark:text-gray-400"
              />
              <CartesianGrid 
                vertical={false} 
                stroke="#F3F4F6" 
                className="dark:stroke-gray-700"
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioChart;
