import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

type TimeframeOption = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

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

export default function PortfolioPerformance({ portfolioId }: PortfolioPerformanceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const { toast } = useToast();

  const fetchPerformanceData = async () => {
    if (!portfolioId) return;
    
    try {
      setIsLoading(true);
      const response = await apiRequest({
        url: `/api/portfolios/${portfolioId}/performance?period=${timeframe}`,
        method: 'GET'
      });
      
      setPerformanceData(response as PerformanceData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch performance data',
        variant: 'destructive'
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
        method: 'POST'
      });
      
      toast({
        title: 'Success',
        description: 'Historical value recorded successfully',
      });
      
      // Refresh performance data
      fetchPerformanceData();
    } catch (error) {
      console.error('Error recording historical value:', error);
      toast({
        title: 'Error',
        description: 'Failed to record historical value',
        variant: 'destructive'
      });
    } finally {
      setIsRecording(false);
    }
  };

  // Format date for the chart
  const formatChartData = (data: PerformanceData | null) => {
    if (!data || !data.historical) return [];
    
    return data.historical.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      value: parseFloat(item.totalValue),
      invested: parseFloat(item.totalInvested),
      profit: parseFloat(item.profitLoss)
    }));
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [portfolioId, timeframe]);

  return (
    <Card className="col-span-12">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Performance History</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={recordHistoricalValue}
            disabled={isRecording}
          >
            {isRecording ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : 'Record Value'}
          </Button>
        </div>
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
              <div className="grid grid-cols-3 gap-4 mb-4">
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
                  <h4 className="text-sm font-medium text-gray-500">Percent Change</h4>
                  <p className={`text-2xl font-bold ${performanceData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {performanceData.changePercent.toFixed(2)}%
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
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="invested" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-center text-gray-500">
                No performance data available.<br />
                Click "Record Value" to start tracking portfolio performance.
              </p>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}