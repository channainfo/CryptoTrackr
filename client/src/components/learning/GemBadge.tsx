import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Diamond, 
  GemIcon, 
  Trophy, 
  Star, 
  Crown, 
  Gem,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Define our gem tiers and their properties
const gemTiers = {
  'not_started': {
    icon: Clock,
    color: 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    glow: '',
    label: 'Not Started'
  },
  'in_progress': {
    icon: GemIcon,
    color: 'bg-blue-500 text-white',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    label: 'In Progress'
  },
  'completed': {
    icon: Diamond,
    color: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]',
    label: 'Completed'
  },
  'bronze': {
    icon: GemIcon,
    color: 'bg-gradient-to-r from-amber-600 to-yellow-700 text-white',
    glow: 'shadow-[0_0_15px_rgba(180,83,9,0.6)]',
    label: 'Bronze'
  },
  'silver': {
    icon: Star,
    color: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800',
    glow: 'shadow-[0_0_15px_rgba(203,213,225,0.6)]',
    label: 'Silver'
  },
  'gold': {
    icon: Trophy,
    color: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]',
    label: 'Gold'
  },
  'platinum': {
    icon: Crown,
    color: 'bg-gradient-to-r from-emerald-300 to-teal-500 text-teal-900',
    glow: 'shadow-[0_0_20px_rgba(20,184,166,0.6)]',
    label: 'Platinum'
  },
  'diamond': {
    icon: Diamond,
    color: 'bg-gradient-to-r from-indigo-300 to-purple-500 text-white',
    glow: 'shadow-[0_0_25px_rgba(129,140,248,0.7)]',
    label: 'Diamond'
  }
};

export type GemTier = keyof typeof gemTiers;

interface GemBadgeProps {
  tier: GemTier;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

export const GemBadge: React.FC<GemBadgeProps> = ({ 
  tier, 
  showLabel = true, 
  size = 'md',
  animate = false,
  className
}) => {
  const { icon: Icon, color, glow, label } = gemTiers[tier];
  
  // Determine icon size based on badge size
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];
  
  // Determine badge padding based on size
  const padding = {
    sm: showLabel ? 'px-2 py-0.5' : 'p-1',
    md: showLabel ? 'px-2.5 py-1' : 'p-1.5',
    lg: showLabel ? 'px-3 py-1.5' : 'p-2'
  }[size];
  
  // Animation classes
  const animationClass = animate 
    ? 'transition-all duration-500 hover:scale-105 hover:shadow-[0_0_25px_rgba(129,140,248,0.9)]' 
    : '';
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        color,
        glow,
        padding,
        animationClass,
        'border-transparent font-medium flex items-center gap-1',
        className
      )}
    >
      <Icon className={iconSize} />
      {showLabel && <span>{label}</span>}
    </Badge>
  );
};

interface AchievementBadgeProps {
  completed: boolean;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  completed,
  title,
  description,
  icon: CustomIcon,
  className
}) => {
  const Icon = CustomIcon || (completed ? CheckCircle2 : Clock);
  
  return (
    <div className={cn(
      'flex flex-col items-center p-4 rounded-lg border text-center transition-all',
      completed 
        ? 'bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 shadow-md' 
        : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center mb-2',
        completed 
          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className={cn(
        'font-semibold',
        completed ? 'text-blue-800 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
      )}>
        {title}
      </h3>
      {description && (
        <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
};

// A component to display progress with gem tiers
export const ProgressGems: React.FC<{
  progress: number;
  total: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ progress, total, showLabels = false, size = 'md' }) => {
  // Calculate completion percentage
  const percentage = Math.min(100, Math.round((progress / total) * 100));
  
  // Determine gem tier based on percentage
  let tier: GemTier = 'not_started';
  
  if (percentage === 100) {
    tier = 'diamond';
  } else if (percentage >= 80) {
    tier = 'platinum';
  } else if (percentage >= 60) {
    tier = 'gold';
  } else if (percentage >= 40) {
    tier = 'silver';
  } else if (percentage >= 20) {
    tier = 'bronze';
  } else if (percentage > 0) {
    tier = 'in_progress';
  }
  
  return (
    <div className="flex items-center gap-2">
      <GemBadge tier={tier} showLabel={showLabels} size={size} animate />
      <span className="text-sm">{percentage}% Complete</span>
    </div>
  );
};

export default GemBadge;