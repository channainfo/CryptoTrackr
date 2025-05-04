import { useState, useEffect } from "react";
import {
  Calculator,
  Landmark,
  CreditCard,
  Coins,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import BudgetAllocationEngine from "@/components/budget/BudgetAllocationEngine";
import PortfolioSelector, {
  Portfolio,
} from "@/components/dashboard/PortfolioSelector";

const BudgetPlanner = () => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<
    string | undefined
  >(undefined);
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(
    null,
  );
  const [firstLoad, setFirstLoad] = useState(true);

  // Fetch sentiment data for the budget engine
  const { data: sentimentData } = useQuery<{
    sentiment?: { score: number; mood: string };
  }>({
    queryKey: ["/api/crypto/sentiment"],
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch all portfolios
  const { data: portfolios } = useQuery({
    queryKey: ["/api/portfolios"],
    queryFn: async () => {
      const response = await fetch("/api/portfolios");
      if (!response.ok) {
        throw new Error("Failed to fetch portfolios");
      }
      return response.json();
    },
  });

  // Set default portfolio on first load
  useEffect(() => {
    if (
      firstLoad &&
      portfolios &&
      portfolios.length > 0 &&
      !selectedPortfolioId
    ) {
      // Find default portfolio or use the first one
      const defaultPortfolio =
        portfolios.find((p: Portfolio) => p.isDefault) || portfolios[0];
      if (defaultPortfolio) {
        setSelectedPortfolioId(defaultPortfolio.id);
        setCurrentPortfolio(defaultPortfolio);
      }
      setFirstLoad(false);
    }
  }, [portfolios, selectedPortfolioId, firstLoad]);

  // Update current portfolio when it changes
  useEffect(() => {
    if (selectedPortfolioId && portfolios) {
      const portfolio = portfolios.find(
        (p: Portfolio) => p.id === selectedPortfolioId,
      );
      if (portfolio) {
        setCurrentPortfolio(portfolio);
      }
    }
  }, [selectedPortfolioId, portfolios]);

  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Budget Planner</h2>
          <p className="text-muted-foreground mt-1">
            {currentPortfolio ? (
              <span>
                Planning for:{" "}
                <span className="font-medium">{currentPortfolio.name}</span>
                {currentPortfolio.description && (
                  <span className="text-sm italic ml-2">
                    ({currentPortfolio.description})
                  </span>
                )}
              </span>
            ) : (
              "Plan your crypto investment budget"
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <PortfolioSelector
            onPortfolioChange={handlePortfolioChange}
            currentPortfolioId={selectedPortfolioId}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Engine */}
        <div className="lg:col-span-2">
          <BudgetAllocationEngine
            portfolioId={selectedPortfolioId}
            marketSentiment={sentimentData?.sentiment}
          />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Landmark className="mr-2 h-4 w-4" />
                Investment Tips
              </CardTitle>
              <CardDescription>
                Smart crypto investing practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <DollarSign className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    Only invest money you can afford to lose. Cryptocurrencies
                    are high-risk investments.
                  </span>
                </li>
                <li className="flex items-start">
                  <CreditCard className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    Build an emergency fund before allocating significant
                    amounts to crypto investments.
                  </span>
                </li>
                <li className="flex items-start">
                  <Coins className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    Diversify your crypto portfolio across multiple assets to
                    reduce risk.
                  </span>
                </li>
                <li className="flex items-start">
                  <Calculator className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    Consider dollar-cost averaging by investing a fixed amount
                    regularly rather than all at once.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-4 w-4" />
                About The Budget Planner
              </CardTitle>
              <CardDescription>How it works</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-2">
                The Budget Allocation Engine helps you determine how much of
                your monthly surplus to allocate to crypto investments based on:
              </p>
              <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
                <li>Your financial situation</li>
                <li>Risk tolerance level</li>
                <li>Investment timeframe</li>
                <li>Financial goals</li>
                <li>Current market conditions</li>
              </ul>
              <p className="mt-3">
                The recommendations are personalized suggestions, not financial
                advice. Always do your own research before investing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;
