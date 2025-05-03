import React from 'react';
import { usePortfolioRiskAssessment } from '@/hooks/useRiskAssessment';
import RiskAssessmentCard from '@/components/risk/RiskAssessmentCard';
import { AlertTriangle } from 'lucide-react';

interface PortfolioRiskTabProps {
  portfolioId: string;
}

const PortfolioRiskTab: React.FC<PortfolioRiskTabProps> = ({ portfolioId }) => {
  const { data, isLoading, error } = usePortfolioRiskAssessment(portfolioId);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to generate risk assessment</h3>
        <p className="text-muted-foreground mb-4">
          We encountered an error while generating your risk assessment. This could be due to:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside mb-6">
          <li>Insufficient portfolio data</li>
          <li>Market data unavailability</li>
          <li>Technical difficulties with our AI service</li>
        </ul>
        <p className="text-sm">
          Please try again later or contact support if the problem persists.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Portfolio Risk Analysis</h2>
        <p className="text-muted-foreground">
          Our AI-powered risk assessment tool analyzes your portfolio composition, market conditions, 
          and historical trends to provide a comprehensive risk evaluation and personalized recommendations.
        </p>
      </div>

      {data && (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          <RiskAssessmentCard 
            data={data} 
            isLoading={isLoading}
          />
          
          <div className="bg-muted/50 p-4 rounded-lg border text-sm">
            <h3 className="font-semibold mb-2">About AI Risk Assessment</h3>
            <p className="text-muted-foreground">
              This tool uses advanced AI models to evaluate various risk factors affecting your portfolio. 
              The assessment considers market volatility, asset correlation, diversification, and recent 
              market trends to calculate risk scores and provide actionable recommendations.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Note:</strong> This assessment is provided for informational purposes only and 
              should not be considered as financial advice. Always conduct your own research or consult 
              with a financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioRiskTab;