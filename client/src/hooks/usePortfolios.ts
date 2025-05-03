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

export const usePortfolios = (type?: 'all' | 'watchlist' | 'standard') => {
  const [portfoliosWithAssets, setPortfoliosWithAssets] = useState<PortfolioWithAssets[]>([]);
  
  // Fetch all portfolios or filtered by type
  const queryParams = type && type !== 'all' ? `?type=${type}` : '';
  const endpoint = `/api/portfolios${queryParams}`;
  
  console.log(`Fetching portfolios with type: ${type || 'all'}, endpoint: ${endpoint}`);
  
  const portfoliosQuery = useQuery({
    queryKey: ['/api/portfolios', type],
    queryFn: () => fetch(endpoint)
      .then(res => {
        if (res.status === 401) return null;
        if (!res.ok) throw new Error('Failed to fetch portfolios');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          console.log(`Received ${data.length} portfolios from server`);
          // Double-check that we're getting the right type of portfolios
          if (type === 'watchlist') {
            console.log('Ensuring only watchlist portfolios are included');
            return data.filter(p => p.isWatchlist === true);
          } else if (type === 'standard') {
            console.log('Ensuring only standard portfolios are included');
            return data.filter(p => p.isWatchlist === false);
          }
        }
        return data;
      })
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