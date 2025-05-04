import { apiRequest } from './queryClient';

export const portfolioApi = {
  getPortfolios: async () => {
    return apiRequest({
      url: '/api/portfolios',
      method: 'GET'
    });
  },
  
  getPortfolio: async (id: string) => {
    return apiRequest({
      url: `/api/portfolios/${id}`,
      method: 'GET'
    });
  },
  
  getPortfolioAssets: async (id: string) => {
    return apiRequest({
      url: `/api/portfolios/${id}/assets`,
      method: 'GET'
    });
  },
  
  getPortfolioSummary: async (id: string) => {
    return apiRequest({
      url: `/api/portfolios/${id}/summary`,
      method: 'GET'
    });
  },
  
  getPortfolioPerformance: async (id: string, period: string) => {
    return apiRequest({
      url: `/api/portfolios/${id}/performance?period=${period}`,
      method: 'GET'
    });
  },
  
  recordPortfolioValue: async (id: string) => {
    return apiRequest({
      url: `/api/portfolios/${id}/history/record`,
      method: 'POST'
    });
  }
};

export const transactionApi = {
  getTransactions: async (portfolioId?: string, type?: string) => {
    const params = new URLSearchParams();
    if (portfolioId) params.append('portfolioId', portfolioId);
    if (type) params.append('type', type);
    
    return apiRequest({
      url: `/api/transactions?${params.toString()}`,
      method: 'GET'
    });
  }
};

export const marketApi = {
  getMarketData: async () => {
    return apiRequest({
      url: '/api/crypto/market',
      method: 'GET'
    });
  },
  
  getTokenDetails: async (id: string) => {
    return apiRequest({
      url: `/api/crypto/token/${id}`,
      method: 'GET'
    });
  },
  
  getMarketSentiment: async () => {
    return apiRequest({
      url: '/api/crypto/sentiment',
      method: 'GET'
    });
  }
};