import { useState } from "react";
import { PlusIcon, FolderPlus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import PortfolioCard from "@/components/portfolio/PortfolioCard";
import { usePortfolios } from "@/hooks/usePortfolios";
import { CryptoTerm } from "@/components/education/CryptoTerm";
import { Link } from "wouter";

const Portfolio = () => {
  const [, setLocation] = useLocation();
  const { portfoliosWithAssets, isLoading } = usePortfolios();
  
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">My Portfolios</h2>
          <p className="text-neutral-mid dark:text-gray-400 mt-1">
            View and manage your <CryptoTerm termKey="portfolio-diversification">diversified</CryptoTerm> cryptocurrency portfolios
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-2">
          <Button onClick={() => setLocation("/portfolio/create")}>
            <FolderPlus className="h-4 w-4 mr-1" />
            Create Portfolio
          </Button>
          <Button variant="outline" asChild>
            <Link href="/learning/glossary">
              <BookOpen className="h-4 w-4 mr-1" />
              Crypto Glossary
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Portfolios</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((item) => (
                <div key={item} className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <Skeleton className="h-8 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <Skeleton className="h-4 w-4/5 mb-2" />
                      <Skeleton className="h-6 w-2/3" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-4/5 mb-2" />
                      <Skeleton className="h-6 w-2/3" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-4/5 mb-2" />
                      <Skeleton className="h-6 w-2/3" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : portfoliosWithAssets.length === 0 ? (
            // Empty state
            <div className="text-center py-12 bg-neutral-lighter dark:bg-zinc-800 rounded-xl">
              <div className="max-w-md mx-auto">
                <FolderPlus className="h-12 w-12 text-neutral-mid mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2 dark:text-white">No Portfolios Found</h3>
                <p className="text-neutral-mid dark:text-gray-400 mb-6">
                  Create your first portfolio to start <CryptoTerm termKey="hodl">holding</CryptoTerm> and <CryptoTerm termKey="dca">investing</CryptoTerm> in crypto assets.
                </p>
                <Button onClick={() => setLocation("/portfolio/create")}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Portfolio
                </Button>
              </div>
            </div>
          ) : (
            // Portfolio grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfoliosWithAssets.map((item) => (
                <PortfolioCard 
                  key={item.portfolio.id} 
                  portfolio={item.portfolio} 
                  assets={item.assets} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active">
          <div className="text-center py-12 bg-neutral-lighter dark:bg-zinc-800 rounded-xl">
            <p className="text-neutral-mid dark:text-gray-400">
              Active portfolios will be displayed here.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="watchlist">
          <div className="text-center py-12 bg-neutral-lighter dark:bg-zinc-800 rounded-xl">
            <p className="text-neutral-mid dark:text-gray-400">
              Watchlist portfolios will be displayed here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Portfolio;
