import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AchievementBadge } from './GemBadge';
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  Award, 
  Zap, 
  Shield, 
  TrendingUp,
  BookOpenCheck,
  Target,
  Medal
} from 'lucide-react';
import type { LearningModule, LearningProgress } from '@/types/education';

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
  // Group modules by category
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, LearningModule[]>);
  
  // Calculate category completion
  const categoryCompletion = Object.entries(modulesByCategory).map(([category, categoryModules]) => {
    const totalInCategory = categoryModules.length;
    const completedInCategory = categoryModules.filter(module => 
      progress?.some(p => p.moduleId === module.id && p.status === 'completed')
    ).length;
    
    return {
      category,
      total: totalInCategory,
      completed: completedInCategory,
      isComplete: totalInCategory > 0 && completedInCategory === totalInCategory
    };
  });
  
  // Create achievements
  const achievements = [
    {
      id: 'first_module',
      title: 'First Step',
      description: 'Complete your first learning module',
      icon: BookOpen,
      completed: (progress?.some(p => p.status === 'completed')) ?? false
    },
    {
      id: 'basics_master',
      title: 'Basics Master',
      description: 'Complete all basics modules',
      icon: Brain,
      completed: categoryCompletion.find(c => c.category === 'basics')?.isComplete ?? false
    },
    {
      id: 'trading_pro',
      title: 'Trading Pro',
      description: 'Complete all trading modules',
      icon: TrendingUp,
      completed: categoryCompletion.find(c => c.category === 'trading')?.isComplete ?? false
    },
    {
      id: 'defi_expert',
      title: 'DeFi Expert',
      description: 'Complete all DeFi modules',
      icon: Zap,
      completed: categoryCompletion.find(c => c.category === 'defi')?.isComplete ?? false
    },
    {
      id: 'security_guru',
      title: 'Security Guru',
      description: 'Complete all security modules',
      icon: Shield,
      completed: categoryCompletion.find(c => c.category === 'security')?.isComplete ?? false
    },
    {
      id: 'advanced_scholar',
      title: 'Advanced Scholar',
      description: 'Complete all advanced modules',
      icon: Award,
      completed: categoryCompletion.find(c => c.category === 'advanced')?.isComplete ?? false
    },
    {
      id: 'half_way',
      title: 'Half Way There',
      description: 'Complete 50% of all modules',
      icon: Target,
      completed: (progress?.filter(p => p.status === 'completed').length ?? 0) >= Math.ceil(modules.length / 2)
    },
    {
      id: 'crypto_master',
      title: 'Crypto Master',
      description: 'Complete all learning modules',
      icon: Trophy,
      completed: modules.length > 0 && (progress?.filter(p => p.status === 'completed').length ?? 0) === modules.length
    }
  ];
  
  // Count earned achievements
  const earnedCount = achievements.filter(a => a.completed).length;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Achievements</span>
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