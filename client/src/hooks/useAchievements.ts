import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Achievement, AchievementType } from '@/components/achievement/AchievementBadge';
import { usePortfolio } from './usePortfolio';

interface PortfolioMetrics {
  totalValue: number;
  assetCount: number;
  diversificationScore: number;
  profitLoss: number;
  profitLossPercent: number;
  holdingPeriod: number; // in days
  tradingVolume: number;
  riskScore: number;
}

export const useAchievements = (portfolioId?: string) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { portfolioSummary, isLoading: isPortfolioLoading } = usePortfolio(portfolioId);
  
  useEffect(() => {
    if (isPortfolioLoading) return;
    
    // In a real implementation, you would fetch this from the server
    // or calculate based on portfolio data
    const loadAchievements = async () => {
      try {
        setIsLoading(true);
        
        // Get achievements from localStorage for demo
        const storedAchievements = localStorage.getItem('portfolio-achievements');
        
        if (storedAchievements) {
          setAchievements(JSON.parse(storedAchievements));
          setIsLoading(false);
          return;
        }
        
        // Mock metrics for the achievement calculations
        const metrics: PortfolioMetrics = {
          totalValue: portfolioSummary?.totalValue || 0,
          assetCount: portfolioSummary?.assetCount || 0,
          diversificationScore: 6.8, // out of 10
          profitLoss: 2500,
          profitLossPercent: 12.5,
          holdingPeriod: 97, // 97 days
          tradingVolume: 25000,
          riskScore: 5.2 // out of 10
        };
        
        // Generate achievements based on portfolio metrics
        const generatedAchievements = generateAchievements(metrics);
        
        setAchievements(generatedAchievements);
        
        // Save to localStorage for demo
        localStorage.setItem('portfolio-achievements', JSON.stringify(generatedAchievements));
        
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAchievements();
  }, [isPortfolioLoading, portfolioSummary]);
  
  // Function to mark an achievement as earned
  const earnAchievement = (achievementId: string) => {
    setAchievements(prev => {
      const updated = prev.map(a => 
        a.id === achievementId 
          ? { ...a, earned: true, earnedDate: new Date().toISOString() } 
          : a
      );
      
      // Save to localStorage for demo
      localStorage.setItem('portfolio-achievements', JSON.stringify(updated));
      
      return updated;
    });
  };
  
  // Function to update achievement progress
  const updateAchievementProgress = (achievementId: string, progress: number) => {
    setAchievements(prev => {
      const updated = prev.map(a => {
        if (a.id === achievementId) {
          const newProgress = Math.min(a.maxProgress || progress, progress);
          const earned = newProgress >= (a.maxProgress || 0);
          
          return { 
            ...a, 
            progress: newProgress,
            earned: earned,
            earnedDate: earned && !a.earned ? new Date().toISOString() : a.earnedDate
          };
        }
        return a;
      });
      
      // Save to localStorage for demo
      localStorage.setItem('portfolio-achievements', JSON.stringify(updated));
      
      return updated;
    });
  };
  
  return { 
    achievements, 
    isLoading, 
    earnAchievement, 
    updateAchievementProgress 
  };
};

// Function to generate achievements based on portfolio metrics
const generateAchievements = (metrics: PortfolioMetrics): Achievement[] => {
  const achievements: Achievement[] = [
    {
      id: uuidv4(),
      type: 'first_investment',
      title: 'First Steps',
      description: 'Made your first investment. Welcome to the world of crypto!',
      icon: "wallet",
      color: 'green',
      earned: metrics.totalValue > 0,
      earnedDate: metrics.totalValue > 0 ? new Date().toISOString() : undefined
    },
    {
      id: uuidv4(),
      type: 'diversified_portfolio',
      title: 'Diversification Master',
      description: 'Built a well-diversified portfolio with at least 5 different assets.',
      icon: "shield",
      color: 'blue',
      earned: metrics.assetCount >= 5,
      earnedDate: metrics.assetCount >= 5 ? new Date().toISOString() : undefined,
      progress: Math.min(metrics.assetCount, 5),
      maxProgress: 5
    },
    {
      id: uuidv4(),
      type: 'profit_milestone',
      title: 'Profit Milestone',
      description: 'Achieved a 10% profit on your investments.',
      icon: "trending-up",
      color: 'emerald',
      earned: metrics.profitLossPercent >= 10,
      earnedDate: metrics.profitLossPercent >= 10 ? new Date().toISOString() : undefined,
      progress: Math.min(Math.floor(metrics.profitLossPercent), 10),
      maxProgress: 10
    },
    {
      id: uuidv4(),
      type: 'consistent_dca',
      title: 'Consistent Investor',
      description: 'Consistently invested through Dollar Cost Averaging for 3 months.',
      icon: "repeat",
      color: 'indigo',
      earned: metrics.holdingPeriod >= 90,
      earnedDate: metrics.holdingPeriod >= 90 ? new Date().toISOString() : undefined,
      progress: Math.min(metrics.holdingPeriod, 90),
      maxProgress: 90
    },
    {
      id: uuidv4(),
      type: 'long_term_holder',
      title: 'HODL Champion',
      description: 'Held your investments for over 6 months, demonstrating patience and long-term thinking.',
      icon: "clock",
      color: 'purple',
      earned: metrics.holdingPeriod >= 180,
      earnedDate: metrics.holdingPeriod >= 180 ? new Date().toISOString() : undefined,
      progress: Math.min(metrics.holdingPeriod, 180),
      maxProgress: 180
    },
    {
      id: uuidv4(),
      type: 'risk_manager',
      title: 'Risk Manager',
      description: 'Maintained a balanced risk profile with an optimal risk score.',
      icon: "shield",
      color: 'slate',
      earned: metrics.riskScore > 3 && metrics.riskScore < 7,
      earnedDate: (metrics.riskScore > 3 && metrics.riskScore < 7) ? new Date().toISOString() : undefined
    },
    {
      id: uuidv4(),
      type: 'trading_volume',
      title: 'Active Trader',
      description: 'Reached $10,000 in trading volume.',
      icon: "bar-chart-2",
      color: 'amber',
      earned: metrics.tradingVolume >= 10000,
      earnedDate: metrics.tradingVolume >= 10000 ? new Date().toISOString() : undefined,
      progress: Math.min(Math.floor(metrics.tradingVolume / 100), 100),
      maxProgress: 100
    },
    {
      id: uuidv4(),
      type: 'global_investor',
      title: 'Global Investor',
      description: 'Invested in assets from at least 3 different blockchain ecosystems.',
      icon: "globe",
      color: 'cyan',
      earned: false,
      progress: 1,
      maxProgress: 3
    },
    {
      id: uuidv4(),
      type: 'smart_investor',
      title: 'Smart Investor',
      description: 'Made 5 profitable trades in a row.',
      icon: "briefcase",
      color: 'orange',
      earned: false,
      progress: 3,
      maxProgress: 5
    },
    {
      id: uuidv4(),
      type: 'power_trader',
      title: 'Power Trader',
      description: 'Executed 10 trades in a single day.',
      icon: "zap",
      color: 'yellow',
      earned: false,
      progress: 0,
      maxProgress: 10
    },
    {
      id: uuidv4(),
      type: 'learner',
      title: 'Crypto Scholar',
      description: 'Completed 5 learning modules about cryptocurrency.',
      icon: "book-open",
      color: 'violet',
      earned: false,
      progress: 2,
      maxProgress: 5
    },
    {
      id: uuidv4(),
      type: 'goal_achiever',
      title: 'Goal Achiever',
      description: 'Reached your first investment goal.',
      icon: "target",
      color: 'rose',
      earned: false
    },
    {
      id: uuidv4(),
      type: 'diamond_hands',
      title: 'Diamond Hands',
      description: 'Held through a 20% market downturn without selling.',
      icon: "gift",
      color: 'sky',
      earned: false
    },
    {
      id: uuidv4(),
      type: 'elite_investor',
      title: 'Elite Investor',
      description: 'Achieved a portfolio value of over $100,000.',
      icon: "star",
      color: 'pink',
      earned: metrics.totalValue >= 100000,
      earnedDate: metrics.totalValue >= 100000 ? new Date().toISOString() : undefined,
      progress: Math.min(Math.floor(metrics.totalValue / 1000), 100),
      maxProgress: 100
    },
  ];
  
  return achievements;
};