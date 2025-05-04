import React, { useState } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioRiskAssessment } from '@/hooks/useRiskAssessment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import PageHeader from '@/components/layout/PageHeader';
import RiskAssessmentCard from '@/components/risk/RiskAssessmentCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { 
  BarChart, 
  LineChart,
  PieChart,
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Activity, 
  Percent, 
  RefreshCw,
  Info,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type TimeframeOption = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface PerformanceData {
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  changeValue: number;
  changePercent: number;
  historical: {
    date: string;
    totalValue: string;
    totalInvested: string;
    profitLoss: string;
  }[];
}

interface AssetAllocation {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

const PortfolioAnalytics = () => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const { portfolioSummary, assets, isLoading } = usePortfolio(selectedPortfolioId);
  const { data: riskData, isLoading: isRiskLoading } = usePortfolioRiskAssessment(selectedPortfolioId || '');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [isRecordingValue, setIsRecordingValue] = useState(false);
  const { toast } = useToast();
  
  const portfolios = usePortfolio().portfoliosList || [];
  
  // Set default portfolio when data is loaded
  React.useEffect(() => {
    if (!selectedPortfolioId && portfolios && portfolios.length > 0) {
      // Find default portfolio or use the first one
      const defaultPortfolio = portfolios.find((p: any) => p.isDefault) || portfolios[0];
      if (defaultPortfolio) {
        setSelectedPortfolioId(defaultPortfolio.id);
      }
    }
  }, [portfolios, selectedPortfolioId]);
  
  // Fetch performance data when portfolio or timeframe changes
  React.useEffect(() => {
    fetchPerformanceData();
  }, [selectedPortfolioId, timeframe]);
  
