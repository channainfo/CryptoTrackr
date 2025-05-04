import React, { useState, useEffect } from 'react';
import { BarChart3, ChevronDown, ListFilter } from 'lucide-react';
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
import PageHeader from '@/components/layout/PageHeader';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import PortfolioAnalyticsTab from '@/components/portfolio/PortfolioAnalyticsTab';
import { portfolioApi } from '@/lib/api';

const AnalyticsPage = () => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  
  // Fetch all portfolios
  const { data: portfolios, isLoading: isLoadingPortfolios } = useQuery({
    queryKey: ['/api/portfolios'],
    select: (data) => data.filter((p: any) => !p.isWatchlist)
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
        <PortfolioAnalyticsTab portfolioId={selectedPortfolioId} />
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