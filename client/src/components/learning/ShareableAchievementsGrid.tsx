import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareableAchievement } from './ShareableAchievement';
import { EyeOff, Share2, Trophy } from 'lucide-react';
import type { LearningModule, LearningProgress } from '@/types/education';
import { cn } from '@/lib/utils';
import { generateAchievements, type Achievement } from '@/lib/achievements';

interface ShareableAchievementsGridProps {
  modules: LearningModule[];
  progress: LearningProgress[] | undefined;
  className?: string;
}

// Use our achievement definitions

export const ShareableAchievementsGrid: React.FC<ShareableAchievementsGridProps> = ({
  modules,
  progress,
  className
}) => {
  // Generate achievements based on modules and progress
  const achievements = generateAchievements(modules, progress);
  const earnedAchievements = achievements.filter((a: Achievement) => a.completed);
  const hasAchievements = earnedAchievements.length > 0;
  
  // Get module details for each achievement if needed
  const getModuleForAchievement = (achievementId: string) => {
    if (achievementId.includes('_master') || achievementId.includes('_pro') || 
        achievementId.includes('_expert') || achievementId.includes('_guru') || 
        achievementId.includes('_scholar')) {
      // For category-specific achievements, find the last completed module in that category
      const category = achievementId.split('_')[0];
      const completedModulesInCategory = modules
        .filter(m => m.category === category && 
          progress?.some(p => p.moduleId === m.id && p.status === 'completed'));
      
      return completedModulesInCategory[completedModulesInCategory.length - 1];
    } else if (achievementId === 'first_module') {
      // For first module achievement, find the first completed module
      const completedModuleIds = progress
        ?.filter(p => p.status === 'completed')
        .map(p => p.moduleId) || [];
      
      return modules.find(m => m.id === completedModuleIds[0]);
    }
    
    return undefined;
  };
  
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="mr-2 w-5 h-5 text-amber-500" />
            <span>Your Achievements</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {earnedAchievements.length} earned
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {hasAchievements ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earnedAchievements.map((achievement: Achievement) => (
              <ShareableAchievement
                key={achievement.id}
                achievement={achievement}
                module={getModuleForAchievement(achievement.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No Achievements Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete learning modules to earn achievements that you can share with others.
            </p>
            <Button variant="outline" asChild>
              <a href="/learning">Start Learning</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShareableAchievementsGrid;