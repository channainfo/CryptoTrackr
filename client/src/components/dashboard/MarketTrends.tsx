import { Card, CardContent } from "@/components/ui/card";
import { useCryptoData } from "@/hooks/useCryptoData";
import { CryptoAsset } from "@/types/crypto";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketTrendsProps {
  limit?: number;
  showViewAll?: boolean;
}

const MarketTrends = ({ limit = 3, showViewAll = true }: MarketTrendsProps) => {
  const { marketData, isLoading } = useCryptoData();
  
  const displayedTrends = limit ? marketData.slice(0, limit) : marketData;

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
    <Card className="shadow-sm border border-gray-100">
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Market Trends</h3>
          {showViewAll && (
            <button className="text-primary text-sm font-medium">View All</button>
          )}
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            Array(limit).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-5 w-16 ml-auto mt-1" />
                </div>
              </div>
            ))
          ) : (
            displayedTrends.map((crypto: CryptoAsset) => (
              <div key={crypto.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full ${getBgColor(crypto.symbol)}`}>
                    <span className="text-xs font-mono">{crypto.symbol}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{crypto.name}</p>
                    <div className="flex items-center text-xs">
                      <span className={`${crypto.priceChangePercentage24h >= 0 ? 'text-accent-green' : 'text-accent-red'} font-medium`}>
                        {crypto.priceChangePercentage24h >= 0 ? '+' : ''}{crypto.priceChangePercentage24h.toFixed(1)}%
                      </span>
                      <span className="text-neutral-mid ml-2">24h</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium font-mono">
                    ${crypto.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className={`h-5 w-16 ${crypto.priceChangePercentage24h >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-sm mt-1 overflow-hidden relative`}>
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
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketTrends;
