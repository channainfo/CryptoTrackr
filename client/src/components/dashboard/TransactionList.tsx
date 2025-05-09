import { Card, CardContent } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Transaction } from "@/types/crypto";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TransactionListProps {
  limit?: number;
  showViewAll?: boolean;
  portfolioId?: string;
  transactionType?: 'buy' | 'sell' | 'all';
  showTypeTabs?: boolean;
}

const TransactionList = ({ 
  limit = 3, 
  showViewAll = true, 
  portfolioId,
  transactionType = 'all',
  showTypeTabs = false
}: TransactionListProps) => {
  const { transactions, isLoading } = usePortfolio(portfolioId);
  const [activeType, setActiveType] = useState<'all' | 'buy' | 'sell'>(transactionType);
  
  // Get filtered transactions based on type
  const getFilteredTransactions = (type: 'all' | 'buy' | 'sell') => {
    const filtered = type === 'all' 
      ? transactions 
      : transactions.filter(tx => tx.type === type);
    
    // Apply limit if specified
    return limit ? filtered.slice(0, limit) : filtered;
  };
  
  const renderTransactionList = (type: 'all' | 'buy' | 'sell') => {
    const txList = getFilteredTransactions(type);
    
    return (
      <div className="space-y-4">
        {isLoading ? (
          Array(limit).fill(0).map((_, index) => (
            <div key={index} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
                <div className="ml-2 sm:ml-3">
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                  <Skeleton className="h-2 sm:h-3 w-20 sm:w-32 mt-1" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 ml-auto" />
                <Skeleton className="h-2 sm:h-3 w-16 sm:w-20 ml-auto mt-1" />
              </div>
            </div>
          ))
        ) : (
          txList.map((tx: Transaction) => (
            <div key={tx.id} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 px-2 rounded-md transition-colors">
              <div className="flex items-center">
                <div className={`${tx.type === 'buy' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} p-1 sm:p-2 rounded-full`}>
                  {tx.type === 'buy' ? (
                    <ArrowDown className={`h-3 w-3 sm:h-4 sm:w-4 text-accent-green`} />
                  ) : (
                    <ArrowUp className={`h-3 w-3 sm:h-4 sm:w-4 text-accent-red`} />
                  )}
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm font-medium dark:text-white line-clamp-1">
                    {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.cryptoName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-neutral-mid dark:text-gray-400">
                    {format(new Date(tx.timestamp), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium font-mono dark:text-white">
                  {tx.type === 'buy' ? '+' : '-'}{tx.quantity} {tx.cryptoSymbol}
                </p>
                <p className="text-[10px] sm:text-xs text-neutral-mid dark:text-gray-400">
                  ${tx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))
        )}
        
        {txList.length === 0 && !isLoading && (
          <div className="py-6 text-center text-neutral-mid dark:text-gray-400">
            No transactions yet.
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">
            Recent Transactions
          </h3>
          {showViewAll && (
            <button 
              className="text-primary text-xs sm:text-sm font-medium dark:text-blue-400"
              onClick={() => {
                // Find the Transactions tab and click it to navigate to the Transactions tab
                const tabs = document.querySelectorAll('[role="tab"]');
                tabs.forEach((tab) => {
                  if (tab.textContent?.includes("Transactions")) {
                    (tab as HTMLElement).click();
                    // Scroll back to top after tab change
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                });
              }}
            >
              View All
            </button>
          )}
        </div>
        
        {showTypeTabs ? (
          <Tabs defaultValue={activeType} onValueChange={(value) => setActiveType(value as 'all' | 'buy' | 'sell')} className="w-full">
            <TabsList className="mb-3 sm:mb-4 grid grid-cols-3 w-full">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-1 sm:py-1.5">All</TabsTrigger>
              <TabsTrigger value="buy" className="text-xs sm:text-sm py-1 sm:py-1.5">Buy</TabsTrigger>
              <TabsTrigger value="sell" className="text-xs sm:text-sm py-1 sm:py-1.5">Sell</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="m-0">
              {renderTransactionList('all')}
            </TabsContent>
            <TabsContent value="buy" className="m-0">
              {renderTransactionList('buy')}
            </TabsContent>
            <TabsContent value="sell" className="m-0">
              {renderTransactionList('sell')}
            </TabsContent>
          </Tabs>
        ) : (
          renderTransactionList(activeType)
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionList;