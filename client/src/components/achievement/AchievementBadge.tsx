import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ProgressCircle } from '@/components/ui/progress-circle';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export type AchievementType = 
  | 'first_investment'
  | 'diversified_portfolio'
  | 'profit_milestone'
  | 'consistent_dca'
  | 'long_term_holder'
  | 'risk_manager'
  | 'trading_volume'
  | 'market_timing'
  | 'global_investor'
  | 'smart_investor'
  | 'power_trader'
  | 'learner'
  | 'goal_achiever'
  | 'diamond_hands'
  | 'elite_investor';

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
  level?: number;
  maxLevel?: number;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withDetails?: boolean;
  className?: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'md',
  withDetails = false,
  className
}) => {
  const { toast } = useToast();
  
  // Helper function to render icons from string names
  const renderIcon = (iconName: string, className: string) => {
    // Convert kebab-case to PascalCase for Lucide icons
    const iconKey = iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    
    // Get the icon component from Lucide
    const IconComponent = (LucideIcons as any)[iconKey];
    
    if (IconComponent) {
      return React.createElement(IconComponent, { className });
    }
    
    // Fallback to Award icon if not found
    return React.createElement(LucideIcons.Award, { className });
  };

  // Badge dimensions based on size
  const dimensions = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28'
  };

  // Progress circle size
  const progressSize = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl'
  };
  
  // Icon size based on badge size
  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-7 w-7',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  };
  
  // Get the color scheme based on achievement color
  const getBadgeColors = (color: string, earned: boolean) => {
    const baseClasses = 'rounded-full flex items-center justify-center';
    
    if (!earned) {
      return `${baseClasses} bg-muted text-muted-foreground border border-dashed border-muted-foreground/50`;
    }
    
    switch (color) {
      case 'green':
        return `${baseClasses} bg-gradient-to-br from-green-500 to-emerald-600 text-white`;
      case 'blue':
        return `${baseClasses} bg-gradient-to-br from-blue-500 to-indigo-600 text-white`;
      case 'purple':
        return `${baseClasses} bg-gradient-to-br from-purple-500 to-violet-600 text-white`;
      case 'amber':
        return `${baseClasses} bg-gradient-to-br from-amber-500 to-yellow-600 text-white`;
      case 'emerald':
        return `${baseClasses} bg-gradient-to-br from-emerald-500 to-green-600 text-white`;
      case 'indigo':
        return `${baseClasses} bg-gradient-to-br from-indigo-500 to-blue-600 text-white`;
      case 'slate':
        return `${baseClasses} bg-gradient-to-br from-slate-600 to-gray-700 text-white`;
      case 'cyan':
        return `${baseClasses} bg-gradient-to-br from-cyan-500 to-blue-500 text-white`;
      case 'orange':
        return `${baseClasses} bg-gradient-to-br from-orange-500 to-amber-600 text-white`;
      case 'yellow':
        return `${baseClasses} bg-gradient-to-br from-yellow-500 to-amber-500 text-white`;
      case 'violet':
        return `${baseClasses} bg-gradient-to-br from-violet-500 to-purple-600 text-white`;
      case 'rose':
        return `${baseClasses} bg-gradient-to-br from-rose-500 to-pink-600 text-white`;
      case 'sky':
        return `${baseClasses} bg-gradient-to-br from-sky-500 to-blue-600 text-white`;
      case 'pink':
        return `${baseClasses} bg-gradient-to-br from-pink-500 to-rose-600 text-white`;
      default:
        return `${baseClasses} bg-gradient-to-br from-primary to-primary-700 text-primary-foreground`;
    }
  };
  
  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const text = `I just earned the "${achievement.title}" achievement on Trailer! ${achievement.description}`;
    const url = window.location.href;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(achievement.title)}&summary=${encodeURIComponent(achievement.description)}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    
    toast({
      title: 'Shared!',
      description: `You shared your achievement on ${platform.charAt(0).toUpperCase() + platform.slice(1)}.`,
      duration: 3000
    });
  };
  
  // Calculate progress
  const progress = achievement.progress !== undefined && achievement.maxProgress !== undefined
    ? Math.round((achievement.progress / achievement.maxProgress) * 100)
    : 0;
  
  const hasProgress = achievement.progress !== undefined && achievement.maxProgress !== undefined;
  const isInProgress = hasProgress && !achievement.earned;
  
  if (withDetails) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div className="relative">
          {isInProgress && (
            <ProgressCircle 
              value={progress} 
              size={progressSize[size] as "sm" | "md" | "lg" | "xl"}
              className="absolute -inset-1"
            />
          )}
          <div className={cn(dimensions[size], getBadgeColors(achievement.color, achievement.earned))}>
            {achievement.earned ? (
              <span className={iconSize[size]}>
                {renderIcon(achievement.icon, iconSize[size])}
              </span>
            ) : (
              <span className={iconSize[size]}>
                {renderIcon('lock', iconSize[size])}
              </span>
            )}
          </div>
          {achievement.earned && achievement.earnedDate && (
            <div className="absolute -bottom-1 -right-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {format(new Date(achievement.earnedDate), 'MMM d')}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="mt-3 text-center">
          <p className="font-medium">{achievement.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
          
          {isInProgress && (
            <p className="text-xs mt-2">
              <span className="font-medium">{achievement.progress}</span>
              <span className="text-muted-foreground">/{achievement.maxProgress}</span>
            </p>
          )}
          
          {achievement.earned && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 h-7 w-7 p-0 rounded-full">
                  {renderIcon('share-2', 'h-4 w-4')}
                  <span className="sr-only">Share</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full" 
                          onClick={() => handleShare('twitter')}
                        >
                          {renderIcon('twitter', 'h-4 w-4')}
                          <span className="sr-only">Share on Twitter</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share on Twitter</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full" 
                          onClick={() => handleShare('facebook')}
                        >
                          {renderIcon('facebook', 'h-4 w-4')}
                          <span className="sr-only">Share on Facebook</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share on Facebook</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full" 
                          onClick={() => handleShare('linkedin')}
                        >
                          {renderIcon('linkedin', 'h-4 w-4')}
                          <span className="sr-only">Share on LinkedIn</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share on LinkedIn</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    );
  }
  
  // Simple version (just the badge)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative", className)}>
            {isInProgress && (
              <ProgressCircle 
                value={progress} 
                size={progressSize[size] as "sm" | "md" | "lg" | "xl"}
                className="absolute -inset-1"
              />
            )}
            <div className={cn(dimensions[size], getBadgeColors(achievement.color, achievement.earned))}>
              {achievement.earned ? (
                <span className={iconSize[size]}>
                  {renderIcon(achievement.icon, iconSize[size])}
                </span>
              ) : (
                <span className={iconSize[size]}>
                  {renderIcon('lock', iconSize[size])}
                </span>
              )}
            </div>
            {achievement.earned && achievement.earnedDate && (
              <div className="absolute -bottom-1 -right-1">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {format(new Date(achievement.earnedDate), 'MMM d')}
                </Badge>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center space-y-1">
            <p className="font-medium">{achievement.title}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            {isInProgress && (
              <p className="text-xs">
                <span className="font-medium">{achievement.progress}</span>
                <span className="text-muted-foreground">/{achievement.maxProgress}</span>
              </p>
            )}
            {achievement.earned && achievement.earnedDate && (
              <p className="text-xs text-muted-foreground">
                Earned on {format(new Date(achievement.earnedDate), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AchievementBadge;