  const fetchPerformanceData = async () => {
    if (!selectedPortfolioId) return;
    
    try {
      setIsPerformanceLoading(true);
      const response = await apiRequest({
        url: `/api/portfolios/${selectedPortfolioId}/performance?period=${timeframe}`,
        method: 'GET'
      });
      
      setPerformanceData(response);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch performance data',
        variant: 'destructive'
      });
    } finally {
      setIsPerformanceLoading(false);
    }
  };
  
  const recordPortfolioValue = async () => {
    if (!selectedPortfolioId) return;
    
    try {
      setIsRecordingValue(true);
      await apiRequest({
        url: `/api/portfolios/${selectedPortfolioId}/history/record`,
        method: 'POST'
      });
      
      toast({
        title: 'Success',
        description: 'Portfolio value recorded successfully',
      });
      
      // Refresh performance data
      fetchPerformanceData();
    } catch (error) {
      console.error('Error recording portfolio value:', error);
      toast({
        title: 'Error',
        description: 'Failed to record portfolio value',
        variant: 'destructive'
      });
    } finally {
      setIsRecordingValue(false);
    }
  };
  
  // Calculate asset allocation data
  const assetAllocation: AssetAllocation[] = React.useMemo(() => {
    if (!assets || assets.length === 0 || !portfolioSummary) return [];
    
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500',
      'bg-teal-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
    ];
    
    return assets.map((asset, index) => ({
      name: asset.name,
      symbol: asset.symbol,
      value: asset.value,
      percentage: (asset.value / portfolioSummary.totalValue) * 100,
      color: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [assets, portfolioSummary]);
  
  // Helper function to format percentage changes
  const formatPercentChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };
  
  // Helper function to render performance indicator
  const renderPerformanceIndicator = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    } else {
      return <Activity className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Breadcrumbs 
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', href: '/analytics' }
        ]} 
      />
      
      <PageHeader
        title="Portfolio Analytics"
        description="In-depth analysis of your portfolio performance, risk, and allocation."
        icon={<BarChart className="h-8 w-8" />}
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div className="w-full md:w-64">
          <Select
            value={selectedPortfolioId || ''}
            onValueChange={(value) => setSelectedPortfolioId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select portfolio" />
            </SelectTrigger>
            <SelectContent>
              {portfolios.map((portfolio: any) => (
                <SelectItem key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchPerformanceData}
            disabled={isPerformanceLoading || !selectedPortfolioId}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isPerformanceLoading && "animate-spin")} />
            Refresh
          </Button>
          
          <Button 
            size="sm" 
            onClick={recordPortfolioValue}
            disabled={isRecordingValue || !selectedPortfolioId}
          >
            <DollarSign className={cn("h-4 w-4 mr-2", isRecordingValue && "animate-spin")} />
            Record Value
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Value Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    ${portfolioSummary?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                {!isLoading && performanceData && (
                  <div className="flex items-center mt-1 text-sm">
                    {renderPerformanceIndicator(performanceData.changePercent)}
                    <span className={cn(
                      "ml-1",
                      performanceData.changePercent > 0 ? "text-green-500" :
                      performanceData.changePercent < 0 ? "text-red-500" :
                      "text-yellow-500"
                    )}>
                      {formatPercentChange(performanceData.changePercent)}
                    </span>
                    <span className="ml-1 text-muted-foreground">in last {timeframe}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Asset Count Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {portfolioSummary?.assetCount || 0}
                  </div>
                )}
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 mr-1" />
                  {!isRiskLoading && riskData ? (
                    <span>Diversification score: {riskData.diversificationScore}/10</span>
                  ) : (
                    <span>Diversification analysis loading...</span>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Risk Score Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Risk Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isRiskLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <div className="text-2xl font-bold flex items-center">
                    {riskData ? (
                      <>
                        {riskData.overallRisk.level.toUpperCase()} 
                        <span className="text-sm ml-2 text-muted-foreground">
                          ({riskData.overallRisk.score}/10)
                        </span>
                      </>
                    ) : (
                      "Not available"
                    )}
                  </div>
                )}
                {!isRiskLoading && riskData && (
                  <div className="flex items-center mt-1 text-sm">
                    <AlertTriangle className={cn(
                      "h-4 w-4 mr-1",
                      riskData.overallRisk.level === "low" ? "text-green-500" :
                      riskData.overallRisk.level === "medium" ? "text-yellow-500" :
                      riskData.overallRisk.level === "high" ? "text-orange-500" :
                      "text-red-500"
                    )} />
                    <span className="text-muted-foreground">
                      {riskData.overallRisk.level === "low" ? "Conservative" :
                      riskData.overallRisk.level === "medium" ? "Moderate" :
                      riskData.overallRisk.level === "high" ? "Aggressive" :
                      "Very Aggressive"} profile
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Asset Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Asset Allocation
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="text-sm">
                        This shows how your assets are distributed across your portfolio. 
                        A well-diversified portfolio typically has allocations across different assets.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Distribution of your portfolio assets by value
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  {assetAllocation.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No assets in this portfolio
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Allocation bars */}
                      <div className="space-y-2">
                        {assetAllocation.map((asset) => (
                          <div key={asset.symbol} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <div className="font-medium flex items-center">
                                <div className={cn("w-3 h-3 rounded-full mr-2", asset.color)} />
                                {asset.name} ({asset.symbol})
                              </div>
                              <div className="text-right">
                                <span className="font-medium">${asset.value.toLocaleString()}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({asset.percentage.toFixed(2)}%)
                                </span>
                              </div>
                            </div>
                            <Progress value={asset.percentage} className={cn("h-2", asset.color + "/20")} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Top Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Top Risk Factors
              </CardTitle>
              <CardDescription>
                Key factors affecting your portfolio risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRiskLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <>
                  {!riskData || riskData.factors.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No risk data available for this portfolio
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {riskData.factors.slice(0, 3).map((factor, index) => (
                        <div key={index} className="rounded-lg border p-3 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-semibold">{factor.name}</div>
                            <div className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              factor.impact === "positive" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                              factor.impact === "negative" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" :
                              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            )}>
                              {factor.impact.toUpperCase()}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{factor.description}</p>
                        </div>
                      ))}
                      <div className="text-center pt-2">
                        <Button variant="link" size="sm" asChild>
                          <a href="#risk">View full risk analysis</a>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Timeframe selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="font-medium">Performance Period:</div>
                <div className="flex flex-wrap gap-2">
                  {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as TimeframeOption[]).map((option) => (
                    <Button 
                      key={option}
                      variant={timeframe === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeframe(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Value Change */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Value Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPerformanceLoading || !performanceData ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  <div className="text-2xl font-bold flex items-center">
                    <span className={cn(
                      performanceData.changeValue > 0 ? "text-green-500" :
                      performanceData.changeValue < 0 ? "text-red-500" :
                      "text-yellow-500"
                    )}>
                      {performanceData.changeValue >= 0 ? '+' : ''}
                      ${performanceData.changeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {!isPerformanceLoading && performanceData && (
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 mr-1" />
                    <span>Since {new Date(performanceData.startDate).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Percent Change */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Percent Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPerformanceLoading || !performanceData ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold flex items-center">
                    <span className={cn(
                      performanceData.changePercent > 0 ? "text-green-500" :
                      performanceData.changePercent < 0 ? "text-red-500" :
                      "text-yellow-500"
                    )}>
                      {performanceData.changePercent >= 0 ? '+' : ''}
                      {performanceData.changePercent.toFixed(2)}%
                    </span>
                  </div>
                )}
                {!isPerformanceLoading && performanceData && (
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4 mr-1" />
                    <span>
                      {timeframe === '1Y' 
                        ? 'Annualized return' 
                        : timeframe === '1M' 
                          ? 'Monthly return' 
                          : timeframe === '1W' 
                            ? 'Weekly return' 
                            : 'Period return'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Date Range */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPerformanceLoading || !performanceData ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  <div className="text-sm font-medium">
                    <div>From: {new Date(performanceData.startDate).toLocaleDateString()}</div>
                    <div>To: {new Date(performanceData.endDate).toLocaleDateString()}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Performance Chart */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                Portfolio Value Over Time
              </CardTitle>
              <CardDescription>
                Historical value of your portfolio over the selected timeframe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPerformanceLoading ? (
                <div className="h-64 w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {!performanceData || performanceData.historical.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16">
                      <p>No historical data available for this timeframe</p>
                      <p className="text-sm mt-2">Try recording your portfolio value to start tracking performance</p>
                    </div>
                  ) : (
                    <div className="h-80 w-full">
                      {/* This is a placeholder for a chart component */}
                      <div className="h-full w-full bg-secondary/20 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <LineChart className="h-12 w-12 text-primary mx-auto mb-4" />
                          <p className="text-muted-foreground max-w-md px-4">
                            Chart would display portfolio value over time. 
                            This is a placeholder for an actual chart component.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="mt-4 text-xs text-muted-foreground">
                <Info className="h-3 w-3 inline-block mr-1" />
                Historical data is based on values recorded using the "Record Value" button. 
                For more accurate tracking, record your portfolio value regularly.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Risk Analysis Tab */}
        <TabsContent value="risk" className="space-y-6" id="risk">
          {isRiskLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : (
            <>
              {!riskData ? (
                <div className="text-center py-16">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Risk assessment unavailable</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We couldn't generate a risk assessment for this portfolio at this time.
                    This could be due to insufficient portfolio data or a temporary service issue.
                  </p>
                </div>
              ) : (
                <RiskAssessmentCard data={riskData} isLoading={isRiskLoading} />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioAnalytics;