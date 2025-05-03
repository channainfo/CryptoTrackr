import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Container } from "@/components/ui/container";
import { useToast } from "@/hooks/use-toast";
import { Book, BookOpen, Award, TrendingUp, Shield, Zap, ArrowRight, CheckCircle, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleSkeleton, ModuleSkeletonList } from "@/components/learning/ModuleSkeleton";
import LearningPath from "@/components/learning/LearningPath";
import AchievementGrid from "@/components/learning/AchievementGrid";
import ShareableAchievementsGrid from "@/components/learning/ShareableAchievementsGrid";
import { 
  useLearningModules, 
  useLearningModulesByCategory,
  useUserLearningProgress,
  useUserLearningStats,
  useNextRecommendedModule
} from "@/hooks/use-learning";
import type { LearningModule, LearningProgress, LearningCategory } from "@/types/education";

// Default user ID for demo purposes
const DEFAULT_USER_ID = "demo";

const CategoryIcons: Record<LearningCategory, React.ReactNode> = {
  basics: <Book className="w-4 h-4" />,
  trading: <TrendingUp className="w-4 h-4" />,
  defi: <Zap className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  advanced: <Award className="w-4 h-4" />
};

const CategoryColors: Record<LearningCategory, string> = {
  basics: "bg-blue-500",
  trading: "bg-green-500",
  defi: "bg-purple-500",
  security: "bg-red-500",
  advanced: "bg-yellow-500"
};

// Helper to get module status
function getModuleStatus(progress: LearningProgress[] | undefined, moduleId: string) {
  if (!progress) return "not_started";
  const moduleProgress = progress.find(p => p.moduleId === moduleId);
  return moduleProgress?.status || "not_started";
}

// Import the GemBadge component
import { GemBadge, ProgressGems } from "@/components/learning/GemBadge";

