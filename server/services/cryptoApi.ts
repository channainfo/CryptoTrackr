import axios from 'axios';

// Define crypto API service
export interface CryptoApiService {
  getMarketData(): Promise<any[]>;
  getCryptoDetails(id: string): Promise<any>;
  getSentimentData(): Promise<any>;
}

// Implementation that uses CoinGecko API
class CoinGeckoApiService implements CryptoApiService {
  private readonly apiBaseUrl = 'https://api.coingecko.com/api/v3';
  
  // Use a mock API response if the API fails or rate-limits
  private mockMarketData = [
    {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      currentPrice: 62145.87,
      priceChangePercentage24h: 3.2
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      currentPrice: 2198.34,
      priceChangePercentage24h: 1.8
    },
    {
      id: 'solana',
      symbol: 'SOL',
      name: 'Solana',
      currentPrice: 128.75,
      priceChangePercentage24h: -2.3
    },
    {
      id: 'polkadot',
      symbol: 'DOT',
      name: 'Polkadot',
      currentPrice: 17.23,
      priceChangePercentage24h: 0.7
    },
    {
      id: 'cardano',
      symbol: 'ADA',
      name: 'Cardano',
      currentPrice: 0.59,
      priceChangePercentage24h: -0.5
    },
    {
      id: 'ripple',
      symbol: 'XRP',
      name: 'XRP',
      currentPrice: 0.68,
      priceChangePercentage24h: 1.2
    },
    {
      id: 'binancecoin',
      symbol: 'BNB',
      name: 'Binance Coin',
      currentPrice: 568.23,
      priceChangePercentage24h: 0.9
    },
    {
      id: 'dogecoin',
      symbol: 'DOGE',
      name: 'Dogecoin',
      currentPrice: 0.142,
      priceChangePercentage24h: 2.1
    },
    {
      id: 'avalanche',
      symbol: 'AVAX',
      name: 'Avalanche',
      currentPrice: 34.87,
      priceChangePercentage24h: 3.4
    },
    {
      id: 'chainlink',
      symbol: 'LINK',
      name: 'Chainlink',
      currentPrice: 15.29,
      priceChangePercentage24h: 1.5
    }
  ];
  
  async getMarketData(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 50,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        },
        timeout: 5000 // 5 second timeout
      });
      
      // Map the response to match our expected format
      return response.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        image: coin.image
      }));
    } catch (error) {
      console.error('Error fetching market data from CoinGecko:', error);
      console.log('Using mock market data instead');
      // Return mock data if the API fails
      return this.mockMarketData;
    }
  }
  
  async getCryptoDetails(id: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/coins/${id}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        },
        timeout: 5000 // 5 second timeout
      });
      
      const coin = response.data;
      
      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        description: coin.description.en,
        currentPrice: coin.market_data.current_price.usd,
        marketCap: coin.market_data.market_cap.usd,
        totalVolume: coin.market_data.total_volume.usd,
        high24h: coin.market_data.high_24h.usd,
        low24h: coin.market_data.low_24h.usd,
        priceChangePercentage24h: coin.market_data.price_change_percentage_24h,
        priceChangePercentage7d: coin.market_data.price_change_percentage_7d,
        priceChangePercentage30d: coin.market_data.price_change_percentage_30d,
        image: coin.image.large
      };
    } catch (error) {
      console.error(`Error fetching details for ${id} from CoinGecko:`, error);
      // Return a mock coin if the API fails
      const mockCoin = this.mockMarketData.find(coin => coin.id === id);
      if (mockCoin) {
        return {
          ...mockCoin,
          description: 'No description available',
          marketCap: mockCoin.currentPrice * 1000000,
          totalVolume: mockCoin.currentPrice * 500000,
          high24h: mockCoin.currentPrice * 1.05,
          low24h: mockCoin.currentPrice * 0.95,
          priceChangePercentage7d: mockCoin.priceChangePercentage24h * 2,
          priceChangePercentage30d: mockCoin.priceChangePercentage24h * 3,
          image: ''
        };
      }
      throw new Error(`Cryptocurrency with ID ${id} not found`);
    }
  }
  
  async getSentimentData(): Promise<any> {
    try {
      // Try to fetch the Fear & Greed index from alternative API
      // This would normally be fetched from a proper API source
      // For demonstration, we'll use market data to calculate sentiment
      
      const marketData = await this.getMarketData();
      
      // Calculate sentiment based on market trends
      const result = this.calculateSentiment(marketData);
      
      return {
        sentiment: {
          score: result.score,
          mood: result.mood,
          change: result.change,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      throw error;
    }
  }
  
  private calculateSentiment(marketData: any[]): { score: number; mood: string; change: number } {
    // Default sentiment if no data
    if (!marketData || !marketData.length) {
      return {
        score: 50,
        mood: 'neutral',
        change: 0
      };
    }
    
    // Calculate sentiment based on price changes of top coins
    const topCoins = marketData.slice(0, 10); // Top 10 coins
    
    // Calculate average 24h change
    const avgChange24h = topCoins.reduce((sum, coin) => {
      return sum + (coin.priceChangePercentage24h || 0);
    }, 0) / topCoins.length;
    
    // Bitcoin dominance factor (if BTC doing better than average, market is less fearful)
    const btcData = marketData.find(coin => coin.symbol === 'BTC');
    const btcDominanceFactor = btcData ? 
      ((btcData.priceChangePercentage24h || 0) - avgChange24h) * 0.1 : 
      0;
    
    // Calculate base score (0-100)
    // 50 is neutral, <30 is extreme fear, >70 is extreme greed
    let baseScore = 50; // Start at neutral
    
    // Price movement impact on sentiment
    baseScore += avgChange24h * 2.5;
    baseScore += btcDominanceFactor;
    
    // Clamp score between 0 and 100
    const score = Math.max(0, Math.min(100, Math.round(baseScore)));
    
    // Determine mood based on score
    let mood;
    if (score < 25) mood = 'extreme_fear';
    else if (score < 40) mood = 'fear';
    else if (score < 60) mood = 'neutral';
    else if (score < 80) mood = 'greed';
    else mood = 'extreme_greed';
    
    return {
      score,
      mood,
      change: Math.round(avgChange24h * 10) / 10 // Round to 1 decimal place
    };
  }
}

// Export services
export const services: CryptoApiService = new CoinGeckoApiService();
