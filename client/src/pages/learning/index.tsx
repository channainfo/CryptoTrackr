import React, { useState } from "react";
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

// Helper component for module cards
const ModuleCard = ({ 
  module, 
  progress 
}: { 
  module: LearningModule; 
  progress: LearningProgress[] | undefined;
}) => {
  const status = getModuleStatus(progress, module.id);
  const statusText = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed"
  }[status];
  
  const progressValue = status === "completed" ? 100 : 
                        status === "in_progress" ? 
                          (progress?.find(p => p.moduleId === module.id)?.lastCompletedSection || 0) * 20 : 0;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Badge 
            variant="outline" 
            className={`${CategoryColors[module.category]} text-white`}
          >
            <span className="mr-1">{CategoryIcons[module.category]}</span> 
            {module.category.charAt(0).toUpperCase() + module.category.slice(1)}
          </Badge>
          <Badge variant={status === "completed" ? "default" : "outline"}>
            {status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
            {statusText}
          </Badge>
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
          <Progress value={progressValue} className="h-2" />
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
        
        {userStats && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <User className="mr-2 w-5 h-5" /> Your Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{userStats.completedModules}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{userStats.inProgressModules}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{userStats.notStartedModules}</div>
                  <div className="text-sm text-muted-foreground">Not Started</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{userStats.completionPercentage}%</div>
                  <div className="text-sm text-muted-foreground">Overall Completion</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between mb-1 text-sm">
                  <span>Overall Progress</span>
                  <span>{userStats.completionPercentage}%</span>
                </div>
                <Progress value={userStats.completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
        
        {recommendedModule && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BookOpen className="mr-2 w-5 h-5" /> Recommended Next Module
              </CardTitle>
              <CardDescription>Continue your learning journey with this recommended module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{recommendedModule.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{recommendedModule.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                </div>
                <Button asChild>
                  <Link to={`/learning/module/${recommendedModule.id}`}>
                    Start Learning
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
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
                    progress={userProgress}
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
    </Container>
  );
};

export default LearningPage;