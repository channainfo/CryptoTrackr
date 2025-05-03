import { useState, useEffect } from "react";
import { PlusIcon, Coins, LineChart, BadgeDollarSign, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import SummaryCard from "@/components/dashboard/SummaryCard";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import PortfolioPerformance from "@/components/dashboard/PortfolioPerformance";
import PortfolioRebalance from "@/components/dashboard/PortfolioRebalance";
import AssetTable from "@/components/dashboard/AssetTable";
import TransactionList from "@/components/dashboard/TransactionList";
import MarketTrends from "@/components/dashboard/MarketTrends";
import MarketSentiment from "@/components/dashboard/MarketSentiment";
import { NewsWidget } from "@/components/dashboard/NewsWidget";
import PortfolioSelector, { Portfolio } from "@/components/dashboard/PortfolioSelector";
import AddCryptoModal from "@/components/modals/AddCryptoModal";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuery } from "@tanstack/react-query";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useOnboarding } from "@/hooks/use-onboarding";

const Dashboard = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | undefined>(undefined);
  const { portfolioSummary, isLoading } = usePortfolio(selectedPortfolioId);
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  
  // Setup onboarding tour for dashboard
  const { showTour, handleTourComplete } = useOnboarding('dashboard');

  // Fetch all portfolios
  const { data: portfolios, isLoading: loadingPortfolios } = useQuery({
    queryKey: ['/api/portfolios'],
    queryFn: async () => {
      const response = await fetch('/api/portfolios');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolios');
      }
      return response.json();
    }
  });

  // Set default portfolio on first load
  useEffect(() => {
    if (firstLoad && portfolios && portfolios.length > 0 && !selectedPortfolioId) {
      // Find default portfolio or use the first one
      const defaultPortfolio = portfolios.find((p: Portfolio) => p.isDefault) || portfolios[0];
      if (defaultPortfolio) {
        setSelectedPortfolioId(defaultPortfolio.id);
        setCurrentPortfolio(defaultPortfolio);
      }
      setFirstLoad(false);
    }
  }, [portfolios, selectedPortfolioId, firstLoad]);

  // Update current portfolio when it changes
  useEffect(() => {
    if (selectedPortfolioId && portfolios) {
      const portfolio = portfolios.find((p: Portfolio) => p.id === selectedPortfolioId);
      if (portfolio) {
        setCurrentPortfolio(portfolio);
      }
    }
  }, [selectedPortfolioId, portfolios]);
  
  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  };

  const handleRecordValue = async () => {
    if (!selectedPortfolioId) return;

    try {
      const response = await fetch(`/api/portfolios/${selectedPortfolioId}/history/record`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to record portfolio value');
      }

      toast({
        title: "Portfolio value recorded",
        description: "Current portfolio value has been saved for historical tracking",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to record value",
        description: "There was an error recording the portfolio value. Please try again.",
      });
    }
  };
  
  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8 dashboard-overview">
        {/* Dashboard Header */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              {currentPortfolio ? (
                <span>
                  Portfolio: <span className="font-medium">{currentPortfolio.name}</span>
                  {currentPortfolio.description && (
                    <span className="text-sm italic ml-2">({currentPortfolio.description})</span>
                  )}
                </span>
              ) : (
                "Select a portfolio to view its details"
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2 quick-actions">
            <div className="portfolio-selector">
              <PortfolioSelector 
                onPortfolioChange={handlePortfolioChange} 
                currentPortfolioId={selectedPortfolioId}
              />
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              className="add-asset-button"
              disabled={!selectedPortfolioId}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Crypto
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRecordValue}
              disabled={!selectedPortfolioId || isLoading}
              title="Record current portfolio value for historical tracking"
            >
              <LineChart className="h-4 w-4 mr-1" />
              Record Value
            </Button>
          </div>
        </div>
        
        {loadingPortfolios ? (
          // Loading state for portfolios
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : selectedPortfolioId ? (
          // Portfolio content when a portfolio is selected
          <>
            {/* Portfolio Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 portfolio-summary">
              <SummaryCard 
                title="Total Balance" 
                value={isLoading ? "Loading..." : `$${portfolioSummary.totalValue.toLocaleString()}`}
                changePercent={`${portfolioSummary.totalChangePercent > 0 ? '+' : ''}${portfolioSummary.totalChangePercent.toFixed(1)}%`}
                isPositive={portfolioSummary.totalChangePercent >= 0}
                icon={<BadgeDollarSign className="h-4 w-4" />}
              />
              
              <SummaryCard 
                title="24h Change" 
                value={isLoading ? "Loading..." : `${portfolioSummary.dayChange >= 0 ? '+' : ''}$${Math.abs(portfolioSummary.dayChange).toLocaleString()}`}
                changePercent={`${portfolioSummary.dayChangePercent > 0 ? '+' : ''}${portfolioSummary.dayChangePercent.toFixed(1)}%`}
                isPositive={portfolioSummary.dayChangePercent >= 0}
                icon={<ArrowUpDown className="h-4 w-4" />}
              />
              
              <SummaryCard 
                title="Monthly Performance" 
                value={isLoading ? "Loading..." : `${portfolioSummary.monthChange >= 0 ? '+' : ''}$${Math.abs(portfolioSummary.monthChange).toLocaleString()}`}
                changePercent={`${portfolioSummary.monthChangePercent > 0 ? '+' : ''}${portfolioSummary.monthChangePercent.toFixed(1)}%`}
                isPositive={portfolioSummary.monthChangePercent >= 0}
                icon={<LineChart className="h-4 w-4" />}
              />
              
              <SummaryCard 
                title="Number of Assets" 
                value={isLoading ? "Loading..." : portfolioSummary.assetCount.toString()}
                icon={<Coins className="h-4 w-4" />}
                assetDistribution={true}
              />
            </div>
            
            {/* Portfolio Chart Section */}
            <div className="mb-6 portfolio-chart">
              <PortfolioChart portfolioId={selectedPortfolioId} />
            </div>
            
            {/* Asset Breakdown */}
            <div className="asset-allocation">
              <AssetTable portfolioId={selectedPortfolioId} />
            </div>
            
            {/* Portfolio Performance & Rebalance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="portfolio-performance">
                <PortfolioPerformance portfolioId={selectedPortfolioId} />
              </div>
              <div className="portfolio-rebalance">
                <PortfolioRebalance portfolioId={selectedPortfolioId} />
              </div>
            </div>
            
            {/* Recent Transactions & Market Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="transactions-list lg:col-span-2">
                <TransactionList portfolioId={selectedPortfolioId} />
              </div>
              <div className="space-y-6">
                <div className="market-trends">
                  <MarketTrends />
                </div>
                <div className="market-sentiment">
                  <MarketSentiment />
                </div>
                <div className="crypto-news">
                  <NewsWidget />
                </div>
              </div>
            </div>
          </>
        ) : (
          // No portfolio selected state
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Welcome to Trailer</CardTitle>
                <CardDescription>
                  Please select a portfolio or create a new one to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  With Trailer, you can:
                </p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>Track multiple cryptocurrency portfolios</li>
                  <li>Monitor real-time performance and ROI</li>
                  <li>Analyze historical data with interactive charts</li>
                  <li>Record portfolio values to track your growth</li>
                </ul>
                <Button className="w-full" onClick={() => setIsAddModalOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Your First Portfolio
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <AddCryptoModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        portfolioId={selectedPortfolioId}
      />
      
      {/* Onboarding wizard */}
      <OnboardingWizard
        tourId="dashboard"
        showTour={showTour}
        onComplete={handleTourComplete}
        steps={[
          {
            target: '.dashboard-overview',
            content: 'This is your main dashboard where you can see an overview of your cryptocurrency portfolio performance.',
            disableBeacon: true,
            placement: 'bottom',
          },
          {
            target: '.portfolio-selector',
            content: 'Switch between your different portfolios using this selector.',
            placement: 'bottom',
          },
          {
            target: '.portfolio-summary',
            content: 'View your portfolio summary including total value and 24-hour performance.',
            placement: 'left',
          },
          {
            target: '.asset-allocation',
            content: 'This chart shows your asset allocation across different cryptocurrencies.',
            placement: 'top',
          },
          {
            target: '.market-sentiment',
            content: 'The market sentiment indicator shows the overall market mood to help with your investment decisions.',
            placement: 'left',
          },
          {
            target: '.quick-actions',
            content: 'Use these quick actions to add crypto, record values, and manage your portfolio.',
            placement: 'top',
          },
          {
            target: '.crypto-news',
            content: 'Get personalized crypto news recommendations based on your portfolio holdings.',
            placement: 'left',
          }
        ]}
      />
    </>
  );
};

export default Dashboard;
