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
  
  // Filter transactions by type if specified
  const filteredTransactions = activeType === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === activeType);
  
  // Apply limit if specified
  const displayedTransactions = limit 
    ? filteredTransactions.slice(0, limit) 
    : filteredTransactions;
  
  const renderTransactionList = () => (
    <div className="space-y-4">
      {isLoading ? (
        Array(limit).fill(0).map((_, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-3 w-20 ml-auto mt-1" />
            </div>
          </div>
        ))
      ) : (
        displayedTransactions.map((tx: Transaction) => (
          <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className={`${tx.type === 'buy' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} p-2 rounded-full`}>
                {tx.type === 'buy' ? (
                  <ArrowDown className={`h-4 w-4 text-accent-green`} />
                ) : (
                  <ArrowUp className={`h-4 w-4 text-accent-red`} />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium dark:text-white">
                  {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.cryptoName}
                </p>
                <p className="text-xs text-neutral-mid dark:text-gray-400">
                  {format(new Date(tx.timestamp), 'MMM d, yyyy • h:mm a')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium font-mono dark:text-white">
                {tx.type === 'buy' ? '+' : '-'}{tx.quantity} {tx.cryptoSymbol}
              </p>
              <p className="text-xs text-neutral-mid dark:text-gray-400">
                ${tx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))
      )}
      
      {displayedTransactions.length === 0 && !isLoading && (
        <div className="py-6 text-center text-neutral-mid dark:text-gray-400">
          No transactions yet.
        </div>
      )}
    </div>
  );

  return (
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900">
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">
            Recent Transactions
          </h3>
          {showViewAll && (
            <button 
              className="text-primary text-sm font-medium dark:text-blue-400"
              onClick={() => {
                // Find and click the transactions tab
                const transactionsTab = document.querySelector('[data-value="transactions"]');
                if (transactionsTab) {
                  (transactionsTab as HTMLElement).click();
                }
              }}
            >
              View All
            </button>
          )}
        </div>
        
        {showTypeTabs ? (
          <Tabs defaultValue={activeType} onValueChange={(value) => setActiveType(value as 'all' | 'buy' | 'sell')} className="w-full">
            <TabsList className="mb-4 grid grid-cols-3 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="m-0">
              {renderTransactionList()}
            </TabsContent>
            <TabsContent value="buy" className="m-0">
              {renderTransactionList()}
            </TabsContent>
            <TabsContent value="sell" className="m-0">
              {renderTransactionList()}
            </TabsContent>
          </Tabs>
        ) : (
          renderTransactionList()
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionList;
