import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

type TimeframeOption = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

interface HistoricalValue {
  date: string;
  totalValue: string;
  totalInvested: string;
  profitLoss: string;
  profitLossPercentage: string;
}

interface PerformanceData {
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  changeValue: number;
  changePercent: number;
  historical: HistoricalValue[];
}

interface PortfolioPerformanceProps {
  portfolioId: string;
}

export default function PortfolioPerformance({
  portfolioId,
}: PortfolioPerformanceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1M");
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);
  const { toast } = useToast();

  const fetchPerformanceData = async () => {
    if (!portfolioId) return;

    try {
      setIsLoading(true);
      const response = await apiRequest({
        url: `/api/portfolios/${portfolioId}/performance?period=${timeframe}`,
        method: "GET",
      });

      setPerformanceData(response);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch performance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recordHistoricalValue = async () => {
    if (!portfolioId) return;

    try {
      setIsRecording(true);
      await apiRequest({
        url: `/api/portfolios/${portfolioId}/history/record`,
        method: "POST",
      });

      toast({
        title: "Success",
        description: "Historical value recorded successfully",
      });

      // Refresh performance data
      fetchPerformanceData();
    } catch (error) {
      console.error("Error recording historical value:", error);
      toast({
        title: "Error",
        description: "Failed to record historical value",
        variant: "destructive",
      });
    } finally {
      setIsRecording(false);
    }
  };

  // Format date for the chart
  const formatChartData = (data: PerformanceData | null) => {
    if (!data || !data.historical) return [];

    return data.historical.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      value: parseFloat(item.totalValue),
      invested: parseFloat(item.totalInvested),
      profit: parseFloat(item.profitLoss),
    }));
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [portfolioId, timeframe]);

  return (
    <Card className="col-span-12 min-h-[400px] md:min-h-[500px]">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">
          Performance History
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={recordHistoricalValue}
            disabled={isRecording}
            className="text-xs sm:text-sm h-8 px-2 sm:px-3"
          >
            {isRecording ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Value"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        <Tabs
          defaultValue="1M"
          value={timeframe}
          onValueChange={(v) => setTimeframe(v as TimeframeOption)}
        >
          <TabsList className="mb-4 overflow-x-auto flex w-full no-scrollbar pb-1">
            <TabsTrigger value="1D" className="text-xs">
              1D
            </TabsTrigger>
            <TabsTrigger value="1W" className="text-xs">
              1W
            </TabsTrigger>
            <TabsTrigger value="1M" className="text-xs">
              1M
            </TabsTrigger>
            <TabsTrigger value="3M" className="text-xs">
              3M
            </TabsTrigger>
            <TabsTrigger value="6M" className="text-xs">
              6M
            </TabsTrigger>
            <TabsTrigger value="1Y" className="text-xs">
              1Y
            </TabsTrigger>
            <TabsTrigger value="ALL" className="text-xs">
              ALL
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="h-60 sm:h-80 flex items-center justify-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
            </div>
          ) : performanceData ? (
            <div className="mb-2">
              {/* Performance Data section*/}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4 mb-4">
                <div className="text-center bg-background dark:bg-zinc-800 p-2 rounded-md border border-border dark:border-zinc-700 shadow-sm">
                  <h4 className="text-xs font-medium text-gray-500">
                    Total Value
                  </h4>
                  <p className="text-lg sm:text-2xl font-bold">
                    ${performanceData.endValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-center bg-background dark:bg-zinc-800 p-2 rounded-md border border-border dark:border-zinc-700 shadow-sm">
                  <h4 className="text-xs font-medium text-gray-500">Change</h4>
                  <p
                    className={`text-lg sm:text-2xl font-bold ${performanceData.changeValue >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    ${performanceData.changeValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-center bg-background dark:bg-zinc-800 p-2 rounded-md border border-border dark:border-zinc-700 shadow-sm">
                  <h4 className="text-xs font-medium text-gray-500">
                    Percent Change
                  </h4>
                  <p
                    className={`text-lg sm:text-2xl font-bold ${performanceData.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {performanceData.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="flex-grow mt-2 relative min-h-[250px] md:min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                  <AreaChart
                    data={formatChartData(performanceData)}
                    margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
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
              </div>
            </div>
          ) : (
            <div className="h-60 sm:h-80 flex items-center justify-center">
              <p className="text-center text-gray-500 text-sm">
                No performance data available.
                <br />
                Click "Record Value" to start tracking portfolio performance.
              </p>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
