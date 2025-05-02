import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssetTable from "@/components/dashboard/AssetTable";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import AddCryptoModal from "@/components/modals/AddCryptoModal";
import { usePortfolio } from "@/hooks/usePortfolio";

const Portfolio = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { portfolioSummary } = usePortfolio();
  
  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Portfolio</h2>
            <p className="text-neutral-mid dark:text-gray-400 mt-1">Manage your cryptocurrency holdings</p>
          </div>
          <div className="mt-4 sm:mt-0 space-x-2">
            <Button onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Crypto
            </Button>
          </div>
        </div>
        
        {/* Portfolio Summary */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-lighter dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-neutral-mid dark:text-gray-400">Total Balance</p>
              <p className="text-2xl font-bold mt-1 dark:text-white">${portfolioSummary.totalValue.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-neutral-lighter dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-neutral-mid dark:text-gray-400">24h Change</p>
              <p className={`text-2xl font-bold mt-1 ${portfolioSummary.dayChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
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
        
        {/* Portfolio Chart */}
        <div className="mb-6">
          <PortfolioChart />
        </div>
        
        {/* Assets Table (showing all assets) */}
        <AssetTable showViewAll={false} />
      </div>
      
      <AddCryptoModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </>
  );
};

export default Portfolio;
