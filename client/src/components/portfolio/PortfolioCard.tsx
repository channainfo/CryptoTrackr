import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Portfolio } from "@shared/schema";
import { PortfolioAsset } from "@/types/crypto";
import { ArrowRight, Coins, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface PortfolioCardProps {
  portfolio: Portfolio;
  assets: PortfolioAsset[];
}

const PortfolioCard = ({ portfolio, assets }: PortfolioCardProps) => {
  const [, setLocation] = useLocation();
  
  // Calculate total portfolio value
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  
  // Get performance data 
  const totalChangePercent = assets.length > 0 
    ? assets.reduce((sum, asset) => sum + asset.priceChangePercentage24h * (asset.value / totalValue), 0)
    : 0;
  
  // Calculate number of assets
  const assetCount = assets.length;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const viewPortfolioDetails = () => {
    setLocation(`/portfolio/${portfolio.id}`);
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-800 dark:bg-zinc-900">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold dark:text-white">{portfolio.name}</h3>
            <p className="text-neutral-mid text-sm dark:text-gray-400">
              {portfolio.description || `Created ${new Date(portfolio.createdAt).toLocaleDateString()}`}
            </p>
          </div>
          {portfolio.isDefault && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-medium">
              Default
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex flex-col space-y-1">
            <span className="text-neutral-mid text-sm flex items-center">
              <Coins className="h-4 w-4 mr-1" /> Total Value
            </span>
            <span className="text-xl font-semibold dark:text-white">
              {formatCurrency(totalValue)}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-neutral-mid text-sm flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" /> Performance (24h)
            </span>
            <span className={`text-xl font-semibold ${
              totalChangePercent > 0 
                ? 'text-green-500' 
                : totalChangePercent < 0 
                  ? 'text-red-500' 
                  : 'text-neutral-dark dark:text-gray-300'
            }`}>
              {formatPercent(totalChangePercent)}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-neutral-mid text-sm">Assets</span>
            <span className="text-xl font-semibold dark:text-white">{assetCount}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button 
          variant="outline" 
          className="w-full justify-between"
          onClick={viewPortfolioDetails}
        >
          View Details
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PortfolioCard;