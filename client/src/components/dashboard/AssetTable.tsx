import { usePortfolio } from "@/hooks/usePortfolio";
import { Card } from "@/components/ui/card";
import { MoreHorizontal, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PortfolioAsset } from "@/types/crypto";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetTableProps {
  limit?: number;
  showViewAll?: boolean;
}

const AssetTable = ({ limit, showViewAll = true }: AssetTableProps) => {
  const { assets, isLoading, removeAssetFromPortfolio } = usePortfolio();
  
  const displayedAssets = limit ? assets.slice(0, limit) : assets;
  
  // Function to determine background color based on symbol
  const getBgColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'BTC': 'bg-yellow-100 text-yellow-600',
      'ETH': 'bg-blue-100 text-blue-600',
      'SOL': 'bg-green-100 text-green-600',
      'DOT': 'bg-purple-100 text-purple-600',
      'ADA': 'bg-indigo-100 text-indigo-600',
      'XRP': 'bg-red-100 text-red-600',
      'BNB': 'bg-amber-100 text-amber-600'
    };
    
    return colors[symbol] || 'bg-gray-100 text-gray-600';
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Your Assets</h3>
        {showViewAll && (
          <button className="flex items-center text-primary text-sm font-medium">
            View All
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>
      
      <Card className="shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-neutral-light text-left text-xs font-medium text-neutral-mid uppercase tracking-wider">Asset</th>
              <th className="px-6 py-3 bg-neutral-light text-right text-xs font-medium text-neutral-mid uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 bg-neutral-light text-right text-xs font-medium text-neutral-mid uppercase tracking-wider">Holdings</th>
              <th className="px-6 py-3 bg-neutral-light text-right text-xs font-medium text-neutral-mid uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 bg-neutral-light text-right text-xs font-medium text-neutral-mid uppercase tracking-wider">24h</th>
              <th className="px-6 py-3 bg-neutral-light text-right text-xs font-medium text-neutral-mid uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array(4).fill(0).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-12 mt-1" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </td>
                </tr>
              ))
            ) : (
              displayedAssets.map((asset: PortfolioAsset) => (
                <tr key={asset.id} className="hover:bg-neutral-lighter transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full ${getBgColor(asset.symbol)}`}>
                        <span className="text-xs font-mono">{asset.symbol}</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">{asset.name}</p>
                        <p className="text-xs text-neutral-mid">{asset.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium">
                    ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <p className="font-mono">{asset.quantity} {asset.symbol}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-medium ${asset.priceChangePercentage24h >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {asset.priceChangePercentage24h >= 0 ? '+' : ''}{asset.priceChangePercentage24h.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="text-primary hover:text-primary-dark">
                        <MoreHorizontal className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Buy More</DropdownMenuItem>
                        <DropdownMenuItem>Sell</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => removeAssetFromPortfolio(asset.id)}>
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
            {displayedAssets.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-mid">
                  No assets in your portfolio. Add some to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AssetTable;
