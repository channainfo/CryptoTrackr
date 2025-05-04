import React, { useState, useEffect } from "react";
import { BarChart3, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PortfolioAnalyticsTab from "@/components/portfolio/PortfolioAnalyticsTab";
import AchievementGrid from "@/components/achievement/AchievementGrid";
import { useAchievements } from "@/hooks/useAchievements";

// Achievement section for the analytics page
const AchievementSection: React.FC<{ portfolioId: string }> = ({
  portfolioId,
}) => {
  const { achievements, isLoading } = useAchievements(portfolioId);

  return (
    <div className="space-y-6">
      <AchievementGrid achievements={achievements} isLoading={isLoading} />
    </div>
  );
};

const AnalyticsPage = () => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null,
  );
  const [currentPortfolio, setCurrentPortfolio] = useState<any>(null);

  // Fetch all portfolios
  const { data: portfolios, isLoading: isLoadingPortfolios } = useQuery({
    queryKey: ["/api/portfolios"],
    select: (data: any[]) => data.filter((p) => !p.isWatchlist),
  });

  // Set default portfolio when data is loaded
  useEffect(() => {
    if (portfolios && portfolios.length > 0 && !selectedPortfolioId) {
      const defaultPortfolio =
        portfolios.find((p: any) => p.isDefault) || portfolios[0];
      setSelectedPortfolioId(defaultPortfolio.id);
      setCurrentPortfolio(defaultPortfolio);
    }
  }, [portfolios, selectedPortfolioId]);

  // Update current portfolio when it changes
  useEffect(() => {
    if (selectedPortfolioId && portfolios) {
      const portfolio = portfolios.find(
        (p: any) => p.id === selectedPortfolioId,
      );
      if (portfolio) {
        setCurrentPortfolio(portfolio);
      }
    }
  }, [selectedPortfolioId, portfolios]);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Analytics</h2>
          <p className="text-muted-foreground mt-1">
            {currentPortfolio ? (
              <span>
                Track and analyze performance for:{" "}
                <span className="font-medium">{currentPortfolio.name}</span>
                {currentPortfolio.description && (
                  <span className="text-sm italic ml-2">
                    ({currentPortfolio.description})
                  </span>
                )}
              </span>
            ) : (
              "Select a portfolio to view analytics"
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="portfolio-selector">
            {isLoadingPortfolios ? (
              <Skeleton className="h-9 w-[180px]" />
            ) : (
              <Select
                value={selectedPortfolioId || undefined}
                onValueChange={(value) => setSelectedPortfolioId(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios?.map((portfolio: any) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      {selectedPortfolioId ? (
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <PortfolioAnalyticsTab portfolioId={selectedPortfolioId} />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementSection portfolioId={selectedPortfolioId} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12 bg-muted rounded-xl">
          <p className="text-muted-foreground">
            {isLoadingPortfolios
              ? "Loading portfolios..."
              : portfolios?.length === 0
                ? "No portfolios found. Create a portfolio to see analytics."
                : "Select a portfolio to view analytics."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
