import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TransactionList from "@/components/dashboard/TransactionList";
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
            <h2 className="text-2xl font-bold dark:text-white">Transactions</h2>
            <p className="text-neutral-mid dark:text-gray-400 mt-1">
              Your cryptocurrency transaction history
            </p>
          </div>
          <div className="mt-4 sm:mt-0 space-x-2">
            <Button onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Transactions Tabs */}
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-zinc-900 mb-6">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="buy">Buy Orders</TabsTrigger>
                <TabsTrigger value="sell">Sell Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <TransactionList
                  limit={20}
                  showViewAll={false}
                  transactionType="all"
                />
              </TabsContent>

              <TabsContent value="buy">
                <TransactionList
                  limit={20}
                  showViewAll={false}
                  transactionType="buy"
                />
              </TabsContent>

              <TabsContent value="sell">
                <TransactionList
                  limit={20}
                  showViewAll={false}
                  transactionType="sell"
                />
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
