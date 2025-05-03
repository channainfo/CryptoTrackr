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
  const [allPortfoliosWithAssets, setAllPortfoliosWithAssets] = useState<PortfolioWithAssets[]>([]);
  
  // Always fetch ALL portfolios in a single request
  const endpoint = '/api/portfolios';
  
  console.log(`Fetching all portfolios from endpoint: ${endpoint}`);
  
  // We're now using a single queryKey for all portfolios to prevent refetching when switching tabs
  const portfoliosQuery = useQuery({
    queryKey: ['/api/portfolios'],
    queryFn: () => fetch(endpoint)
      .then(res => {
        if (res.status === 401) return null;
        if (!res.ok) throw new Error('Failed to fetch portfolios');
        return res.json();
      })
  });

  // Effect to load asset data for each portfolio - this only runs once when data loads
  useEffect(() => {
    const fetchPortfolioAssets = async () => {
      if (portfoliosQuery.data) {
        const portfolios = portfoliosQuery.data as Portfolio[];
        
        console.log(`Received ${portfolios.length} portfolios from server`);
        
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
        
        // Save ALL portfolios with assets for later filtering
        setAllPortfoliosWithAssets(results);
      }
    };
    
    fetchPortfolioAssets();
  }, [portfoliosQuery.data]);
  
  // Effect to filter portfolios based on the requested type
  // This runs whenever the type or allPortfoliosWithAssets changes
  useEffect(() => {
    if (allPortfoliosWithAssets.length === 0) return;
    
    console.log(`Filtering ${allPortfoliosWithAssets.length} portfolios for type: ${type || 'all'}`);
    
    let filtered = [...allPortfoliosWithAssets];
    
    if (type === 'watchlist') {
      // For 'watchlist' tab, only include watchlists
      filtered = allPortfoliosWithAssets.filter(item => Boolean(item.portfolio.isWatchlist) === true);
      console.log(`Found ${filtered.length} watchlist portfolios`);
    } else if (type === 'standard') {
      // For 'standard' tab, exclude watchlists
      filtered = allPortfoliosWithAssets.filter(item => Boolean(item.portfolio.isWatchlist) === false);
      console.log(`Found ${filtered.length} standard portfolios`);
    } else if (type === 'all') {
      // For 'all' tab, exclude watchlists
      filtered = allPortfoliosWithAssets.filter(item => Boolean(item.portfolio.isWatchlist) === false);
      console.log(`Found ${filtered.length} portfolios for 'all' tab (excluding watchlists)`);
    }
    
    setPortfoliosWithAssets(filtered);
  }, [type, allPortfoliosWithAssets]);
  
  return {
    portfoliosWithAssets,
    isLoading: portfoliosQuery.isLoading || allPortfoliosWithAssets.length === 0,
    isError: portfoliosQuery.isError,
    allPortfoliosWithAssets // Expose all portfolios in case they're needed
  };
};