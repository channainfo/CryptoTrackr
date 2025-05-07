import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  RotateCw,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for rebalance suggestions
interface RebalanceSuggestion {
  symbol: string;
  name: string;
  currentAllocation: number;
  targetAllocation: number;
  action: "buy" | "sell";
  amountUsd: number;
  amountCrypto: number;
}

interface PortfolioRebalanceProps {
  portfolioId: string;
}

export default function PortfolioRebalance({
  portfolioId,
}: PortfolioRebalanceProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [riskLevel, setRiskLevel] = useState(3); // 1-5 scale (conservative to aggressive)
  const [showRebalanceConfirm, setShowRebalanceConfirm] = useState(false);

  // Define portfolio asset type
  interface PortfolioAsset {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    value: number;
    currentPrice: number;
    priceChangePercentage24h: number;
  }

  // Fetch portfolio assets
  const {
    data: assets,
    isLoading,
    refetch,
  } = useQuery<PortfolioAsset[]>({
    queryKey: [`/api/portfolios/${portfolioId}/assets`],
    enabled: !!portfolioId,
  });

  // Calculate potential rebalance suggestions
  const getSuggestions = (): RebalanceSuggestion[] => {
    if (!assets || assets.length === 0) return [];

    // Get total portfolio value
    const totalValue = assets.reduce(
      (sum: number, asset: PortfolioAsset) => sum + asset.value,
      0,
    );

    // Basic allocations based on risk level
    // In a real app, this would be more sophisticated based on asset classes, market data, etc.
    const getBtcAllocation = () => {
      switch (riskLevel) {
        case 1:
          return 0.4; // Conservative: 40% BTC
        case 2:
          return 0.45;
        case 3:
          return 0.5; // Balanced: 50% BTC
        case 4:
          return 0.55;
        case 5:
          return 0.6; // Aggressive: 60% BTC
        default:
          return 0.5;
      }
    };

    const getEthAllocation = () => {
      switch (riskLevel) {
        case 1:
          return 0.3; // Conservative: 30% ETH
        case 2:
          return 0.3;
        case 3:
          return 0.3; // Balanced: 30% ETH
        case 4:
          return 0.3;
        case 5:
          return 0.3; // Aggressive: 30% ETH
        default:
          return 0.3;
      }
    };

    // Distribute remaining allocation among other assets
    // This is a simple example - a real app would have more complex allocation logic
    const idealAllocations = new Map();
    const btcAllocation = getBtcAllocation();
    const ethAllocation = getEthAllocation();
    const remainingAllocation = 1 - btcAllocation - ethAllocation;

    // Set ideal allocations
    idealAllocations.set("BTC", btcAllocation);
    idealAllocations.set("ETH", ethAllocation);

    // Count other assets for even distribution of remaining allocation
    const otherAssets = assets.filter(
      (asset: PortfolioAsset) =>
        asset.symbol !== "BTC" && asset.symbol !== "ETH",
    );

    if (otherAssets.length > 0) {
      const perAssetAllocation = remainingAllocation / otherAssets.length;
      otherAssets.forEach((asset) => {
        idealAllocations.set(asset.symbol, perAssetAllocation);
      });
    }

    // Create rebalance suggestions
    const suggestions = assets.map((asset: PortfolioAsset) => {
      const currentAllocation = asset.value / totalValue;
      const targetAllocation = idealAllocations.get(asset.symbol) || 0;
      const difference = targetAllocation - currentAllocation;

      // Difference in USD
      const amountUsd = difference * totalValue;
      // Approximate crypto amount based on current price
      const amountCrypto = asset.currentPrice
        ? amountUsd / asset.currentPrice
        : 0;

      return {
        symbol: asset.symbol,
        name: asset.name,
        currentAllocation,
        targetAllocation,
        action: difference > 0 ? ("buy" as const) : ("sell" as const),
        amountUsd: Math.abs(amountUsd),
        amountCrypto: Math.abs(amountCrypto),
      };
    });

    // Filter to only show meaningful changes (> 1% difference)
    return suggestions
      .filter((s) => Math.abs(s.targetAllocation - s.currentAllocation) > 0.01)
      .sort((a, b) => b.amountUsd - a.amountUsd);
  };

  const suggestions = getSuggestions();

  // Calculate portfolio balance score (0-100)
  const getBalanceScore = (): number => {
    if (!assets || assets.length === 0) return 0;

    const suggestions = getSuggestions();
    if (suggestions.length === 0) return 100;

    // Calculate score based on how far off the portfolio is from ideal allocations
    const totalDeviation = suggestions.reduce(
      (sum, s) => sum + Math.abs(s.targetAllocation - s.currentAllocation),
      0,
    );

    // Convert to score (lower deviation = higher score)
    return Math.max(0, Math.min(100, 100 - totalDeviation * 100));
  };

  const balanceScore = getBalanceScore();

  // Display balance health
  const getBalanceHealth = (): { status: string; color: string } => {
    if (balanceScore >= 90)
      return { status: "Excellent", color: "text-green-500" };
    if (balanceScore >= 75)
      return { status: "Good", color: "text-emerald-500" };
    if (balanceScore >= 60) return { status: "Fair", color: "text-amber-500" };
    if (balanceScore >= 40)
      return { status: "Needs Attention", color: "text-orange-500" };
    return { status: "Unbalanced", color: "text-red-500" };
  };

  const balanceHealth = getBalanceHealth();

  // Execute rebalance (this would integrate with trading APIs in a real app)
  const executeRebalance = async () => {
    setIsRebalancing(true);
    try {
      // This is a simulation - in a real app, we would call APIs to execute trades
      // Wait for 2 seconds to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Rebalance Successful",
        description:
          "Your portfolio rebalance orders have been placed successfully.",
      });

      // Refetch assets to show updated portfolio
      refetch();
    } catch (error) {
      console.error("Error rebalancing portfolio:", error);
      toast({
        variant: "destructive",
        title: "Rebalance Failed",
        description:
          "There was an error rebalancing your portfolio. Please try again.",
      });
    } finally {
      setIsRebalancing(false);
      setShowRebalanceConfirm(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Portfolio Balance
          </CardTitle>
          <CardDescription>Loading rebalance suggestions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if portfolio has enough assets
  if (!assets || assets.length < 2) {
    return (
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle>Portfolio Balance</CardTitle>
          <CardDescription>
            Add more assets to see rebalance suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Your portfolio needs at least 2 different cryptocurrencies for
              rebalancing suggestions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              Portfolio Balance
            </CardTitle>
            <CardDescription>Optimize your asset allocation</CardDescription>
          </div>
          <div className="flex items-center">
            <span className={`text-lg font-semibold ${balanceHealth.color}`}>
              {balanceHealth.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Balance Score */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">Balance Score</span>
            <span className="font-medium">{balanceScore.toFixed(0)}/100</span>
          </div>
          <Progress value={balanceScore} className="h-2" />
        </div>

        {/* Risk Level Slider */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">
              Risk Tolerance
            </span>
            <Badge variant="outline">
              {riskLevel === 1
                ? "Conservative"
                : riskLevel === 2
                  ? "Moderately Conservative"
                  : riskLevel === 3
                    ? "Balanced"
                    : riskLevel === 4
                      ? "Growth"
                      : "Aggressive"}
            </Badge>
          </div>
          <Slider
            value={[riskLevel]}
            min={1}
            max={5}
            step={1}
            onValueChange={(value) => setRiskLevel(value[0])}
            className="my-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative</span>
            <span>Balanced</span>
            <span>Aggressive</span>
          </div>
        </div>

        {suggestions.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Rebalance Suggestions</h3>
              <AlertDialog
                open={showRebalanceConfirm}
                onOpenChange={setShowRebalanceConfirm}
              >
                <AlertDialogTrigger asChild>
                  <Button disabled={isRebalancing}>
                    {isRebalancing ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                        Rebalancing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        One-Click Rebalance
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Confirm Portfolio Rebalance
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will place {suggestions.length} orders to rebalance
                      your portfolio. Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={executeRebalance}>
                      Rebalance Now
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="border rounded-md"
            >
              <CollapsibleTrigger asChild>
                <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-secondary/50">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {suggestions.length} suggested{" "}
                      {suggestions.length === 1 ? "change" : "changes"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border-t pt-3 first:border-t-0 first:pt-0"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{suggestion.symbol}</div>
                        <Badge
                          variant={
                            suggestion.action === "buy"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {suggestion.action === "buy" ? "+" : "-"}$
                          {suggestion.amountUsd.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          Current:{" "}
                          {(suggestion.currentAllocation * 100).toFixed(1)}%
                        </span>
                        <span>
                          Target:{" "}
                          {(suggestion.targetAllocation * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {suggestion.action === "buy" ? "Buy" : "Sell"}{" "}
                        approximately {suggestion.amountCrypto.toFixed(6)}{" "}
                        {suggestion.symbol}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
            <p className="font-medium">Your portfolio is well balanced!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No rebalancing needed at your current risk level.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
