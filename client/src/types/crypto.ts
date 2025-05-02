// Types for cryptocurrency data and portfolio
export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChangePercentage24h: number;
  image?: string;
}

export interface PortfolioAsset extends CryptoAsset {
  quantity: number;
  value: number;
  purchasePrice?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalChangePercent: number;
  dayChange: number;
  dayChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  assetCount: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  cryptoName: string;
  cryptoSymbol: string;
  quantity: number;
  price: number;
  value: number;
  timestamp: string;
}

export interface ChartData {
  date: string;
  value: number;
}

export type TimeRange = '1D' | '1W' | '1M' | '1Y' | 'ALL';
