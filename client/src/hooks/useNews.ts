import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
  imageUrl?: string;
  relevance?: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  portfolioInsight: string;
}

/**
 * Hook to fetch personalized crypto news based on the user's portfolio
 */
export const useNews = () => {
  return useQuery<NewsResponse>({
    queryKey: ['/api/crypto/news'],
    queryFn: () => apiRequest('/api/crypto/news'),
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  });
};