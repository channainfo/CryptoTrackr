import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TransactionList from "@/components/dashboard/TransactionList";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddCryptoModal from "@/components/modals/AddCryptoModal";
import { PlusIcon } from "lucide-react";

const Transactions = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Transactions</h2>
            <p className="text-neutral-mid mt-1">Your cryptocurrency transaction history</p>
          </div>
          <div className="mt-4 sm:mt-0 space-x-2">
            <Button onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Transaction
            </Button>
          </div>
        </div>
        
        {/* Transactions Tabs */}
        <Card className="shadow-sm border border-gray-100 mb-6">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="buy">Buy Orders</TabsTrigger>
                <TabsTrigger value="sell">Sell Orders</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <TransactionList limit={20} showViewAll={false} />
              </TabsContent>
              
              <TabsContent value="buy">
                <p className="text-neutral-mid py-6 text-center">
                  Filtering by buy transactions will be implemented in a future update.
                </p>
              </TabsContent>
              
              <TabsContent value="sell">
                <p className="text-neutral-mid py-6 text-center">
                  Filtering by sell transactions will be implemented in a future update.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <AddCryptoModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </>
  );
};

export default Transactions;
