import { useState } from "react";
import { ArrowLeft, PlusIcon, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoute, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import AssetTable from "@/components/dashboard/AssetTable";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import TransactionList from "@/components/dashboard/TransactionList";
import AddCryptoModal from "@/components/modals/AddCryptoModal";
import { usePortfolio } from "@/hooks/usePortfolio";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useOnboarding } from "@/hooks/use-onboarding";

const PortfolioDetail = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/portfolio/:id");
  const portfolioId = params?.id;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { portfolioSummary, isLoading } = usePortfolio(portfolioId);
  
  // Setup onboarding tour for portfolio page
  const { showTour, handleTourComplete } = useOnboarding('portfolio');
  
  const handleBack = () => {
    setLocation("/portfolio");
  };
  
  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold dark:text-white">Portfolio Details</h2>
              <p className="text-neutral-mid dark:text-gray-400 mt-1">View and manage this portfolio</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="add-asset-button"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Crypto
            </Button>
          </div>
        </div>
        
        {/* Portfolio Summary */}
        {isLoading ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <div>
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <div>
                  <Skeleton className="h-5 w-20 mb-1" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-lighter dark:bg-zinc-800 rounded-lg">
                <p className="text-sm text-neutral-mid dark:text-gray-400">Total Balance</p>
                <p className="text-2xl font-bold mt-1 dark:text-white">${portfolioSummary.totalValue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-neutral-lighter dark:bg-zinc-800 rounded-lg">
                <p className="text-sm text-neutral-mid dark:text-gray-400">24h Change</p>
                <p className={`text-2xl font-bold mt-1 ${portfolioSummary.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {portfolioSummary.dayChange >= 0 ? '+' : ''}{portfolioSummary.dayChange.toLocaleString()}
                  <span className="text-sm ml-1">({portfolioSummary.dayChangePercent.toFixed(1)}%)</span>
                </p>
              </div>
              <div className="p-4 bg-neutral-lighter dark:bg-zinc-800 rounded-lg">
                <p className="text-sm text-neutral-mid dark:text-gray-400">Asset Count</p>
                <p className="text-2xl font-bold mt-1 dark:text-white">{portfolioSummary.assetCount}</p>
              </div>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="overview" className="w-full">
          <div className="tabs-wrapper portfolio-tabs">
            <div className="overflow-x-auto overflow-y-hidden pb-2 no-scrollbar">
              <TabsList className="mb-4 inline-flex min-w-max w-[500px] md:w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <TabsContent value="overview">
            {/* Portfolio Chart */}
            <div className="mb-6 portfolio-chart">
              <PortfolioChart portfolioId={portfolioId} />
            </div>
            
            {/* Top Assets */}
            <h3 className="text-xl font-semibold mb-4 dark:text-white">Top Assets</h3>
            <div className="portfolio-assets">
              <AssetTable limit={5} showViewAll={true} portfolioId={portfolioId} />
            </div>
            
            {/* Recent Transactions */}
            <h3 className="text-xl font-semibold my-6 dark:text-white">Recent Transactions</h3>
            <TransactionList limit={5} showViewAll={true} portfolioId={portfolioId} />
          </TabsContent>
          
          <TabsContent value="assets">
            <AssetTable showViewAll={false} portfolioId={portfolioId} />
          </TabsContent>
          
          <TabsContent value="transactions">
            <TransactionList showViewAll={false} portfolioId={portfolioId} />
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="text-center py-12 bg-neutral-lighter dark:bg-zinc-800 rounded-xl">
              <p className="text-neutral-mid dark:text-gray-400">
                Advanced analytics will be available soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <AddCryptoModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        portfolioId={portfolioId}
      />
      
      {/* Onboarding wizard */}
      <OnboardingWizard
        tourId="portfolio"
        showTour={showTour}
        onComplete={handleTourComplete}
        steps={[
          {
            target: '.portfolio-tabs',
            content: 'Navigate between different views of your portfolio.',
            disableBeacon: true,
            placement: 'bottom',
          },
          {
            target: '.portfolio-chart',
            content: 'This chart shows your portfolio performance over time.',
            placement: 'bottom',
          },
          {
            target: '.portfolio-assets',
            content: 'View all cryptocurrencies in your portfolio, including current value and performance.',
            placement: 'top',
          },
          {
            target: '.add-asset-button',
            content: 'Click here to add new cryptocurrencies to your portfolio.',
            placement: 'left',
          },
        ]}
      />
    </>
  );
};

export default PortfolioDetail;