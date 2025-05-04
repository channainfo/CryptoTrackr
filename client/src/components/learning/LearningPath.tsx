import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { GemBadge, AchievementBadge } from "./GemBadge";
import type {
  LearningModule,
  LearningProgress,
  LearningCategory,
} from "@/types/education";

interface LearningPathProps {
  modules: LearningModule[];
  progress: LearningProgress[] | undefined;
  className?: string;
}

// Helper to get module status
function getModuleStatus(
  progress: LearningProgress[] | undefined,
  moduleId: string,
) {
  if (!progress) return "not_started";
  const moduleProgress = progress.find((p) => p.moduleId === moduleId);
  return moduleProgress?.status || "not_started";
}

export const LearningPath: React.FC<LearningPathProps> = ({
  modules,
  progress,
  className,
}) => {
  // Sort modules by their order property
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  // Calculate overall progress percentage
  const completedModules =
    progress?.filter((p) => p.status === "completed").length || 0;
  const totalModules = modules.length;
  const progressPercentage =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Determine achievement level based on progress percentage
  const achievementLevel =
    progressPercentage >= 100
      ? "diamond"
      : progressPercentage >= 80
        ? "platinum"
        : progressPercentage >= 60
          ? "gold"
          : progressPercentage >= 40
            ? "silver"
            : progressPercentage >= 20
              ? "bronze"
              : progressPercentage > 0
                ? "in_progress"
                : "not_started";

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Your Learning Path</CardTitle>
          <GemBadge tier={achievementLevel} showLabel animate />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mt-4">
          {/* Vertical path line */}
          <div className="absolute top-0 bottom-0 left-[22px] w-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

          {/* Module items */}
          <div className="space-y-8">
            {sortedModules.map((module, index) => {
              const status = getModuleStatus(progress, module.id);
              const isCompleted = status === "completed";
              const isInProgress = status === "in_progress";

              return (
                <div
                  key={module.id}
                  className="relative flex items-start gap-4"
                >
                  {/* Status indicator */}
                  <div className="z-10 mt-1">
                    <GemBadge
                      tier={
                        isCompleted
                          ? "completed"
                          : isInProgress
                            ? "in_progress"
                            : "not_started"
                      }
                      showLabel={false}
                      size="lg"
                      animate
                    />
                  </div>

                  {/* Module details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3
                        className={`font-semibold ${isCompleted ? "text-blue-600 dark:text-blue-400" : ""}`}
                      >
                        {module.title}
                      </h3>
                      <span
                        className={`text-sm ${isCompleted ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        {module.estimatedMinutes} mins
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {module.description}
                    </p>
                    <Button
                      variant={
                        isCompleted
                          ? "secondary"
                          : isInProgress
                            ? "default"
                            : "outline"
                      }
                      size="sm"
                      asChild
                    >
                      <Link to={`/learning/module/${module.id}`}>
                        {isCompleted
                          ? "Review"
                          : isInProgress
                            ? "Continue"
                            : "Start"}
                        <ArrowRight className="ml-1 w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {progressPercentage === 100 && (
          <div className="mt-8 flex justify-center">
            <AchievementBadge
              completed={true}
              title="Learning Path Completed!"
              description="Congratulations! You've completed all learning modules."
              className="w-full max-w-xs"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningPath;
