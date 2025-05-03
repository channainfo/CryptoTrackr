import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const InfoTooltip = ({ content, children, size = 'md', side = 'top' }: InfoTooltipProps) => {
  const sizeMap = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help">
            {children}
            <HelpCircle className={`${sizeMap[size]} ml-1 text-muted-foreground inline hover:text-primary`} />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm p-4">
          <div className="text-sm font-normal">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};