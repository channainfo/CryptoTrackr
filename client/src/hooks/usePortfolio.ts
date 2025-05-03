import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { CryptoAsset, PortfolioAsset, PortfolioSummary, Transaction, ChartData, TimeRange } from "@/types/crypto";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export const usePortfolio = (portfolioId?: string | null) => {
  const { toast } = useToast();
  
  // Query portfolio assets
  const { data: portfolioData, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: portfolioId ? ['/api/portfolio', portfolioId] : ['/api/portfolio'],
    queryFn: async () => {
      const endpoint = portfolioId ? `/api/portfolio/${portfolioId}` : '/api/portfolio';
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      return response.json();
    }
  });
  
  // Query transactions
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  // State for portfolio
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    totalValue: 0,
    totalChangePercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    monthChange: 0,
    monthChangePercent: 0,
    assetCount: 0
  });
  
  // Add asset mutation
  const addAssetMutation = useMutation({
    mutationFn: (asset: PortfolioAsset & { portfolioId?: string }) => {
      const endpoint = asset.portfolioId 
        ? `/api/portfolio/${asset.portfolioId}/assets` 
        : '/api/portfolio';
      
      return apiRequest('POST', endpoint, asset);
    },
    onSuccess: (_, variables) => {
      const queryKey = variables.portfolioId 
        ? ['/api/portfolio', variables.portfolioId] 
        : ['/api/portfolio'];
      
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error adding asset",
        description: error.message || "Could not add asset to portfolio",
      });
    }
  });
  
  // Remove asset mutation
  const removeAssetMutation = useMutation({
    mutationFn: ({ assetId, portfolioId }: { assetId: string, portfolioId?: string }) => {
      const endpoint = portfolioId
        ? `/api/portfolio/${portfolioId}/assets/${assetId}`
        : `/api/portfolio/${assetId}`;
      
      return apiRequest('DELETE', endpoint);
    },
    onSuccess: (_, variables) => {
      const queryKey = variables.portfolioId 
        ? ['/api/portfolio', variables.portfolioId] 
        : ['/api/portfolio'];
      
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error removing asset",
        description: error.message || "Could not remove asset from portfolio",
      });
    }
  });
  
  // Update portfolio data when API data changes
  useEffect(() => {
    if (portfolioData) {
      setAssets(portfolioData);
      
      // Calculate portfolio summary
      const totalValue = portfolioData.reduce((sum: number, asset: PortfolioAsset) => sum + asset.value, 0);
      
      setPortfolioSummary({
        totalValue,
        totalChangePercent: 2.8, // Mock data
        dayChange: totalValue * 0.019, // Mock 1.9% daily change
        dayChangePercent: 1.9,
        monthChange: -1 * (totalValue * 0.054), // Mock -5.4% monthly change
        monthChangePercent: -5.4,
        assetCount: portfolioData.length
      });
    }
  }, [portfolioData]);
  
  // Update transactions data when API data changes
  useEffect(() => {
    if (transactionsData) {
      setTransactions(transactionsData as Transaction[]);
    }
  }, [transactionsData]);
  
  // Generate portfolio chart data
  const getPortfolioChartData = (timeRange: TimeRange): ChartData[] => {
    const today = new Date();
    const data: ChartData[] = [];
    
    let days = 0;
    switch (timeRange) {
      case '1D':
        days = 1;
        break;
      case '1W':
        days = 7;
        break;
      case '1M':
        days = 30;
        break;
      case '1Y':
        days = 365;
        break;
      case 'ALL':
        days = 1095; // ~3 years
        break;
    }
    
    // Generate mock chart data
    const baseValue = portfolioSummary.totalValue || 10000;
    const volatility = 0.02; // 2% daily volatility
    
    let currentValue = baseValue;
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simple random walk with trend
      const randomChange = (Math.random() - 0.5) * volatility * 2;
      const trend = 0.001; // Slight upward trend
      currentValue = currentValue * (1 + randomChange + trend);
      
      data.push({
        date: formatDate(date, timeRange),
        value: currentValue
      });
    }
    
    return data;
  };
  
  // Format date based on time range
  const formatDate = (date: Date, timeRange: TimeRange): string => {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (timeRange) {
      case '1D':
        options.hour = 'numeric';
        options.minute = '2-digit';
        break;
      case '1W':
        options.weekday = 'short';
        break;
      case '1M':
        options.day = 'numeric';
        options.month = 'short';
        break;
      case '1Y':
      case 'ALL':
        options.month = 'short';
        options.year = 'numeric';
        break;
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };
  
  // Add asset to portfolio
  const addAssetToPortfolio = (asset: PortfolioAsset, customPortfolioId?: string) => {
    // Add the asset locally first for immediate UI update
    setAssets(prevAssets => {
      const existingAssetIndex = prevAssets.findIndex(a => a.id === asset.id);
      if (existingAssetIndex >= 0) {
        // Update existing asset
        const updatedAssets = [...prevAssets];
        const existingAsset = updatedAssets[existingAssetIndex];
        const newQuantity = existingAsset.quantity + asset.quantity;
        updatedAssets[existingAssetIndex] = {
          ...existingAsset,
          quantity: newQuantity,
          value: newQuantity * existingAsset.currentPrice
        };
        return updatedAssets;
      } else {
        // Add new asset
        return [...prevAssets, asset];
      }
    });
    
    // Then call the API with portfolio ID if specified
    addAssetMutation.mutate({
      ...asset,
      portfolioId: customPortfolioId || (portfolioId ? portfolioId : undefined)
    });
    
    // Update portfolio summary
    setPortfolioSummary(prev => ({
      ...prev,
      totalValue: prev.totalValue + asset.value,
      assetCount: assets.length + (assets.some(a => a.id === asset.id) ? 0 : 1)
    }));
  };
  
  // Remove asset from portfolio
  const removeAssetFromPortfolio = (assetId: string, customPortfolioId?: string) => {
    // Find the asset to remove
    const assetToRemove = assets.find(a => a.id === assetId);
    if (!assetToRemove) return;
    
    // Remove the asset locally first for immediate UI update
    setAssets(prevAssets => prevAssets.filter(a => a.id !== assetId));
    
    // Then call the API with portfolio ID if specified
    removeAssetMutation.mutate({
      assetId,
      portfolioId: customPortfolioId || (portfolioId ? portfolioId : undefined)
    });
    
    // Update portfolio summary
    if (assetToRemove) {
      setPortfolioSummary(prev => ({
        ...prev,
        totalValue: prev.totalValue - assetToRemove.value,
        assetCount: prev.assetCount - 1
      }));
    }
  };
  
  return {
    assets,
    transactions,
    portfolioSummary,
    isLoading: isLoadingPortfolio || isLoadingTransactions,
    addAssetToPortfolio,
    removeAssetFromPortfolio,
    getPortfolioChartData
  };
};
