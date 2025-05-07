import { useState, useMemo } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  ArrowUpRight, 
  ExternalLink, 
  ShoppingCart, 
  TrendingDown, 
  ArrowUpDown,
  Settings2 
} from "lucide-react";
import { PortfolioAsset } from "@/types/crypto";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import AddCryptoModal from "@/components/modals/AddCryptoModal";
import SellCryptoModal from "@/components/modals/SellCryptoModal";

type SortField = "name" | "price" | "holdings" | "value" | "change";
type SortDirection = "asc" | "desc";

interface ColumnVisibility {
  asset: boolean;
  price: boolean;
  holdings: boolean;
  value: boolean;
  change: boolean;
  actions: boolean;
}

interface AssetTableProps {
  limit?: number;
  showViewAll?: boolean;
  portfolioId?: string;
}

const AssetTable = ({ limit, showViewAll = true, portfolioId }: AssetTableProps) => {
  const { assets, isLoading, removeAssetFromPortfolio } = usePortfolio(portfolioId);
  const [, navigate] = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<PortfolioAsset | null>(null);
  
  // Add sorting state
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Add column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    asset: true,
    price: true,
    holdings: true,
    value: true,
    change: true,
    actions: true
  });
  
  // Sort assets
  const sortedAssets = useMemo(() => {
    let filtered = assets || [];
    
    // Apply limit if needed
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    
    // Sort the data
    return [...filtered].sort((a, b) => {
      let compareResult = 0;
      
      // Sort based on the selected field
      switch(sortField) {
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'price':
          compareResult = a.currentPrice - b.currentPrice;
          break;
        case 'holdings':
          compareResult = a.quantity - b.quantity;
          break;
        case 'value':
          compareResult = a.value - b.value;
          break;
        case 'change':
          compareResult = a.priceChangePercentage24h - b.priceChangePercentage24h;
          break;
        default:
          compareResult = 0;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [assets, limit, sortField, sortDirection]);
  
  // Toggle column visibility
  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility({
      ...columnVisibility,
      [column]: !columnVisibility[column]
    });
  };
  
  // Toggle sort direction for a field
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleBuyMore = (asset: PortfolioAsset) => {
    setSelectedAsset(asset);
    setIsAddModalOpen(true);
  };
  
  const handleSell = (asset: PortfolioAsset) => {
    setSelectedAsset(asset);
    setIsSellModalOpen(true);
  };
  
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
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h3 className="text-lg font-semibold dark:text-white">Your Assets</h3>
          <div className="flex gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.asset}
                  onCheckedChange={() => toggleColumn('asset')}
                >
                  Asset
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.price}
                  onCheckedChange={() => toggleColumn('price')}
                >
                  Price
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.holdings}
                  onCheckedChange={() => toggleColumn('holdings')}
                >
                  Holdings
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.value}
                  onCheckedChange={() => toggleColumn('value')}
                >
                  Value
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.change}
                  onCheckedChange={() => toggleColumn('change')}
                >
                  24h %
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.actions}
                  onCheckedChange={() => toggleColumn('actions')}
                >
                  Actions
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {showViewAll && (
              <Button variant="ghost" size="sm" className="text-primary text-sm font-medium flex items-center">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
        
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto dark:bg-zinc-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                {columnVisibility.asset && (
                  <th 
                    className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-left text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center">
                      <span>Asset</span>
                      {sortField === 'name' && (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                )}
                {columnVisibility.price && (
                  <th 
                    className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('price')}
                  >
                    <div className="flex items-center justify-end">
                      <span>Price</span>
                      {sortField === 'price' && (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                )}
                {columnVisibility.holdings && (
                  <th 
                    className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('holdings')}
                  >
                    <div className="flex items-center justify-end">
                      <span>Holdings</span>
                      {sortField === 'holdings' && (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                )}
                {columnVisibility.value && (
                  <th 
                    className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('value')}
                  >
                    <div className="flex items-center justify-end">
                      <span>Value</span>
                      {sortField === 'value' && (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                )}
                {columnVisibility.change && (
                  <th 
                    className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('change')}
                  >
                    <div className="flex items-center justify-end">
                      <span>24h %</span>
                      {sortField === 'change' && (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </th>
                )}
                {columnVisibility.actions && (
                  <th className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <tr key={index}>
                    {columnVisibility.asset && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="ml-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-12 mt-1" />
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.price && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </td>
                    )}
                    {columnVisibility.holdings && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                    )}
                    {columnVisibility.value && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </td>
                    )}
                    {columnVisibility.change && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </td>
                    )}
                    {columnVisibility.actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Skeleton className="h-4 w-8 ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : sortedAssets.length === 0 ? (
                <tr>
                  <td 
                    colSpan={Object.values(columnVisibility).filter(Boolean).length}
                    className="px-6 py-8 text-center text-neutral-mid dark:text-gray-400"
                  >
                    No assets in your portfolio. Add some to get started!
                  </td>
                </tr>
              ) : (
                sortedAssets.map((asset: PortfolioAsset) => (
                  <tr 
                    key={asset.id} 
                    className="hover:bg-neutral-lighter dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    onClick={() => navigate(`/token/${asset.id}`)}
                  >
                    {columnVisibility.asset && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full ${getBgColor(asset.symbol)}`}>
                            <span className="text-xs font-mono">{asset.symbol}</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium dark:text-white">{asset.name}</p>
                            <p className="text-xs text-neutral-mid dark:text-gray-400">{asset.symbol}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {columnVisibility.price && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium dark:text-white">
                        ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )}
                    {columnVisibility.holdings && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm dark:text-white">
                        <p className="font-mono">{asset.quantity} {asset.symbol}</p>
                      </td>
                    )}
                    {columnVisibility.value && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium dark:text-white">
                        ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )}
                    {columnVisibility.change && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${asset.priceChangePercentage24h >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {asset.priceChangePercentage24h >= 0 ? '+' : ''}{asset.priceChangePercentage24h.toFixed(1)}%
                        </span>
                      </td>
                    )}
                    {columnVisibility.actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300">
                            <MoreHorizontal className="h-5 w-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/token/${asset.id}`)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBuyMore(asset)}>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Buy More
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSell(asset)}>
                              <TrendingDown className="h-4 w-4 mr-2" />
                              Sell
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => removeAssetFromPortfolio(asset.id)}>
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
      
      {/* Buy More Modal */}
      <AddCryptoModal 
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedAsset(null);
        }}
        portfolioId={portfolioId}
      />
      
      {/* Sell Modal */}
      {selectedAsset && isSellModalOpen && (
        <SellCryptoModal
          isOpen={true}
          onClose={() => {
            setIsSellModalOpen(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
          portfolioId={portfolioId}
        />
      )}
    </>
  );
};

export default AssetTable;
