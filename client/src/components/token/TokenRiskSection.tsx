import React from 'react';
import { useTokenRiskAssessment } from '@/hooks/useRiskAssessment';
import RiskAssessmentCard from '@/components/risk/RiskAssessmentCard';
import { AlertTriangle } from 'lucide-react';

interface TokenRiskSectionProps {
  symbol: string;
  name: string;
}

const TokenRiskSection: React.FC<TokenRiskSectionProps> = ({ symbol, name }) => {
  const { data, isLoading, error } = useTokenRiskAssessment(symbol);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-muted/30 rounded-lg border">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
        <h3 className="text-base font-semibold mb-2">Risk data unavailable</h3>
        <p className="text-sm text-muted-foreground">
          We couldn't generate a risk assessment for {name} ({symbol}) at this time.
          Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-3">Risk Analysis</h2>
      {data ? (
        <RiskAssessmentCard 
          data={data} 
          isLoading={isLoading}
          compact={true}
        />
      ) : isLoading ? (
        <RiskAssessmentCard 
          data={{} as any} 
          isLoading={true}
          compact={true}
        />
      ) : (
        <div className="bg-muted/30 p-4 rounded-lg border text-center">
          <p className="text-muted-foreground">Risk analysis is being prepared...</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-3">
        This analysis is powered by AI and considers various factors including market trends, 
        volatility patterns, and technical indicators. For informational purposes only.
      </p>
    </div>
  );
};

export default TokenRiskSection;