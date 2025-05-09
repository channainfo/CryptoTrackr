import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BookOpen,
  Clock,
  Award,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModuleDetailSkeleton } from "@/components/learning/ModuleDetailSkeleton";
import {
  useLearningModuleDetails,
  useStartModule,
  useUpdateSectionProgress,
  useCompleteModule,
} from "@/hooks/use-learning";
import type { LearningModule, ContentSection } from "@/types/education";
import ReactConfetti from "react-confetti";
import { useUser } from "@/contexts/UserContext";

// Separate Confetti component to avoid hooks ordering issues
const Celebration = ({ show }: { show: boolean }) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!show) return null;

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.15}
      colors={[
        "#FF6B6B",
        "#4ECDC4",
        "#F9D423",
        "#45B7D1",
        "#E14658",
        "#6E44FF",
      ]}
    />
  );
};

// Parse the module content (JSON string) into structured content sections
function parseModuleContent(content: string): ContentSection[] {
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse module content:", e);
    return [];
  }
}

// Component to render different content section types
const ContentSectionComponent = ({ section }: { section: ContentSection }) => {
  switch (section.type) {
    case "text":
      return (
        <div className="prose dark:prose-invert max-w-none">
          <h3 className="text-xl font-bold mb-4">{section.title}</h3>
          {section.content.split("\n\n").map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      );
    // Can add more content types in the future (video, interactive, etc.)
    default:
      return <div>Unknown content type</div>;
  }
};

// Component for the next button content to avoid conditional hook issues
const NextButtonContent = ({
  isLastSection,
  hasQuizzes,
}: {
  isLastSection: boolean;
  hasQuizzes: boolean;
}) => {
  if (isLastSection) {
    const buttonText = hasQuizzes ? "Go to Quiz" : "Complete Module";
    return (
      <>
        {buttonText}
        <CheckCircle className="ml-1 w-4 h-4" />
      </>
    );
  }

  return (
    <>
      Next <ChevronRight className="ml-1 w-4 h-4" />
    </>
  );
};

interface ModuleDetailProps {
  id: string;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ id }) => {
  const [, setLocation] = useLocation();
  const [currentSection, setCurrentSection] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      setLocation('/login');
    }
  }, [user, isUserLoading, setLocation]);

  // Fetch module details including quizzes and progress
  const { data: moduleData, isLoading: isModuleLoading } = useLearningModuleDetails(id);

  // Mutations for tracking progress
  const startModuleMutation = useStartModule();
  const updateSectionMutation = useUpdateSectionProgress();
  const completeModuleMutation = useCompleteModule();

  // Extract module and quizzes early to avoid conditional logic in render
  const module = moduleData?.module;
  const quizzes = moduleData?.quizzes || [];
  const progress = moduleData?.progress;
  const hasQuizzes = quizzes.length > 0;

  // Memoized content sections to avoid recalculations
  const contentSections = useMemo(() => {
    return module?.content ? parseModuleContent(module.content) : [];
  }, [module?.content]);

  // Derived state
  const currentContentSection = contentSections[currentSection] || null;
  const isLastSection = currentSection === contentSections.length - 1;
  const progressPercentage =
    contentSections.length > 0
      ? ((currentSection + 1) / contentSections.length) * 100
      : 0;



  // Check for progress on mount and set current section accordingly
  useEffect(() => {
    if (progress?.status === "in_progress") {
      setCurrentSection(progress.lastCompletedSection || 0);
    }
  }, [progress]);

  // Initialize module when first loaded - if needed and not already loaded
  useEffect(() => {
    // Only attempt to start the module if we have a logged-in user
    if (!user || isUserLoading) return;
    
    const shouldStartModule =
      module &&
      !progress &&
      !startModuleMutation.isPending &&
      !startModuleMutation.isSuccess;

    if (shouldStartModule) {
      startModuleMutation.mutate({
        userId: user.id, // Use the logged-in user ID
        moduleId: id,
      });
    }
  }, [
    user,
    isUserLoading,
    module,
    progress,
    id,
    startModuleMutation.isPending,
    startModuleMutation.isSuccess,
    startModuleMutation,
  ]);

  // Handle next button click - advance section or complete module
  const handleNextSection = () => {
    // Guard clause - do nothing if no content
    if (contentSections.length === 0) return;

    if (currentSection < contentSections.length - 1) {
      // Not the last section - move to next
      const nextSection = currentSection + 1;

      // Make sure we have a user before updating progress
      if (user) {
        // Update progress via API
        updateSectionMutation.mutate({
          userId: user.id,
          moduleId: id,
          section: nextSection,
        });
      }

      // Update UI
      setCurrentSection(nextSection);
    } else {
      // Last section - complete the module
      if (user) {
        completeModuleMutation.mutate(
          {
            userId: user.id,
            moduleId: id,
          },
          {
            onSuccess: () => {
              // Show completion UI effects
              setShowConfetti(true);

              // Notify user
              toast({
                title: "Module Completed!",
                description: "Congratulations on completing this module.",
              });

              // Navigate after delay
              setTimeout(() => {
                if (hasQuizzes) {
                  setLocation(`/learning/quiz/${quizzes[0].id}`);
                } else {
                  setLocation("/learning");
                }
              }, 3000);
            },
          }
        );
      }
    }
  };

  // Handle previous button click
  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  // Effect to hide confetti after a few seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Loading state
  if (isModuleLoading || isUserLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div>
          <div className="mb-2">
            <Button variant="ghost" size="sm" disabled>
              <ChevronLeft className="mr-1 w-4 h-4" /> Back to Learning Center
            </Button>
          </div>
          <ModuleDetailSkeleton />
        </div>
      </div>
    );
  }

  // Module not found state
  if (!module) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div>
          <Alert variant="destructive">
            <AlertTitle>Module Not Found</AlertTitle>
            <AlertDescription>
              The learning module you're looking for couldn't be found.
              <Button asChild variant="link" className="p-0 ml-2">
                <Link to="/learning">Return to Learning Center</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Main UI render
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <Celebration show={showConfetti} />
      <div className="py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/learning">
                <ChevronLeft className="mr-1 w-4 h-4" /> Back to Learning Center
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{module.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {module.category.charAt(0).toUpperCase() +
                  module.category.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center">
                <Clock className="mr-1 w-4 h-4" />
                {module.estimatedMinutes} minutes
              </span>
              <span className="text-sm text-muted-foreground flex items-center">
                <Award className="mr-1 w-4 h-4" />
                Difficulty: {module.difficulty}
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <div className="text-sm flex justify-between mb-1">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress
              value={progressPercentage}
              className="w-full md:w-64 h-2"
            />
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <BookOpen className="mr-2 w-5 h-5" />
              <div>
                <CardTitle>
                  Section {currentSection + 1} of {contentSections.length}
                </CardTitle>
                {currentContentSection?.title && (
                  <CardDescription>
                    {currentContentSection.title}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {currentContentSection && (
              <ContentSectionComponent section={currentContentSection} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePreviousSection}
              disabled={currentSection === 0}
            >
              <ChevronLeft className="mr-1 w-4 h-4" /> Previous
            </Button>
            <Button onClick={handleNextSection}>
              <NextButtonContent
                isLastSection={isLastSection}
                hasQuizzes={hasQuizzes}
              />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ModuleDetail;
