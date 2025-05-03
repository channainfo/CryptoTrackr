import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TokenPerformance from "@/components/dashboard/TokenPerformance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface TokenDetailParams {
  portfolioTokenId: string;
}

interface TokenDetails {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  averageBuyPrice: string;
  totalInvested: string;
  currentPrice: string;
  totalValue: string;
  profitLoss: string;
  tokenInfo?: {
    id: string;
    name: string;
    symbol: string;
    imageUrl?: string;
  };
}

export default function TokenDetailPage() {
  const [, navigate] = useLocation();
  const params = useParams<TokenDetailParams>();
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokenDetails = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest({
          url: `/api/portfolio-tokens/${params.portfolioTokenId}`,
          method: 'GET'
        });
        setTokenDetails(response as TokenDetails);
      } catch (error) {
        console.error("Error fetching token details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.portfolioTokenId) {
      fetchTokenDetails();
    }
  }, [params.portfolioTokenId]);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={() => navigate("/dashboard")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{isLoading ? "Loading..." : tokenDetails?.tokenInfo?.name || tokenDetails?.name}</h2>
        <span className="ml-2 text-muted-foreground">{isLoading ? "" : tokenDetails?.tokenInfo?.symbol || tokenDetails?.symbol}</span>
      </div>

      {/* Token Overview */}
      {!isLoading && tokenDetails && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{parseFloat(tokenDetails.amount).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${parseFloat(tokenDetails.currentPrice).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${parseFloat(tokenDetails.totalValue).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Buy Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${parseFloat(tokenDetails.averageBuyPrice).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${parseFloat(tokenDetails.totalInvested).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Profit/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${parseFloat(tokenDetails.profitLoss) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${parseFloat(tokenDetails.profitLoss).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <TokenPerformance 
            portfolioTokenId={params.portfolioTokenId} 
            tokenName={tokenDetails.tokenInfo?.name || tokenDetails.name}
            tokenSymbol={tokenDetails.tokenInfo?.symbol || tokenDetails.symbol}
          />
        </>
      )}
    </div>
  );
}