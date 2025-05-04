import React from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import AchievementGrid from '@/components/achievement/AchievementGrid';
import PageHeader from '@/components/layout/PageHeader';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import * as LucideIcons from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AchievementsPage: React.FC = () => {
  const { achievements, isLoading } = useAchievements();
  
  // Calculate achievement stats
  const totalAchievements = achievements.length;
  const earnedAchievements = achievements.filter(a => a.earned).length;
  const inProgressAchievements = achievements.filter(a => !a.earned && a.progress !== undefined).length;
  const lockedAchievements = achievements.filter(a => !a.earned && a.progress === undefined).length;
  
  const completionPercentage = Math.round((earnedAchievements / totalAchievements) * 100);
  
  // Group achievements by category to show in the summary
  type AchievementCategory = 'investment' | 'trading' | 'learning' | 'hodling' | 'other';
  
  const categories: Record<AchievementCategory, {
    title: string;
    description: string;
    icon: string;
    color: string;
    achievements: typeof achievements;
  }> = {
    investment: {
      title: 'Investment',
      description: 'Portfolio building and diversification',
      icon: 'briefcase',
      color: 'blue',
      achievements: achievements.filter(a => 
        ['first_investment', 'diversified_portfolio', 'elite_investor'].includes(a.type)
      ),
    },
    trading: {
      title: 'Trading',
      description: 'Trading activities and volume',
      icon: 'bar-chart-2',
      color: 'amber',
      achievements: achievements.filter(a => 
        ['trading_volume', 'smart_investor', 'power_trader', 'market_timing'].includes(a.type)
      ),
    },
    learning: {
      title: 'Education',
      description: 'Learning about crypto and finance',
      icon: 'book-open',
      color: 'violet',
      achievements: achievements.filter(a => 
        ['learner'].includes(a.type)
      ),
    },
    hodling: {
      title: 'Holding',
      description: 'Long-term investment strategy',
      icon: 'clock',
      color: 'purple',
      achievements: achievements.filter(a => 
        ['consistent_dca', 'long_term_holder', 'diamond_hands'].includes(a.type)
      ),
    },
    other: {
      title: 'Others',
      description: 'Miscellaneous achievements',
      icon: 'award',
      color: 'green',
      achievements: achievements.filter(a => 
        ['profit_milestone', 'risk_manager', 'global_investor', 'goal_achiever'].includes(a.type)
      ),
    },
  };
  
  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Investment Achievements"
        description="Track your progress and earn badges for investment milestones"
        icon={<LucideIcons.Trophy className="h-6 w-6" />}
      />
      
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <LucideIcons.Home className="h-4 w-4 mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/achievements" current>
              Achievements
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Achievement Progress</CardTitle>
            <CardDescription>Your overall achievement completion</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>{earnedAchievements}/{totalAchievements} unlocked</span>
                  <span className="text-muted-foreground">{inProgressAchievements} in progress</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {Object.entries(categories).map(([key, category]) => {
          const categoryAchievements = category.achievements;
          const earned = categoryAchievements.filter(a => a.earned).length;
          const total = categoryAchievements.length;
          const percentage = total ? Math.round((earned / total) * 100) : 0;
          
          return (
            <Card key={key} className={cn("border-l-4", {
              "border-l-blue-500": category.color === 'blue',
              "border-l-amber-500": category.color === 'amber',
              "border-l-violet-500": category.color === 'violet',
              "border-l-purple-500": category.color === 'purple',
              "border-l-green-500": category.color === 'green',
            })}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {React.createElement(
                      (category.icon as any in LucideIcons)
                        ? (LucideIcons as any)[
                            category.icon
                              .split('-')
                              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                              .join('')
                          ]
                        : LucideIcons.Award,
                      { className: "h-5 w-5" }
                    )}
                    {category.title}
                  </CardTitle>
                  <span className="text-sm font-medium">{earned}/{total}</span>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-2 w-full" />
                ) : (
                  <Progress value={percentage} className="h-2" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="achievements">All Achievements</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements">
          <AchievementGrid 
            achievements={achievements} 
            isLoading={isLoading} 
          />
        </TabsContent>
        
        <TabsContent value="categories">
          <div className="space-y-8">
            {Object.entries(categories).map(([key, category]) => (
              category.achievements.length > 0 && (
                <div key={key} className="space-y-4">
                  <div className="flex items-center gap-2">
                    {React.createElement(
                      (category.icon as any in LucideIcons)
                        ? (LucideIcons as any)[
                            category.icon
                              .split('-')
                              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                              .join('')
                          ]
                        : LucideIcons.Award,
                      { className: "h-5 w-5" }
                    )}
                    <h3 className="text-xl font-semibold">{category.title}</h3>
                  </div>
                  <AchievementGrid 
                    achievements={category.achievements} 
                    isLoading={isLoading} 
                    className="mt-2"
                  />
                </div>
              )
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementsPage;