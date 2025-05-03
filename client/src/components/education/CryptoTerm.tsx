import React from 'react';
import { BookOpenIcon } from 'lucide-react';
import { TooltipInfo } from '@/components/ui/tooltip-info';
import { useCryptoEducation } from '@/hooks/use-crypto-education';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

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
  size = 'sm', 
  tooltipSide = 'top', 
  className = '',
}) => {
  const { getDefinition } = useCryptoEducation();
  const definition = getDefinition(termKey);
  
  if (!definition) {
    console.warn(`No definition found for term key: ${termKey}`);
    return <>{children}</>;
  }
  
  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-medium">{definition.term}</div>
      <p>{definition.definition}</p>
      
      <div className="pt-2 flex justify-between items-center">
        {definition.learnMoreUrl && (
          <Button variant="link" className="p-0 h-auto" asChild>
            <a 
              href={definition.learnMoreUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary text-xs"
            >
              Learn more →
            </a>
          </Button>
        )}
        
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link 
            href="/learning/glossary"
            className="text-primary text-xs flex items-center"
          >
            <BookOpenIcon className="h-3 w-3 mr-1" />
            Glossary
          </Link>
        </Button>
      </div>
    </div>
  );
  
  return (
    <TooltipInfo
      content={tooltipContent}
      hideIcon={hideIcon}
      size={size}
      side={tooltipSide}
      className={className}
      width="320px"
    >
      {children || definition.term}
    </TooltipInfo>
  );
};