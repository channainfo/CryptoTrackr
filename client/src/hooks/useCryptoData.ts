import { useQuery } from "@tanstack/react-query";
import { CryptoAsset } from "@/types/crypto";
import { useState, useEffect } from "react";

export const useCryptoData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/crypto/market'],
    // The default queryFn is already set up in @/lib/queryClient.ts
  });
  
  const [marketData, setMarketData] = useState<CryptoAsset[]>([]);
  
  useEffect(() => {
    if (data) {
      setMarketData(data);
    }
  }, [data]);
  
  // For testing purposes, return placeholder data if API fails
  useEffect(() => {
    if (error && !data) {
      console.error("Error fetching market data:", error);
      // This is only used as a fallback when the API fails
      setMarketData([]);
    }
  }, [error, data]);
  
  return {
    marketData,
    isLoading,
    error
  };
};
