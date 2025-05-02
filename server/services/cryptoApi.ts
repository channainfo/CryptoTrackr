import axios from 'axios';

// Define crypto API service
export interface CryptoApiService {
  getMarketData(): Promise<any[]>;
  getCryptoDetails(id: string): Promise<any>;
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
}

// Export services
export const services: CryptoApiService = new CoinGeckoApiService();
