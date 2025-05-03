import * as React from "react";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipInfoProps {
  /**
   * The tooltip text or content
   */
  content: React.ReactNode;
  
  /**
   * Children to be wrapped by the tooltip
   */
  children?: React.ReactNode;
  
  /**
   * Size of the icon
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether to hide the icon
   */
  hideIcon?: boolean;
  
  /**
   * Side of the tooltip
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Alignment of the tooltip
   */
  align?: 'start' | 'center' | 'end';
  
  /**
   * Additional CSS classes to add
   */
  className?: string;
  
  /**
   * The icon to use instead of the default info icon
   */
  icon?: React.ReactNode;
  
  /**
   * Width of the tooltip content
   */
  width?: string;
}

/**
 * A tooltip component with an info icon trigger
 */
export function TooltipInfo({
  content,
  children,
  size = 'md',
  hideIcon = false,
  side = 'top',
  align = 'center',
  className = "",
  icon,
  width = "300px",
}: TooltipInfoProps) {
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  
  const sizeClass = iconSizes[size];
  
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger className={`inline-flex items-center ${className}`} asChild>
        <span className="cursor-help inline-flex items-center gap-0.5">
          {children}
          {!hideIcon && (
            <span className="ml-0.5 text-neutral-mid inline-flex">
              {icon || <InfoIcon className={sizeClass} />}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        align={align} 
        className="bg-white dark:bg-zinc-800 text-black dark:text-white p-4 rounded-lg shadow-lg border border-neutral-200 dark:border-zinc-700" 
        style={{ maxWidth: width }}
      >
        <div className="text-sm">{content}</div>
      </TooltipContent>
    </Tooltip>
  );
}