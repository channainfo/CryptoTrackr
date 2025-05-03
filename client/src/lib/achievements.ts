import {
  BookOpen,
  Brain,
  Trophy,
  Award,
  Zap,
  Shield,
  TrendingUp,
  Target,
  Medal,
  Gem
} from 'lucide-react';
import type { LearningModule, LearningProgress } from '@/types/education';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

// Helper to determine category completion
function isCategoryCompleted(
  category: string,
  modules: LearningModule[],
  progress: LearningProgress[] | undefined
): boolean {
  // Get all modules in this category
  const categoryModules = modules.filter(m => m.category === category);
  if (categoryModules.length === 0) return false;
  
  // Check if all modules in this category are completed
  const completedModulesInCategory = categoryModules.filter(module => 
    progress?.some(p => p.moduleId === module.id && p.status === 'completed')
  );
  
  return completedModulesInCategory.length === categoryModules.length;
}

// Generate achievements based on progress
export function generateAchievements(
  modules: LearningModule[],
  progress: LearningProgress[] | undefined
): Achievement[] {
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
  
  // Count completed modules
  const completedModulesCount = progress?.filter(p => p.status === 'completed').length || 0;
  
  // Create achievements
  const achievements: Achievement[] = [
    {
      id: 'first_module',
      title: 'First Step',
      description: 'Complete your first learning module',
      icon: BookOpen,
      completed: Boolean(progress?.some(p => p.status === 'completed'))
    },
    {
      id: 'basics_master',
      title: 'Basics Master',
      description: 'Complete all basics modules',
      icon: Brain,
      completed: isCategoryCompleted('basics', modules, progress)
    },
    {
      id: 'trading_pro',
      title: 'Trading Pro',
      description: 'Complete all trading modules',
      icon: TrendingUp,
      completed: isCategoryCompleted('trading', modules, progress)
    },
    {
      id: 'defi_expert',
      title: 'DeFi Expert',
      description: 'Complete all DeFi modules',
      icon: Zap,
      completed: isCategoryCompleted('defi', modules, progress)
    },
    {
      id: 'security_guru',
      title: 'Security Guru',
      description: 'Complete all security modules',
      icon: Shield,
      completed: isCategoryCompleted('security', modules, progress)
    },
    {
      id: 'advanced_scholar',
      title: 'Advanced Scholar',
      description: 'Complete all advanced modules',
      icon: Award,
      completed: isCategoryCompleted('advanced', modules, progress)
    },
    {
      id: 'half_way',
      title: 'Half Way There',
      description: 'Complete 50% of all modules',
      icon: Target,
      completed: completedModulesCount >= Math.ceil(modules.length / 2) && modules.length > 0
    },
    {
      id: 'crypto_master',
      title: 'Crypto Master',
      description: 'Complete all learning modules',
      icon: Trophy,
      completed: modules.length > 0 && completedModulesCount === modules.length
    }
  ];
  
  return achievements;
}