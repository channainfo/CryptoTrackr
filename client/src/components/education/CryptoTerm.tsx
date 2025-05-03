import React from 'react';
import { useCryptoEducation } from '@/hooks/use-crypto-education';
import { InfoTooltip } from '@/components/ui/tooltip-info';
import { ExternalLink } from 'lucide-react';

interface CryptoTermProps {
  termKey: string;
  children?: React.ReactNode;
  hideIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const CryptoTerm: React.FC<CryptoTermProps> = ({ 
  termKey, 
  children, 
  hideIcon = false,
  size = 'md',
  tooltipSide = 'top',
  className = ''
}) => {
  const { getTermDefinition } = useCryptoEducation();
  const definition = getTermDefinition(termKey);

  if (!definition) {
    // If term doesn't exist, just render the children or the key
    return <span className={className}>{children || termKey}</span>;
  }

  const tooltipContent = (
    <div className="space-y-2">
      <h3 className="font-semibold">{definition.term}</h3>
      <p>{definition.definition}</p>
      {definition.learnMoreUrl && (
        <a
          href={definition.learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center hover:underline text-xs mt-2"
        >
          Learn more <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      )}
    </div>
  );

  return (
    <InfoTooltip 
      content={tooltipContent} 
      size={size}
      side={tooltipSide}
    >
      <span className={`cursor-help border-b border-dotted border-muted-foreground ${className}`}>
        {children || definition.term}
      </span>
    </InfoTooltip>
  );
};