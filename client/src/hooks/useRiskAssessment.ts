import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

/**
 * Risk assessment response type
 */
export interface RiskAssessmentResponse {
  overallRisk: {
    score: number; // 1-10, where 10 is highest risk
    level: 'low' | 'medium' | 'high' | 'very_high';
    summary: string;
  };
  factors: {
    name: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    riskContribution: number; // 1-10
  }[];
  recommendations: {
    action: string;
    reasoning: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  diversificationScore: number; // 1-10, where 10 is best
  volatilityAssessment: string;
  marketCorrelation: string;
  timestamp: string;
}

/**
 * Hook to fetch risk assessment for a portfolio
 */
export function usePortfolioRiskAssessment(portfolioId: string) {
  return useQuery<RiskAssessmentResponse>({
    queryKey: ['portfolios', portfolioId, 'risk-assessment'],
    queryFn: async () => {
      const response = await apiRequest(`/api/portfolios/${portfolioId}/risk-assessment`);
      return response;
    },
    enabled: !!portfolioId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook to fetch risk assessment for a token
 */
export function useTokenRiskAssessment(symbol: string) {
  return useQuery<RiskAssessmentResponse>({
    queryKey: ['tokens', symbol, 'risk-assessment'],
    queryFn: async () => {
      const response = await apiRequest(`/api/crypto/tokens/${symbol}/risk-assessment`);
      return response;
    },
    enabled: !!symbol,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}