import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GemBadge } from './GemBadge';
import { Share2, Twitter, Facebook, Linkedin, X, Award, Download } from 'lucide-react';
import { 
  TwitterShareButton, 
  FacebookShareButton, 
  LinkedinShareButton,
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon
} from 'react-share';
import { cn } from '@/lib/utils';
import type { LearningModule } from '@/types/education';

interface ShareableAchievementProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    completed: boolean;
  };
  module?: LearningModule;
  className?: string;
}

// Define achievement card styles based on achievement type
const achievementStyles: Record<string, { color: string; gradient: string; glow: string }> = {
  first_module: {
    color: 'text-blue-600 dark:text-blue-400',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]'
  },
  basics_master: {
    color: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-950/50',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'
  },
  trading_pro: {
    color: 'text-amber-600 dark:text-amber-400',
    gradient: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/50 dark:to-yellow-950/50',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
  },
  defi_expert: {
    color: 'text-purple-600 dark:text-purple-400',
    gradient: 'bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-950/50 dark:to-fuchsia-950/50',
    glow: 'shadow-[0_0_20px_rgba(147,51,234,0.3)]'
  },
  security_guru: {
    color: 'text-red-600 dark:text-red-400',
    gradient: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
  },
  advanced_scholar: {
    color: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-950/50 dark:to-sky-950/50',
    glow: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]'
  },
  half_way: {
    color: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/50',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]'
  },
  crypto_master: {
    color: 'text-orange-600 dark:text-orange-400',
    gradient: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]'
  },
  default: {
    color: 'text-slate-600 dark:text-slate-400',
    gradient: 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950/50 dark:to-gray-900/50',
    glow: 'shadow-md'
  }
};

export const ShareableAchievement: React.FC<ShareableAchievementProps> = ({ 
  achievement, 
  module,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!achievement.completed) {
    return null;
  }
  
  const AchievementIcon = achievement.icon;
  const style = achievementStyles[achievement.id] || achievementStyles.default;
  
  // Generate share text
  const shareTitle = `I earned the "${achievement.title}" achievement on Trailer!`;
  const shareText = `${shareTitle} ${achievement.description}. Learn about crypto with Trailer - the best crypto portfolio tracker and learning platform.`;
  const shareUrl = window.location.origin + '/learning';
  
  return (
    <>
      <Card 
        className={cn(
          style.gradient,
          'border relative overflow-hidden transition-all',
          className
        )}
      >
        <div className="absolute top-0 right-0 p-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full bg-white/80 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50"
            onClick={() => setIsOpen(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
              style.glow
            )}>
              <AchievementIcon className="w-6 h-6" />
            </div>
            <CardTitle className={cn('text-lg', style.color)}>
              {achievement.title}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            {achievement.description}
          </p>
          {module && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{module.title}</span>
              <GemBadge tier="completed" size="sm" />
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Achievement</DialogTitle>
            <DialogDescription>
              Share your "{achievement.title}" achievement on social media
            </DialogDescription>
          </DialogHeader>
          
          <div className={cn(
            'p-6 rounded-lg mb-4 border relative overflow-hidden',
            style.gradient
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
                style.glow
              )}>
                <AchievementIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className={cn('font-bold text-lg', style.color)}>
                  {achievement.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Achievement Unlocked
                </p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-4">
              {achievement.description}
            </p>
            
            {module && (
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {module.title}
                </span>
              </div>
            )}
            
            <div className="absolute bottom-2 right-2 opacity-30">
              <img 
                src="/logo.png" 
                alt="Trailer Logo" 
                className="h-8" 
                onError={(e) => { e.currentTarget.style.display = 'none' }} 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-4">
              <TwitterShareButton url={shareUrl} title={shareText}>
                <Button variant="outline" className="flex items-center gap-2">
                  <TwitterIcon size={20} round />
                  <span>Twitter</span>
                </Button>
              </TwitterShareButton>
              
              <FacebookShareButton url={shareUrl}>
                <Button variant="outline" className="flex items-center gap-2">
                  <FacebookIcon size={20} round />
                  <span>Facebook</span>
                </Button>
              </FacebookShareButton>
              
              <LinkedinShareButton url={shareUrl} title={shareTitle}>
                <Button variant="outline" className="flex items-center gap-2">
                  <LinkedinIcon size={20} round />
                  <span>LinkedIn</span>
                </Button>
              </LinkedinShareButton>
            </div>
            
            <Button variant="secondary" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Download Image</span>
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-start">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareableAchievement;