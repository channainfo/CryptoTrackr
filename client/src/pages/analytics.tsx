import React, { useState, useEffect } from 'react';
import { BarChart3, ChevronDown, ListFilter, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '@/components/layout/PageHeader';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import PortfolioAnalyticsTab from '@/components/portfolio/PortfolioAnalyticsTab';
import AchievementGrid from '@/components/achievement/AchievementGrid';
import { useAchievements } from '@/hooks/useAchievements';
import { portfolioApi } from '@/lib/api';

// Achievement section for the analytics page
const AchievementSection: React.FC<{ portfolioId: string }> = ({ portfolioId }) => {
  const { achievements, isLoading } = useAchievements(portfolioId);
  
  return (
    <div className="space-y-6">
      <AchievementGrid 
        achievements={achievements}
        isLoading={isLoading}
      />
    </div>
  );
};

const AnalyticsPage = () => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  
  // Fetch all portfolios
  const { data: portfolios, isLoading: isLoadingPortfolios } = useQuery({
    queryKey: ['/api/portfolios'],
    select: (data: any[]) => data.filter((p) => !p.isWatchlist)
  });
  
  // Set default portfolio when data is loaded
  useEffect(() => {
    if (portfolios && portfolios.length > 0 && !selectedPortfolioId) {
      const defaultPortfolio = portfolios.find((p: any) => p.isDefault) || portfolios[0];
      setSelectedPortfolioId(defaultPortfolio.id);
    }
  }, [portfolios, selectedPortfolioId]);
  
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <Breadcrumbs 
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Analytics' }
        ]}
      />
      
      <PageHeader
        title="Portfolio Analytics"
        description="Track and analyze your portfolio performance over time"
        icon={<BarChart3 className="h-6 w-6" />}
      />
      
      {/* Portfolio Selector */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm font-medium">Select Portfolio:</div>
          <div className="flex-1 max-w-xs">
            {isLoadingPortfolios ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select
                value={selectedPortfolioId || undefined}
                onValueChange={(value) => setSelectedPortfolioId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios?.map((portfolio: any) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </Card>
      
      {/* Analytics Content */}
      {selectedPortfolioId ? (
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance">
            <PortfolioAnalyticsTab portfolioId={selectedPortfolioId} />
          </TabsContent>
          
          <TabsContent value="achievements">
            <AchievementSection portfolioId={selectedPortfolioId} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12 bg-muted rounded-xl">
          <p className="text-muted-foreground">
            {isLoadingPortfolios 
              ? 'Loading portfolios...' 
              : portfolios?.length === 0 
                ? 'No portfolios found. Create a portfolio to see analytics.' 
                : 'Select a portfolio to view analytics.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;