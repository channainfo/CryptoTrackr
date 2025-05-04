import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCryptoData } from "@/hooks/useCryptoData";
import { CryptoAsset } from "@/types/crypto";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/container";

const Markets = () => {
  const { marketData, isLoading } = useCryptoData();
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredMarketData = searchTerm
    ? marketData.filter(crypto => 
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : marketData;
  
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
    <Container>
      <div className="py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold dark:text-white">Markets</h2>
          <p className="text-neutral-mid dark:text-gray-400 mt-1">Explore cryptocurrency market prices and trends</p>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Input
              placeholder="Search for cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-2.5 text-neutral-mid">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        {/* Market Data Table */}
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-left text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-left text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider">24h %</th>
                  <th className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider">Market Cap</th>
                  <th className="px-6 py-3 bg-neutral-light dark:bg-zinc-800 text-right text-xs font-medium text-neutral-mid dark:text-gray-300 uppercase tracking-wider">Chart</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  Array(10).fill(0).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-4 w-4" />
                      </td>
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
                        <Skeleton className="h-4 w-28 ml-auto" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredMarketData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-mid dark:text-gray-400">
                      No cryptocurrencies found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredMarketData.map((crypto: CryptoAsset, index: number) => (
                    <tr key={crypto.id} className="hover:bg-neutral-lighter dark:hover:bg-zinc-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full ${getBgColor(crypto.symbol)}`}>
                            <span className="text-xs font-mono">{crypto.symbol}</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium dark:text-white">{crypto.name}</p>
                            <p className="text-xs text-neutral-mid dark:text-gray-400">{crypto.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium dark:text-white">
                        ${crypto.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${crypto.priceChangePercentage24h >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {crypto.priceChangePercentage24h >= 0 ? '+' : ''}{crypto.priceChangePercentage24h.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium dark:text-white">
                        ${(crypto.currentPrice * 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`h-8 w-16 ${crypto.priceChangePercentage24h >= 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'} rounded-sm ml-auto overflow-hidden relative`}>
                          <div className="absolute inset-0 opacity-60">
                            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
                              <path 
                                d={crypto.priceChangePercentage24h >= 0 
                                  ? "M0,10 L10,8 L20,12 L30,7 L40,9 L50,5 L60,8 L70,4 L80,8 L90,6 L100,10" 
                                  : "M0,8 L10,10 L20,7 L30,9 L40,11 L50,12 L60,13 L70,10 L80,12 L90,11 L100,12"}
                                stroke={crypto.priceChangePercentage24h >= 0 ? "#10B981" : "#EF4444"} 
                                strokeWidth="1.5" 
                                fill="none"
                              />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default Markets;
