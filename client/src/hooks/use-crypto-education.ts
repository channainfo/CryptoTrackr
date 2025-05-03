import { useCallback, useMemo } from 'react';
import { getDefinition, searchDefinitions, getAllDefinitions } from '@/data/crypto-definitions';
import type { CryptoDefinition } from '@/types/education';

/**
 * Hook to provide access to crypto definitions and education content
 */
export function useCryptoEducation() {
  /**
   * Get a definition by its key
   */
  const getDefinitionByKey = useCallback((key: string): CryptoDefinition | undefined => {
    return getDefinition(key);
  }, []);

  /**
   * Search definitions by a search term
   */
  const search = useCallback((term: string): CryptoDefinition[] => {
    return searchDefinitions(term);
  }, []);

  /**
   * Get definitions grouped by category (derived from the keys)
   */
  const getCategorizedDefinitions = useCallback(() => {
    const allDefinitions = getAllDefinitions();
    const categories: Record<string, CryptoDefinition[]> = {
      "Market Terms": [],
      "Investment Strategies": [],
      "Technical Concepts": [],
      "Cryptocurrencies": [],
      "Security": [],
      "Analysis": [],
      "DeFi": [],
      "NFTs": [],
      "Tax & Regulatory": [],
      "Portfolio Management": [],
      "Other": []
    };

    allDefinitions.forEach(def => {
      const key = def.term.toLowerCase();
      
      if (key.includes("market") || key.includes("fomo") || key.includes("bull") || key.includes("bear") || key.includes("sentiment")) {
        categories["Market Terms"].push(def);
      } else if (key.includes("hodl") || key.includes("dca") || key.includes("diversification") || key.includes("research")) {
        categories["Investment Strategies"].push(def);
      } else if (key.includes("consensus") || key.includes("pow") || key.includes("pos") || key.includes("contract") || key.includes("blockchain")) {
        categories["Technical Concepts"].push(def);
      } else if (key.includes("bitcoin") || key.includes("ethereum") || key.includes("stablecoin") || key.includes("token")) {
        categories["Cryptocurrencies"].push(def);
      } else if (key.includes("wallet") || key.includes("key") || key.includes("2fa") || key.includes("seed")) {
        categories["Security"].push(def);
      } else if (key.includes("analysis") || key.includes("indicator")) {
        categories["Analysis"].push(def);
      } else if (key.includes("defi") || key.includes("yield") || key.includes("amm")) {
        categories["DeFi"].push(def);
      } else if (key.includes("nft")) {
        categories["NFTs"].push(def);
      } else if (key.includes("tax") || key.includes("kyc") || key.includes("gain") || key.includes("regulatory")) {
        categories["Tax & Regulatory"].push(def);
      } else if (key.includes("portfolio") || key.includes("rebalancing") || key.includes("alert")) {
        categories["Portfolio Management"].push(def);
      } else {
        categories["Other"].push(def);
      }
    });

    // Filter out empty categories
    return Object.entries(categories)
      .filter(([_, defs]) => defs.length > 0)
      .reduce((acc, [category, defs]) => {
        acc[category] = defs;
        return acc;
      }, {} as Record<string, CryptoDefinition[]>);
  }, []);

  return {
    getDefinition: getDefinitionByKey,
    searchDefinitions: search,
    getAllDefinitions,
    getCategorizedDefinitions,
  };
}