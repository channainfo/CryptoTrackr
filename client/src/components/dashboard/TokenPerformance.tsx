import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

type TimeframeOption = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface HistoricalValue {
  date: string;
  price: string;
  quantity: string;
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
  startPrice: number;
  endPrice: number;
  changeValue: number;
  changePercent: number;
  priceChangePercent: number;
  historical: HistoricalValue[];
}

interface TokenPerformanceProps {
  portfolioTokenId: string;
  tokenName: string;
  tokenSymbol: string;
}

export default function TokenPerformance({ portfolioTokenId, tokenName, tokenSymbol }: TokenPerformanceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const { toast } = useToast();

  const fetchPerformanceData = async () => {
    if (!portfolioTokenId) return;
    
    try {
      setIsLoading(true);
      const response = await apiRequest({
        url: `/api/portfolio-tokens/${portfolioTokenId}/performance?period=${timeframe}`,
        method: 'GET'
      });
      
      setPerformanceData(response);
    } catch (error) {
      console.error('Error fetching token performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch token performance data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for the chart
  const formatChartData = (data: PerformanceData | null) => {
    if (!data || !data.historical) return [];
    
    return data.historical.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      value: parseFloat(item.totalValue),
      invested: parseFloat(item.totalInvested),
      price: parseFloat(item.price)
    }));
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [portfolioTokenId, timeframe]);

  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle>{tokenName} ({tokenSymbol}) Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="1M" value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeOption)}>
          <TabsList className="mb-4">
            <TabsTrigger value="1D">1D</TabsTrigger>
            <TabsTrigger value="1W">1W</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
            <TabsTrigger value="3M">3M</TabsTrigger>
            <TabsTrigger value="6M">6M</TabsTrigger>
            <TabsTrigger value="1Y">1Y</TabsTrigger>
            <TabsTrigger value="ALL">ALL</TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : performanceData ? (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-500">Current Price</h4>
                  <p className="text-2xl font-bold">${performanceData.endPrice.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-500">Total Value</h4>
                  <p className="text-2xl font-bold">${performanceData.endValue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-500">Change</h4>
                  <p className={`text-2xl font-bold ${performanceData.changeValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${performanceData.changeValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-500">Price Change</h4>
                  <p className={`text-2xl font-bold ${performanceData.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {performanceData.priceChangePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formatChartData(performanceData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="price" stroke="#ff7f0e" fill="#ff7f0e" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="invested" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-center text-gray-500">
                No performance data available for this token yet.<br />
                Historical data will be recorded when portfolio values are recorded.
              </p>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}