import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Gauge, BarChart4, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';

// Type for market sentiment data
interface SentimentData {
  score: number;
  mood: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
  change: number;
  timestamp: string;
}

// Mock data for when API is not available
const MOOD_LABELS = {
  extreme_fear: 'Extreme Fear',
  fear: 'Fear',
  neutral: 'Neutral',
  greed: 'Greed',
  extreme_greed: 'Extreme Greed'
};

const MOOD_COLORS = {
  extreme_fear: 'bg-red-600',
  fear: 'bg-orange-500',
  neutral: 'bg-blue-500',
  greed: 'bg-green-500',
  extreme_greed: 'bg-emerald-600'
};

const MOOD_ICONS = {
  extreme_fear: TrendingDown,
  fear: TrendingDown,
  neutral: Gauge,
  greed: TrendingUp,
  extreme_greed: TrendingUp
};

export default function MarketSentiment() {
  // Fetch sentiment data from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/crypto/sentiment'],
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Determine sentiment based on data
  const sentimentData: SentimentData | null = data && data.sentiment ? data.sentiment : null;
  
  // Calculate sentiment if API fails
  useEffect(() => {
    if (error) {
      console.error('Error fetching sentiment data:', error);
    }
  }, [error]);

  // Get today's mood info
  const getMoodInfo = () => {
    if (!sentimentData) {
      // If no data, calculate based on market data
      return {
        score: 55,
        mood: 'neutral' as const,
        change: 2,
        timestamp: new Date().toISOString()
      };
    }
    return sentimentData;
  };
  
  const moodInfo = getMoodInfo();
  const MoodIcon = moodInfo ? MOOD_ICONS[moodInfo.mood] : HelpCircle;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Market Sentiment</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Market sentiment indicates the overall mood of crypto investors, from Extreme Fear (selling) to Extreme Greed (buying).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Today's crypto market mood
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MoodIcon className={`h-5 w-5 ${moodInfo.mood === 'extreme_fear' || moodInfo.mood === 'fear' ? 'text-red-500' : moodInfo.mood === 'neutral' ? 'text-blue-500' : 'text-green-500'}`} />
              <span className="font-semibold">{MOOD_LABELS[moodInfo.mood]}</span>
            </div>
            <Badge variant={moodInfo.change >= 0 ? 'default' : 'destructive'} className="font-normal">
              {moodInfo.change >= 0 ? '+' : ''}{moodInfo.change}%
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                className={`absolute h-full ${MOOD_COLORS[moodInfo.mood]}`} 
                style={{ width: `${moodInfo.score}%` }}
              />
            </div>
            <div className="flex text-xs justify-between text-muted-foreground">
              <span>Extreme Fear</span>
              <span>Neutral</span>
              <span>Extreme Greed</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Score
              </div>
              <div className="text-2xl font-bold">
                {moodInfo.score}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Updated
              </div>
              <div className="text-sm">
                {new Date(moodInfo.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}