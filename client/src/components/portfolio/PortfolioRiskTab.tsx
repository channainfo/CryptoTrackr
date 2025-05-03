import React from 'react';
import { usePortfolioRiskAssessment } from '@/hooks/useRiskAssessment';
import RiskAssessmentCard from '@/components/risk/RiskAssessmentCard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PortfolioRiskTabProps {
  portfolioId: string;
}

const PortfolioRiskTab: React.FC<PortfolioRiskTabProps> = ({ portfolioId }) => {
  const { data, isLoading, error } = usePortfolioRiskAssessment(portfolioId);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Risk assessment unavailable</h3>
        <p className="text-muted-foreground max-w-md">
          We couldn't generate a risk assessment for this portfolio at this time.
          This could be due to insufficient portfolio data or a temporary service issue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Portfolio Risk Assessment</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">
                This AI-powered assessment analyzes your portfolio composition, asset correlations, 
                market conditions, and historical performance to identify risks and provide personalized recommendations.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {data ? (
            <RiskAssessmentCard
              data={data}
              isLoading={isLoading}
              compact={false}
            />
          ) : isLoading ? (
            <RiskAssessmentCard
              data={{} as any}
              isLoading={true}
              compact={false}
            />
          ) : (
            <div className="bg-muted/30 p-6 rounded-lg border text-center">
              <p className="text-muted-foreground">Risk analysis data is being prepared...</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4 pt-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Understanding Risk Scores</h3>
                  <p className="text-sm text-muted-foreground">
                    Risk scores range from 1-10, with higher numbers indicating greater risk.
                    These scores help you make informed decisions about portfolio adjustments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 pt-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Diversification Score</h3>
                  <p className="text-sm text-muted-foreground">
                    A higher diversification score (closer to 10) indicates a well-diversified portfolio 
                    that may be better protected against market volatility.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 pt-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Risk Factors</h3>
                  <p className="text-sm text-muted-foreground">
                    Risk factors highlight specific elements in your portfolio that contribute to 
                    your overall risk level, including market exposure, concentration, and volatility.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mt-8">
        <p>
          This risk analysis is generated using AI and is for informational purposes only. It should not be considered 
          financial advice. Always do your own research before making investment decisions.
        </p>
      </div>
    </div>
  );
};

export default PortfolioRiskTab;