import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ArrowUpDown, Settings2, CircleDollarSign } from "lucide-react";
import { useCryptoData } from "@/hooks/useCryptoData";
import { usePortfolio } from "@/hooks/usePortfolio";
import { CryptoAsset, PortfolioAsset } from "@/types/crypto";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type SortField = "rank" | "name" | "holdings" | "value" | "price" | "change" | "marketCap";
type SortDirection = "asc" | "desc";

interface ColumnVisibility {
  rank: boolean;
  asset: boolean;
  holdings: boolean;
  value: boolean;
  price: boolean;
  change: boolean;
  marketCap: boolean;
  chart: boolean;
}

const Markets = () => {
  const { marketData, isLoading: isLoadingMarket } = useCryptoData();
  const { assets: portfolioAssets = [], isLoading: isLoadingPortfolio } = usePortfolio();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    rank: true,
    asset: true,
    holdings: true,
    value: true,
    price: true,
    change: true,
    marketCap: true,
    chart: true,
  });
  
  // Create a map of owned assets for quick lookup
  const ownedAssetsMap = useMemo(() => {
    const map = new Map<string, PortfolioAsset>();
    if (portfolioAssets) {
      portfolioAssets.forEach(asset => {
        map.set(asset.symbol, asset);
      });
    }
    return map;
  }, [portfolioAssets]);

  // Filter and sort market data
  const sortedAndFilteredData = useMemo(() => {
    // Apply search filter
    let filtered = searchTerm
      ? marketData.filter(
          (crypto) =>
            crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : marketData;
    
    // Apply the owned filter if enabled
    if (showOwnedOnly) {
      filtered = filtered.filter(crypto => ownedAssetsMap.has(crypto.symbol));
    }
    
    // Then sort
    return [...filtered].sort((a, b) => {
      let compareResult = 0;
      
      // Sort based on the selected field
      switch(sortField) {
        case 'rank':
          compareResult = 0; // Already sorted by rank in the API
          break;
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'holdings':
          // Get holding quantities from the owned assets map, default to 0 if not owned
          const aHoldings = ownedAssetsMap.has(a.symbol) ? ownedAssetsMap.get(a.symbol)?.quantity || 0 : 0;
          const bHoldings = ownedAssetsMap.has(b.symbol) ? ownedAssetsMap.get(b.symbol)?.quantity || 0 : 0;
          compareResult = aHoldings - bHoldings;
          break;
        case 'value':
          // Get holding values from the owned assets map, default to 0 if not owned
          const aValue = ownedAssetsMap.has(a.symbol) ? ownedAssetsMap.get(a.symbol)?.value || 0 : 0;
          const bValue = ownedAssetsMap.has(b.symbol) ? ownedAssetsMap.get(b.symbol)?.value || 0 : 0;
          compareResult = aValue - bValue;
          break;
        case 'price':
          compareResult = a.currentPrice - b.currentPrice;
          break;
        case 'change':
          compareResult = a.priceChangePercentage24h - b.priceChangePercentage24h;
          break;
        case 'marketCap':
          // Using currentPrice * 1000000 as a proxy for market cap in this example
          compareResult = (a.currentPrice * 1000000) - (b.currentPrice * 1000000);
          break;
        default:
          compareResult = 0;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [marketData, searchTerm, sortField, sortDirection, showOwnedOnly, ownedAssetsMap]);
  
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
      // Otherwise, set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Function to determine background color based on symbol
  const getBgColor = (symbol: string) => {
    const colors: Record<string, string> = {
      BTC: "bg-yellow-100 text-yellow-600",
      ETH: "bg-blue-100 text-blue-600",
      SOL: "bg-green-100 text-green-600",
      DOT: "bg-purple-100 text-purple-600",
      ADA: "bg-indigo-100 text-indigo-600",
      XRP: "bg-red-100 text-red-600",
      BNB: "bg-amber-100 text-amber-600",
    };

    return colors[symbol] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <div>
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold dark:text-white">Markets</h2>
          <p className="text-neutral-mid dark:text-gray-400 mt-1">
            Explore cryptocurrency market prices and trends
          </p>
        </div>

        {/* Search and Column Settings */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full md:w-auto">
            <Input
              placeholder="Search for cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
            <div className="absolute left-3 top-2.5 text-neutral-mid">
              <Search className="h-4 w-4" />
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            {/* Show Owned Only Toggle */}
            <div className="flex items-center space-x-2 mr-2">
              <Button 
                variant={showOwnedOnly ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowOwnedOnly(!showOwnedOnly)}
                className={showOwnedOnly ? "bg-primary/90 text-white" : ""}
              >
                <CircleDollarSign className="h-4 w-4 mr-2" />
                {showOwnedOnly ? "My Assets" : "All Assets"}
              </Button>
            </div>
            
            {/* Column Visibility Menu */}
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
                  checked={columnVisibility.rank}
                  onCheckedChange={() => toggleColumn('rank')}
                >
                  Rank (#)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.asset}
                  onCheckedChange={() => toggleColumn('asset')}
                >
                  Asset
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
                  checked={columnVisibility.price}
                  onCheckedChange={() => toggleColumn('price')}
                >
                  Price
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.change}
                  onCheckedChange={() => toggleColumn('change')}
                >
                  24h %
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.marketCap}
                  onCheckedChange={() => toggleColumn('marketCap')}
                >
                  Market Cap
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={columnVisibility.chart}
                  onCheckedChange={() => toggleColumn('chart')}
                >
                  Chart
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Market Data Table */}
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  {columnVisibility.rank && (
                    <th 
                      className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-left text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('rank')}
                    >
                      <div className="flex items-center">
                        <span>Rank</span>
                        {sortField === 'rank' && (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </th>
                  )}
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
                  {columnVisibility.marketCap && (
                    <th 
                      className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('marketCap')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Market Cap</span>
                        {sortField === 'marketCap' && (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </th>
                  )}
                  {columnVisibility.chart && (
                    <th className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider">
                      Chart
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingMarket || isLoadingPortfolio ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <tr key={index}>
                        {columnVisibility.rank && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-4" />
                          </td>
                        )}
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
                        {columnVisibility.holdings && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-4 w-16 ml-auto" />
                          </td>
                        )}
                        {columnVisibility.value && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-4 w-24 ml-auto" />
                          </td>
                        )}
                        {columnVisibility.price && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-4 w-20 ml-auto" />
                          </td>
                        )}
                        {columnVisibility.change && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-4 w-16 ml-auto" />
                          </td>
                        )}
                        {columnVisibility.marketCap && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-4 w-28 ml-auto" />
                          </td>
                        )}
                        {columnVisibility.chart && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-8 w-16 ml-auto" />
                          </td>
                        )}
                      </tr>
                    ))
                ) : sortedAndFilteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Object.values(columnVisibility).filter(Boolean).length}
                      className="px-6 py-8 text-center text-neutral-mid dark:text-gray-400"
                    >
                      No cryptocurrencies found matching your search.
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredData.map(
                    (crypto: CryptoAsset, index: number) => (
                      <tr
                        key={crypto.id}
                        className="hover:bg-neutral-lighter dark:hover:bg-zinc-800 transition-colors"
                      >
                        {columnVisibility.rank && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">
                            {index + 1}
                          </td>
                        )}
                        {columnVisibility.asset && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full ${getBgColor(crypto.symbol)}`}
                              >
                                <span className="text-xs font-mono">
                                  {crypto.symbol}
                                </span>
                              </div>
                              <div className="ml-4 flex flex-col">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium dark:text-white">
                                    {crypto.name}
                                  </p>
                                  {ownedAssetsMap.has(crypto.symbol) && (
                                    <Badge variant="outline" className="ml-2 px-1.5 py-0 h-4 bg-primary/10 border-primary/20 text-primary">
                                      <span className="text-[9px]">OWNED</span>
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <p className="text-xs text-neutral-mid dark:text-gray-400">
                                    {crypto.symbol}
                                  </p>
                                  {ownedAssetsMap.has(crypto.symbol) && (
                                    <p className="text-xs ml-2 text-primary">
                                      {ownedAssetsMap.get(crypto.symbol)?.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}
                        {columnVisibility.holdings && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium dark:text-white">
                            {ownedAssetsMap.has(crypto.symbol) ? (
                              ownedAssetsMap.get(crypto.symbol)?.quantity.toLocaleString(undefined, { 
                                minimumFractionDigits: 0, 
                                maximumFractionDigits: 8 
                              })
                            ) : (
                              <span className="text-neutral-mid dark:text-gray-500">-</span>
                            )}
                          </td>
                        )}
                        {columnVisibility.value && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium dark:text-white">
                            {ownedAssetsMap.has(crypto.symbol) ? (
                              `$${ownedAssetsMap.get(crypto.symbol)?.value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}`
                            ) : (
                              <span className="text-neutral-mid dark:text-gray-500">-</span>
                            )}
                          </td>
                        )}
                        {columnVisibility.price && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium dark:text-white">
                            $
                            {crypto.currentPrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        )}
                        {columnVisibility.change && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span
                              className={`text-sm font-medium ${crypto.priceChangePercentage24h >= 0 ? "text-accent-green" : "text-accent-red"}`}
                            >
                              {crypto.priceChangePercentage24h >= 0 ? "+" : ""}
                              {crypto.priceChangePercentage24h.toFixed(1)}%
                            </span>
                          </td>
                        )}
                        {columnVisibility.marketCap && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium dark:text-white">
                            $
                            {(crypto.currentPrice * 1000000).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 0 },
                            )}
                          </td>
                        )}
                        {columnVisibility.chart && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div
                              className={`h-8 w-16 ${crypto.priceChangePercentage24h >= 0 ? "bg-green-50 dark:bg-green-900" : "bg-red-50 dark:bg-red-900"} rounded-sm ml-auto overflow-hidden relative`}
                            >
                              <div className="absolute inset-0 opacity-60">
                                <svg
                                  viewBox="0 0 100 20"
                                  preserveAspectRatio="none"
                                  className="w-full h-full"
                                >
                                  <path
                                    d={
                                      crypto.priceChangePercentage24h >= 0
                                        ? "M0,10 L10,8 L20,12 L30,7 L40,9 L50,5 L60,8 L70,4 L80,8 L90,6 L100,10"
                                        : "M0,8 L10,10 L20,7 L30,9 L40,11 L50,12 L60,13 L70,10 L80,12 L90,11 L100,12"
                                    }
                                    stroke={
                                      crypto.priceChangePercentage24h >= 0
                                        ? "#10B981"
                                        : "#EF4444"
                                    }
                                    strokeWidth="1.5"
                                    fill="none"
                                  />
                                </svg>
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Markets;
