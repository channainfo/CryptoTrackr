import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AchievementBadge } from './GemBadge';
import { Trophy } from 'lucide-react';
import type { LearningModule, LearningProgress } from '@/types/education';
import { cn } from '@/lib/utils';
import { generateAchievements } from '@/lib/achievements';

interface AchievementGridProps {
  modules: LearningModule[];
  progress: LearningProgress[] | undefined;
  className?: string;
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({ 
  modules, 
  progress,
  className 
}) => {
  // Use our achievement generator
  const achievements = generateAchievements(modules, progress);
  
  // Count earned achievements
  const earnedCount = achievements.filter(a => a.completed).length;
  
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center">
            <Trophy className="mr-2 w-5 h-5 text-amber-500" />
            <span>Achievements</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {earnedCount} of {achievements.length} earned
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              completed={achievement.completed}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementGrid;