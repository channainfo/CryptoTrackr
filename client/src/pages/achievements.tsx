import React from "react";
import { useAchievements } from "@/hooks/useAchievements";
import AchievementGrid from "@/components/achievement/AchievementGrid";
import {
  Trophy,
  Briefcase,
  BarChart2,
  BookOpen,
  Clock,
  Award,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const AchievementsPage: React.FC = () => {
  const { achievements, isLoading } = useAchievements();

  // Calculate achievement stats
  const totalAchievements = achievements.length;
  const earnedAchievements = achievements.filter((a) => a.earned).length;
  const inProgressAchievements = achievements.filter(
    (a) => !a.earned && a.progress !== undefined,
  ).length;

  const completionPercentage =
    totalAchievements > 0
      ? Math.round((earnedAchievements / totalAchievements) * 100)
      : 0;

  // Group achievements by category
  const investmentAchievements = achievements.filter((a) =>
    ["first_investment", "diversified_portfolio", "elite_investor"].includes(
      a.type,
    ),
  );

  const tradingAchievements = achievements.filter((a) =>
    [
      "trading_volume",
      "smart_investor",
      "power_trader",
      "market_timing",
    ].includes(a.type),
  );

  const learningAchievements = achievements.filter((a) =>
    ["learner"].includes(a.type),
  );

  const holdingAchievements = achievements.filter((a) =>
    ["consistent_dca", "long_term_holder", "diamond_hands"].includes(a.type),
  );

  const otherAchievements = achievements.filter((a) =>
    [
      "profit_milestone",
      "risk_manager",
      "global_investor",
      "goal_achiever",
    ].includes(a.type),
  );

  // Category definitions with simpler structure
  const categories = [
    {
      id: "investment",
      title: "Investment",
      description: "Portfolio building and diversification",
      icon: <Briefcase className="h-5 w-5" />,
      color: "blue",
      achievements: investmentAchievements,
    },
    {
      id: "trading",
      title: "Trading",
      description: "Trading activities and volume",
      icon: <BarChart2 className="h-5 w-5" />,
      color: "amber",
      achievements: tradingAchievements,
    },
    {
      id: "learning",
      title: "Education",
      description: "Learning about crypto and finance",
      icon: <BookOpen className="h-5 w-5" />,
      color: "violet",
      achievements: learningAchievements,
    },
    {
      id: "hodling",
      title: "Holding",
      description: "Long-term investment strategy",
      icon: <Clock className="h-5 w-5" />,
      color: "purple",
      achievements: holdingAchievements,
    },
    {
      id: "other",
      title: "Others",
      description: "Miscellaneous achievements",
      icon: <Award className="h-5 w-5" />,
      color: "green",
      achievements: otherAchievements,
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Investment Achievements</h2>
          <p className="text-muted-foreground mt-1">
            Track your progress and earn badges for investment milestones
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-sm">
            <Trophy className="h-5 w-5 mr-2 text-amber-500" />
            <span className="font-medium">{earnedAchievements}</span>
            <span className="text-muted-foreground ml-1">
              /{totalAchievements} achieved
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Achievement Progress</CardTitle>
            <CardDescription>
              Your overall achievement completion
            </CardDescription>
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
                  <span className="text-sm text-muted-foreground">
                    Progress
                  </span>
                  <span className="text-sm font-medium">
                    {completionPercentage}%
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>
                    {earnedAchievements}/{totalAchievements} unlocked
                  </span>
                  <span className="text-muted-foreground">
                    {inProgressAchievements} in progress
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {categories.map((category) => {
          const categoryAchievements = category.achievements;
          const earned = categoryAchievements.filter((a) => a.earned).length;
          const total = categoryAchievements.length;
          const percentage = total ? Math.round((earned / total) * 100) : 0;

          return (
            <Card
              key={category.id}
              className={cn("border-l-4", {
                "border-l-blue-500": category.color === "blue",
                "border-l-amber-500": category.color === "amber",
                "border-l-violet-500": category.color === "violet",
                "border-l-purple-500": category.color === "purple",
                "border-l-green-500": category.color === "green",
              })}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                  <span className="text-sm font-medium">
                    {earned}/{total}
                  </span>
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
        <TabsList className="mb-6">
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            All Achievements
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            By Category
          </TabsTrigger>
        </TabsList>

        <TabsContent value="achievements">
          <AchievementGrid achievements={achievements} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-8">
            {categories.map((category) => {
              if (category.achievements.length === 0) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-2">
                    {category.icon}
                    <h3 className="text-xl font-semibold">{category.title}</h3>
                  </div>
                  <AchievementGrid
                    achievements={category.achievements}
                    isLoading={isLoading}
                    className="mt-2"
                  />
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementsPage;
