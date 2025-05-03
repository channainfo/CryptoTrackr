import { useMemo } from 'react';
import { getDefinition, getAllDefinitions, searchDefinitions, cryptoDefinitions } from '@/data/crypto-definitions';

/**
 * Hook to provide access to crypto definitions and education content
 */
export function useCryptoEducation() {
  const definitions = useMemo(() => getAllDefinitions(), []);
  
  /**
   * Get a definition by its key
   */
  const getTermDefinition = (key: string) => {
    return getDefinition(key);
  };
  
  /**
   * Search definitions by a search term
   */
  const searchTerms = (searchTerm: string) => {
    if (!searchTerm.trim()) return definitions;
    return searchDefinitions(searchTerm);
  };
  
  /**
   * Get definitions grouped by category (derived from the keys)
   */
  const getDefinitionsByCategory = () => {
    const categories = {
      'Basic Concepts': ['blockchain', 'cryptocurrency', 'decentralization'],
      'Market Terms': ['market-cap', 'volume', 'liquidity', 'volatility'],
      'Trading': ['bull-market', 'bear-market', 'fomo', 'dyor'],
      'Investment': ['hodl', 'dca', 'diversification'],
      'Technical': ['consensus', 'pow', 'pos', 'smart-contract'],
      'Cryptocurrencies': ['bitcoin', 'ethereum', 'stablecoin'],
      'Wallets & Security': ['wallet', 'private-key', 'seed-phrase', '2fa'],
      'Analysis': ['fundamental-analysis', 'technical-analysis'],
      'DeFi': ['defi', 'yield-farming', 'amm'],
      'NFTs': ['nft'],
      'Tax & Regulation': ['capital-gains', 'kyc'],
      'Portfolio': ['rebalancing', 'portfolio-diversification'],
      'Alerts': ['price-alert', 'percent-change', 'market-sentiment'],
    };

    return Object.entries(categories).map(([category, keys]) => ({
      category,
      terms: keys.map(key => cryptoDefinitions[key]).filter(Boolean)
    }));
  };

  return {
    definitions,
    getTermDefinition,
    searchTerms,
    getDefinitionsByCategory,
  };
}