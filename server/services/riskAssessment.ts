import OpenAI from "openai";
import { Portfolio, PortfolioToken } from "@shared/schema";
import { db } from "../db";

// Create OpenAI client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
 * Service for analyzing portfolio risk using AI
 */
export class RiskAssessmentService {
  /**
   * Analyze portfolio risk using OpenAI
   * @param portfolio Portfolio to analyze
   * @param assets Portfolio assets with token details
   * @param marketData Recent market data for context
   * @returns Risk assessment results
   */
  static async analyzePortfolioRisk(
    portfolio: Portfolio,
    assets: Array<PortfolioToken & { symbol: string; name: string }>,
    marketData: any[]
  ): Promise<RiskAssessmentResponse> {
    try {
      // If no assets, return a default response
      if (!assets || assets.length === 0) {
        return this.generateDefaultRiskAssessment();
      }
      
      // Extract relevant portfolio data for the prompt
      const totalValue = assets.reduce((sum, asset) => {
        const value = Number(asset.amount) * Number(asset.currentPrice || 0);
        return sum + value;
      }, 0);
      
      const portfolioData = {
        name: portfolio.name,
        description: portfolio.description,
        totalValue: totalValue,
        assets: assets.map(asset => {
          const value = Number(asset.amount) * Number(asset.currentPrice || 0);
          return {
            name: asset.name,
            symbol: asset.symbol,
            allocation: totalValue > 0 ? (value / totalValue) * 100 : 0,
            currentPrice: Number(asset.currentPrice || 0),
            priceChange24h: 0, // Default to 0 when price change data is not available
          };
        }),
      };
      
      // Extract relevant market data for context
      const marketContext = marketData.slice(0, 10).map(coin => ({
        name: coin.name,
        symbol: coin.symbol,
        price: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
      }));
      
      // Generate risk assessment using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert crypto portfolio risk analyst. Analyze the given portfolio data and market context to provide a comprehensive risk assessment.
            
            Consider these factors in your analysis:
            1. Diversification - Is the portfolio overly concentrated in a few assets?
            2. Volatility - How volatile are the assets in the portfolio?
            3. Market correlation - How correlated are the assets to the overall market?
            4. Market cap distribution - Is there a good balance between large, mid, and small cap assets?
            5. Asset quality - Are the assets well-established, with good fundamentals?
            6. Recent market trends and sentiment
            
            Provide a comprehensive risk assessment that includes practical recommendations.`
          },
          {
            role: "user",
            content: `Please analyze this crypto portfolio:
            
            Portfolio Information:
            ${JSON.stringify(portfolioData, null, 2)}
            
            Current Market Context:
            ${JSON.stringify(marketContext, null, 2)}
            
            Provide a comprehensive risk assessment in JSON format with the following structure:
            {
              "overallRisk": {
                "score": number from 1-10 where 10 is highest risk,
                "level": "low", "medium", "high", or "very_high",
                "summary": brief summary of overall risk
              },
              "factors": [
                {
                  "name": factor name,
                  "description": detailed description,
                  "impact": "positive", "negative", or "neutral",
                  "riskContribution": number from 1-10
                }
              ],
              "recommendations": [
                {
                  "action": specific action to take,
                  "reasoning": why this action reduces risk,
                  "priority": "low", "medium", or "high"
                }
              ],
              "diversificationScore": number from 1-10 where 10 is best,
              "volatilityAssessment": string explanation,
              "marketCorrelation": string explanation,
              "timestamp": current date in ISO format
            }`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }
      
      const riskAssessment = JSON.parse(content);
      return {
        ...riskAssessment,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error analyzing portfolio risk:", error);
      return this.generateDefaultRiskAssessment();
    }
  }
  
  /**
   * Generate a generalized risk assessment for a specific token
   * @param symbol Token symbol
   * @param name Token name
   * @param marketData Market data for context
   * @returns Token risk assessment
   */
  static async analyzeSingleTokenRisk(
    symbol: string,
    name: string,
    marketData: any[]
  ): Promise<RiskAssessmentResponse> {
    try {
      // Find token in market data
      const tokenData = marketData.find(coin => 
        coin.symbol.toLowerCase() === symbol.toLowerCase() ||
        coin.name.toLowerCase() === name.toLowerCase()
      );
      
      if (!tokenData) {
        return this.generateDefaultTokenRiskAssessment(symbol, name);
      }
      
      // Generate risk assessment using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert crypto risk analyst. Analyze the given token data and market context to provide a comprehensive risk assessment.
            
            Consider these factors in your analysis:
            1. Volatility - How volatile is this asset compared to the market?
            2. Market capitalization - Is this a large, mid, or small cap asset?
            3. Trading volume - Is there sufficient liquidity?
            4. Price history - What is the recent price movement pattern?
            5. Market sentiment - What is the current market sentiment for this asset?
            6. Technology and fundamentals - Is the project technically sound?
            
            Provide a comprehensive risk assessment that includes practical recommendations.`
          },
          {
            role: "user",
            content: `Please analyze this cryptocurrency token:
            
            Token Information:
            ${JSON.stringify(tokenData, null, 2)}
            
            Current Market Context:
            ${JSON.stringify(marketData.slice(0, 5), null, 2)}
            
            Provide a comprehensive risk assessment in JSON format with the following structure:
            {
              "overallRisk": {
                "score": number from 1-10 where 10 is highest risk,
                "level": "low", "medium", "high", or "very_high",
                "summary": brief summary of overall risk
              },
              "factors": [
                {
                  "name": factor name,
                  "description": detailed description,
                  "impact": "positive", "negative", or "neutral",
                  "riskContribution": number from 1-10
                }
              ],
              "recommendations": [
                {
                  "action": specific action to take,
                  "reasoning": why this action reduces risk,
                  "priority": "low", "medium", or "high"
                }
              ],
              "diversificationScore": N/A for single token,
              "volatilityAssessment": string explanation,
              "marketCorrelation": string explanation,
              "timestamp": current date in ISO format
            }`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }
      
      const riskAssessment = JSON.parse(content);
      return {
        ...riskAssessment,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error analyzing risk for token ${symbol}:`, error);
      return this.generateDefaultTokenRiskAssessment(symbol, name);
    }
  }
  
  /**
   * Generate a default risk assessment when analysis fails
   */
  private static generateDefaultRiskAssessment(): RiskAssessmentResponse {
    return {
      overallRisk: {
        score: 5,
        level: 'medium',
        summary: 'Unable to perform a complete risk assessment. This is a generic risk profile.',
      },
      factors: [
        {
          name: 'Market Volatility',
          description: 'Cryptocurrency markets are inherently volatile.',
          impact: 'negative',
          riskContribution: 7,
        },
        {
          name: 'Market Maturity',
          description: 'The crypto market is still evolving and maturing.',
          impact: 'negative',
          riskContribution: 6,
        },
      ],
      recommendations: [
        {
          action: 'Diversify your portfolio',
          reasoning: 'Diversification helps reduce risk exposure to any single asset.',
          priority: 'high',
        },
        {
          action: 'Consider dollar-cost averaging',
          reasoning: 'Regular smaller investments can reduce the impact of volatility.',
          priority: 'medium',
        },
      ],
      diversificationScore: 5,
      volatilityAssessment: 'Cryptocurrency markets typically experience high volatility compared to traditional markets.',
      marketCorrelation: 'Many cryptocurrencies are highly correlated with Bitcoin, which can limit the benefits of diversification.',
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Generate a default risk assessment for a specific token when analysis fails
   */
  private static generateDefaultTokenRiskAssessment(symbol: string, name: string): RiskAssessmentResponse {
    return {
      overallRisk: {
        score: 6,
        level: 'medium',
        summary: `Unable to perform a complete risk assessment for ${name} (${symbol}). This is a generic risk profile.`,
      },
      factors: [
        {
          name: 'Asset Volatility',
          description: `${name} (${symbol}), like most cryptocurrencies, may experience significant price volatility.`,
          impact: 'negative',
          riskContribution: 7,
        },
        {
          name: 'Market Exposure',
          description: 'Single-asset exposure increases portfolio concentration risk.',
          impact: 'negative',
          riskContribution: 8,
        },
      ],
      recommendations: [
        {
          action: 'Limit allocation to this asset',
          reasoning: 'To reduce concentration risk, consider limiting the percentage of your portfolio allocated to this asset.',
          priority: 'high',
        },
        {
          action: 'Research fundamentals',
          reasoning: 'Conduct thorough research on the technology, team, and use case before investing further.',
          priority: 'medium',
        },
      ],
      diversificationScore: 3,
      volatilityAssessment: 'Single cryptocurrency assets typically have higher volatility than a diversified portfolio.',
      marketCorrelation: 'The correlation with the broader market cannot be determined without detailed analysis.',
      timestamp: new Date().toISOString(),
    };
  }
}