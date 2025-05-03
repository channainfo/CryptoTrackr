import { useState } from "react";
import { PlusIcon, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import SummaryCard from "@/components/dashboard/SummaryCard";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import AssetTable from "@/components/dashboard/AssetTable";
import TransactionList from "@/components/dashboard/TransactionList";
import MarketTrends from "@/components/dashboard/MarketTrends";
import PortfolioSelector from "@/components/dashboard/PortfolioSelector";
import AddCryptoModal from "@/components/modals/AddCryptoModal";
import { usePortfolio } from "@/hooks/usePortfolio";

const Dashboard = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const { portfolioSummary, isLoading } = usePortfolio(selectedPortfolioId);
  
  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  };
  
  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-neutral-mid mt-1">Overview of your crypto portfolio</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <PortfolioSelector onPortfolioChange={handlePortfolioChange} />
            <Button onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Crypto
            </Button>
          </div>
        </div>
        
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard 
            title="Total Balance" 
            value={isLoading ? "Loading..." : `$${portfolioSummary.totalValue.toLocaleString()}`}
            changePercent={`${portfolioSummary.totalChangePercent > 0 ? '+' : ''}${portfolioSummary.totalChangePercent.toFixed(1)}%`}
            isPositive={portfolioSummary.totalChangePercent >= 0}
          />
          
          <SummaryCard 
            title="24h Change" 
            value={isLoading ? "Loading..." : `${portfolioSummary.dayChange >= 0 ? '+' : ''}$${Math.abs(portfolioSummary.dayChange).toLocaleString()}`}
            changePercent={`${portfolioSummary.dayChangePercent > 0 ? '+' : ''}${portfolioSummary.dayChangePercent.toFixed(1)}%`}
            isPositive={portfolioSummary.dayChangePercent >= 0}
          />
          
          <SummaryCard 
            title="Monthly Performance" 
            value={isLoading ? "Loading..." : `${portfolioSummary.monthChange >= 0 ? '+' : ''}$${Math.abs(portfolioSummary.monthChange).toLocaleString()}`}
            changePercent={`${portfolioSummary.monthChangePercent > 0 ? '+' : ''}${portfolioSummary.monthChangePercent.toFixed(1)}%`}
            isPositive={portfolioSummary.monthChangePercent >= 0}
          />
          
          <SummaryCard 
            title="Number of Assets" 
            value={isLoading ? "Loading..." : portfolioSummary.assetCount.toString()}
            icon={<Coins className="h-4 w-4" />}
            assetDistribution={true}
          />
        </div>
        
        {/* Portfolio Chart Section */}
        <div className="mb-6">
          <PortfolioChart portfolioId={selectedPortfolioId} />
        </div>
        
        {/* Asset Breakdown */}
        <AssetTable portfolioId={selectedPortfolioId} />
        
        {/* Recent Transactions & Market Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TransactionList portfolioId={selectedPortfolioId} />
          <MarketTrends />
        </div>
      </div>
      
      <AddCryptoModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </>
  );
};

export default Dashboard;
