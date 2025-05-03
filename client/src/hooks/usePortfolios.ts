import { useState, useEffect } from "react";
import { Portfolio } from "@shared/schema";
import { PortfolioAsset } from "@/types/crypto";
import { getQueryFn } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export interface PortfolioWithAssets {
  portfolio: Portfolio;
  assets: PortfolioAsset[];
  totalValue: number;
  totalChangePercent: number;
  assetCount: number;
}

export const usePortfolios = () => {
  const [portfoliosWithAssets, setPortfoliosWithAssets] = useState<PortfolioWithAssets[]>([]);
  
  // Fetch all portfolios
  const portfoliosQuery = useQuery({
    queryKey: ['/api/portfolios'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Effect to load asset data for each portfolio
  useEffect(() => {
    const fetchPortfolioAssets = async () => {
      if (portfoliosQuery.data) {
        const portfolios = portfoliosQuery.data as Portfolio[];
        
        // Create promises for fetching assets for each portfolio
        const assetPromises = portfolios.map(portfolio => 
          fetch(`/api/portfolios/${portfolio.id}/assets`)
            .then(res => res.json())
            .then(assets => {
              const totalValue = assets.reduce((sum: number, asset: PortfolioAsset) => sum + asset.value, 0);
              const totalChangePercent = assets.length > 0 
                ? assets.reduce((sum: number, asset: PortfolioAsset) => 
                    sum + asset.priceChangePercentage24h * (asset.value / totalValue), 0)
                : 0;
              
              return {
                portfolio,
                assets,
                totalValue,
                totalChangePercent,
                assetCount: assets.length
              };
            })
            .catch(() => ({
              portfolio,
              assets: [],
              totalValue: 0,
              totalChangePercent: 0,
              assetCount: 0
            }))
        );
        
        // Wait for all promises to resolve
        const results = await Promise.all(assetPromises);
        setPortfoliosWithAssets(results);
      }
    };
    
    fetchPortfolioAssets();
  }, [portfoliosQuery.data]);
  
  return {
    portfoliosWithAssets,
    isLoading: portfoliosQuery.isLoading,
    isError: portfoliosQuery.isError
  };
};