import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { CryptoAsset, PortfolioAsset, PortfolioSummary, Transaction, ChartData, TimeRange } from "@/types/crypto";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export const usePortfolio = (portfolioId?: string | null) => {
  const { toast } = useToast();
  
  // Query all portfolios for selection
  const { data: portfoliosData } = useQuery({
    queryKey: ['/api/portfolios'],
    queryFn: async () => {
      console.log('Fetching portfolios');
      const response = await fetch('/api/portfolios');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolios');
      }
      const data = await response.json();
      console.log('Fetched portfolios:', data);
      return data;
    }
  });
  
  // Query portfolio assets
  const { data: portfolioData, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: portfolioId ? ['/api/portfolio', portfolioId] : ['/api/portfolio'],
    queryFn: async () => {
      console.log('Fetching portfolio assets for id:', portfolioId);
      // First check if we need to get assets for a specific portfolio
      let endpoint;
      if (portfolioId) {
        endpoint = `/api/portfolios/${portfolioId}/assets`;
      } else {
        endpoint = '/api/portfolio';
      }
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      const data = await response.json();
      console.log('Fetched portfolio data:', data);
      return data;
    }
  });
  
  // Query transactions
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  // State for portfolio
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfoliosList, setPortfoliosList] = useState<any[]>([]);
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
        ? `/api/portfolios/${asset.portfolioId}/assets` 
        : '/api/portfolio';
      
      return apiRequest({
        url: endpoint,
        method: 'POST',
        data: asset
      });
    },
    onSuccess: (_, variables) => {
      const queryKey = variables.portfolioId 
        ? ['/api/portfolio', variables.portfolioId] 
        : ['/api/portfolio'];
      
      // Invalidate both portfolio and transactions queries since new assets
      // should create new transaction records
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
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
        ? `/api/portfolios/${portfolioId}/assets/${assetId}`
        : `/api/portfolio/${assetId}`;
      
      return apiRequest({
        url: endpoint,
        method: 'DELETE'
      });
    },
    onSuccess: (_, variables) => {
      const queryKey = variables.portfolioId 
        ? ['/api/portfolio', variables.portfolioId] 
        : ['/api/portfolio'];
      
      // Invalidate both portfolio and transactions queries since removing an asset 
      // should create a new sell transaction record
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
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
  
  // Update portfolios list when API data changes
  useEffect(() => {
    if (portfoliosData) {
      setPortfoliosList(portfoliosData);
    }
  }, [portfoliosData]);
  
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
  
  // Update asset mutation for partial sells
  const updateAssetMutation = useMutation({
    mutationFn: ({ 
      assetId, 
      portfolioId, 
      quantity 
    }: { 
      assetId: string, 
      portfolioId?: string, 
      quantity: number 
    }) => {
      const endpoint = portfolioId
        ? `/api/portfolios/${portfolioId}/assets/${assetId}`
        : `/api/portfolios/assets/${assetId}`;
      
      return apiRequest({
        url: endpoint,
        method: 'PATCH',
        data: { quantity }
      });
    },
    onSuccess: (_, variables) => {
      const queryKey = variables.portfolioId 
        ? ['/api/portfolio', variables.portfolioId] 
        : ['/api/portfolio'];
      
      // Invalidate both portfolio and transactions queries since partial sells 
      // should create new transaction records
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating asset",
        description: error.message || "Could not update asset quantity",
      });
    }
  });

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
  
  // Sell a portion of an asset
  const sellPartialAsset = (assetId: string, quantityToSell: number, customPortfolioId?: string) => {
    // Find the asset to update
    const assetToUpdate = assets.find(a => a.id === assetId);
    if (!assetToUpdate) return;
    
    // Make sure quantity to sell is valid
    if (quantityToSell <= 0 || quantityToSell >= assetToUpdate.quantity) {
      toast({
        variant: "destructive",
        title: "Invalid quantity",
        description: "Please enter a valid quantity less than your current holdings",
      });
      return;
    }
    
    // Calculate new quantity
    const newQuantity = assetToUpdate.quantity - quantityToSell;
    
    // Update the asset locally first for immediate UI update
    setAssets(prevAssets => prevAssets.map(a => {
      if (a.id === assetId) {
        const updatedAsset = {
          ...a,
          quantity: newQuantity,
          value: newQuantity * a.currentPrice
        };
        return updatedAsset;
      }
      return a;
    }));
    
    // Then call the API with portfolio ID if specified
    updateAssetMutation.mutate({
      assetId,
      portfolioId: customPortfolioId || (portfolioId ? portfolioId : undefined),
      quantity: newQuantity
    });
    
    // Update portfolio summary
    const valueReduction = quantityToSell * assetToUpdate.currentPrice;
    setPortfolioSummary(prev => ({
      ...prev,
      totalValue: prev.totalValue - valueReduction,
    }));
    
    toast({
      title: "Asset sold",
      description: `Sold ${quantityToSell} ${assetToUpdate.symbol} successfully`,
    });
  };
  
  return {
    assets,
    transactions,
    portfolioSummary,
    portfoliosList,
    isLoading: isLoadingPortfolio || isLoadingTransactions,
    addAssetToPortfolio,
    removeAssetFromPortfolio,
    sellPartialAsset,
    getPortfolioChartData
  };
};