// Helper component for module cards
const ModuleCard = ({ 
  module, 
  progress 
}: { 
  module: LearningModule; 
  progress: LearningProgress[] | undefined;
}) => {
  const status = getModuleStatus(progress, module.id);
  
  const progressValue = status === "completed" ? 100 : 
                        status === "in_progress" ? 
                          (progress?.find(p => p.moduleId === module.id)?.lastCompletedSection || 0) * 20 : 0;
  
  // Calculate sections completed
  const moduleProgress = progress?.find(p => p.moduleId === module.id);
  const sectionsCompleted = moduleProgress?.lastCompletedSection || 0;
  const totalSections = 5; // Assuming 5 sections per module
  
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Badge 
            variant="outline" 
            className={`${CategoryColors[module.category]} text-white`}
          >
            <span className="mr-1">{CategoryIcons[module.category]}</span> 
            {module.category.charAt(0).toUpperCase() + module.category.slice(1)}
          </Badge>
          <GemBadge 
            tier={status === "completed" ? "completed" : status === "in_progress" ? "in_progress" : "not_started"} 
            animate 
          />
        </div>
        <CardTitle className="mt-2">{module.title}</CardTitle>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{module.estimatedMinutes} minutes</span>
        </div>
        <div className="mt-4">
          <div className="flex justify-between mb-1 text-sm">
            <span>Progress</span>
            <span>{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2 mb-1" />
          
          {/* Progress detail with gem badge */}
          {status !== "not_started" && (
            <div className="mt-2">
              <ProgressGems
                progress={sectionsCompleted}
                total={totalSections}
                size="sm"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/learning/module/${module.id}`}>
            {status === "not_started" ? "Start Learning" : 
             status === "in_progress" ? "Continue Learning" : 
             "Review Module"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const LearningPage = () => {
  const [category, setCategory] = useState<string>("all");
  const { toast } = useToast();
  
  // Fetch all modules
  const { data: allModules, isLoading: isLoadingModules } = useLearningModules();
  
  // Fetch modules by category if a specific category is selected
  const { data: categoryModules, isLoading: isLoadingCategoryModules } = 
    useLearningModulesByCategory(category !== "all" ? category : "");
  
  // Fetch user progress
  const { data: userProgress, isLoading: isLoadingProgress } = 
    useUserLearningProgress(DEFAULT_USER_ID);
  
  // Fetch user stats
  const { data: userStats, isLoading: isLoadingStats } = 
    useUserLearningStats(DEFAULT_USER_ID);
  
  // Fetch recommended module
  const { data: recommendedModule, isLoading: isLoadingRecommended } = 
    useNextRecommendedModule(DEFAULT_USER_ID);
  
  // Determine which modules to display
  const modulesToDisplay = category === "all" 
    ? allModules 
    : categoryModules;
  
  // Create simulated progress for demo user based on completed modules
  // This will generate progress data for our gems and achievements even though
  // the server returns an empty array for the demo user
  const [simulatedProgress, setSimulatedProgress] = useState<LearningProgress[]>([]);
  
  useEffect(() => {
    if (allModules && (!userProgress || userProgress.length === 0)) {
      // Check localStorage for any saved progress
      const savedProgress = localStorage.getItem('demo-learning-progress');
      if (savedProgress) {
        try {
          setSimulatedProgress(JSON.parse(savedProgress));
        } catch (e) {
          console.error("Failed to parse saved progress", e);
          // Initialize with empty progress
          setSimulatedProgress([]);
        }
      }
    }
  }, [allModules, userProgress]);
  
  // Update simulated progress when completing a module
  useEffect(() => {
    if (simulatedProgress.length > 0) {
      localStorage.setItem('demo-learning-progress', JSON.stringify(simulatedProgress));
    }
  }, [simulatedProgress]);
  
  // Combine server progress with simulated progress
  const effectiveProgress = userProgress?.length ? userProgress : simulatedProgress;
  
  // Calculate derived stats from localStorage progress when server returns empty stats
  const effectiveStats = React.useMemo(() => {
    if (userStats && userStats.completedModules > 0) {
      return userStats; // Use server stats if available
    }
    
    // Calculate stats from our simulated progress if we have modules
    if (allModules && allModules.length > 0 && effectiveProgress && effectiveProgress.length > 0) {
      const totalModules = allModules.length;
      const completedModules = effectiveProgress.filter(p => p.status === 'completed').length;
      const inProgressModules = effectiveProgress.filter(p => p.status === 'in_progress').length;
      const notStartedModules = totalModules - completedModules - inProgressModules;
      const completionPercentage = Math.round((completedModules / totalModules) * 100);
      
      return {
        completedModules,
        inProgressModules,
        notStartedModules,
        totalModules,
        completionPercentage
      };
    }
    
    return userStats; // Fall back to server stats
  }, [userStats, allModules, effectiveProgress]);
  
  // Helper to update simulated progress
  const updateSimulatedProgress = (moduleId: string, status: "not_started" | "in_progress" | "completed", section = 0) => {
    setSimulatedProgress(prev => {
      const existingIndex = prev.findIndex(p => p.moduleId === moduleId);
      if (existingIndex >= 0) {
        // Update existing progress
        const newProgress = [...prev];
        newProgress[existingIndex] = {
          ...newProgress[existingIndex],
          status,
          lastCompletedSection: section
        };
        return newProgress;
      } else {
        // Add new progress
        return [...prev, {
          id: `demo-${moduleId}`,
          userId: DEFAULT_USER_ID,
          moduleId,
          status,
          lastCompletedSection: section,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      }
    });
  };
  
  // Loading state
  const isLoading = isLoadingModules || 
    (category !== "all" && isLoadingCategoryModules) || 
    isLoadingProgress ||
    isLoadingStats;

  if (isLoading) {
    return (
      <Container>
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Learning Center</h1>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          
          {/* Stats Skeleton */}
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-48 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-8 w-12 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>
          
          {/* Recommended Module Skeleton */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <Skeleton className="h-6 w-60 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-grow">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs Skeleton */}
          <div className="mb-6">
            <div className="flex space-x-1 border-b">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-md" />
              ))}
            </div>
          </div>
          
          {/* Module Cards Skeleton */}
          <ModuleSkeletonList />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Learning Center</h1>
          <Button variant="outline" asChild>
            <Link to="/learning/glossary">Crypto Glossary</Link>
          </Button>
        </div>
        
        {effectiveStats && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <User className="mr-2 w-5 h-5" /> Your Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{effectiveStats.completedModules}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{effectiveStats.inProgressModules}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{effectiveStats.notStartedModules}</div>
                  <div className="text-sm text-muted-foreground">Not Started</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{effectiveStats.completionPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Overall Completion</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between mb-1 text-sm">
                  <span>Overall Progress</span>
                  <span>{effectiveStats.completionPercentage}%</span>
                </div>
                <Progress value={effectiveStats.completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
        
{/* Recommended module is now in the sidebar */}
        
        {/* Two-column layout for larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left column with Learning Path - takes 2/3 of space */}
          <div className="lg:col-span-2">
            <LearningPath 
              modules={allModules || []} 
              progress={effectiveProgress}
              className="mb-8"
            />
            
            {/* Split the achievements and sharing into separate rows */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">My Achievements</h2>
                <AchievementGrid 
                  modules={allModules || []} 
                  progress={effectiveProgress}
                />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Share Your Progress</h2>
                <ShareableAchievementsGrid
                  modules={allModules || []} 
                  progress={effectiveProgress}
                />
              </div>
            </div>
          </div>
          
          {/* Right column with next recommended module */}
          <div>
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="mr-2 w-5 h-5" /> Your Learning Journey
                </CardTitle>
                <CardDescription>Track your progress and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Completion</span>
                      <span>{effectiveStats?.completionPercentage || 0}%</span>
                    </div>
                    <Progress value={effectiveStats?.completionPercentage || 0} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-xl font-bold">{effectiveStats?.completedModules || 0}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-xl font-bold">{effectiveStats?.inProgressModules || 0}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {recommendedModule && (
              <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <ArrowRight className="mr-2 w-5 h-5" /> Next Up
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">{recommendedModule.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{recommendedModule.description}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Clock className="w-4 h-4" />
                        <span>{recommendedModule.estimatedMinutes} minutes</span>
                        <span className="mx-1">•</span>
                        <Badge 
                          variant="outline" 
                          className={`${CategoryColors[recommendedModule.category as LearningCategory]} text-white`}
                        >
                          <span className="mr-1">
                            {CategoryIcons[recommendedModule.category as LearningCategory]}
                          </span> 
                          {recommendedModule.category.charAt(0).toUpperCase() + recommendedModule.category.slice(1)}
                        </Badge>
                      </div>
                      
                      <Button asChild className="w-full">
                        <Link to={`/learning/module/${recommendedModule.id}`}>
                          Start Learning
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 my-12 pt-4">
          <h2 className="text-2xl font-bold mb-6">Explore Learning Modules</h2>
          <Tabs defaultValue="all" className="w-full" onValueChange={setCategory}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Modules</TabsTrigger>
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="defi">DeFi</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
          
            <TabsContent value={category} className="mt-0">
              {modulesToDisplay && modulesToDisplay.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modulesToDisplay.map((module: LearningModule) => (
                    <ModuleCard 
                      key={module.id} 
                      module={module} 
                      progress={effectiveProgress}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No modules available</h3>
                  <p className="text-muted-foreground">
                    {category === "all" 
                      ? "Check back later for new learning content." 
                      : `No modules found in the ${category} category.`}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Container>
  );
};

export default LearningPage;