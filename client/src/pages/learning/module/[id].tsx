import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Container } from "@/components/ui/container";
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, Clock, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModuleDetailSkeleton } from "@/components/learning/ModuleDetailSkeleton";
import { useLearningModuleDetails, useStartModule, useUpdateSectionProgress, useCompleteModule } from "@/hooks/use-learning";
import type { LearningModule, ContentSection } from "@/types/education";

// Default user ID for demo purposes
const DEFAULT_USER_ID = "demo";

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
          {section.content.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      );
    // Can add more content types in the future (video, interactive, etc.)
    default:
      return <div>Unknown content type</div>;
  }
};

interface ModuleDetailProps {
  id: string;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ id }) => {
  const [, setLocation] = useLocation();
  const [currentSection, setCurrentSection] = useState(0);
  const { toast } = useToast();
  
  // Fetch module details including quizzes and progress
  const { data: moduleData, isLoading } = useLearningModuleDetails(id);
  
  // Mutations for tracking progress
  const startModuleMutation = useStartModule();
  const updateSectionMutation = useUpdateSectionProgress();
  const completeModuleMutation = useCompleteModule();
  
  // Parse content sections from the module data
  const contentSections = moduleData?.module?.content 
    ? parseModuleContent(moduleData.module.content) 
    : [];
  
  // Initialize module when first loaded
  useEffect(() => {
    if (moduleData?.module && !moduleData.progress) {
      startModuleMutation.mutate({
        userId: DEFAULT_USER_ID,
        moduleId: id
      });
    } else if (moduleData?.progress?.status === "in_progress") {
      // If module was already started, go to last section
      setCurrentSection(moduleData.progress.lastCompletedSection);
    }
  }, [moduleData, id]);
  
  // Update section progress when moving to next section
  const handleNextSection = () => {
    if (currentSection < contentSections.length - 1) {
      const nextSection = currentSection + 1;
      
      // Update the progress in the database
      updateSectionMutation.mutate({
        userId: DEFAULT_USER_ID,
        moduleId: id,
        section: nextSection
      });
      
      setCurrentSection(nextSection);
    } else {
      // Complete the module if this is the last section
      completeModuleMutation.mutate({
        userId: DEFAULT_USER_ID,
        moduleId: id
      }, {
        onSuccess: () => {
          // If we have a quiz, go to it, otherwise go back to learning page
          if (moduleData?.quizzes?.length) {
            // Get the first quiz ID for this module
            const quizId = moduleData.quizzes[0].id;
            setLocation(`/learning/quiz/${quizId}`);
          } else {
            toast({
              title: "Module Completed!",
              description: "Congratulations on completing this module.",
            });
            setLocation('/learning');
          }
        }
      });
    }
  };
  
  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };
  
  if (isLoading) {
    return (
      <Container>
        <div className="py-8">
          {/* Back button skeleton */}
          <div className="mb-2">
            <Button variant="ghost" size="sm" disabled>
              <ChevronLeft className="mr-1 w-4 h-4" /> Back to Learning Center
            </Button>
          </div>
          
          {/* Module content skeleton */}
          <ModuleDetailSkeleton />
        </div>
      </Container>
    );
  }
  
  if (!moduleData?.module) {
    return (
      <Container>
        <div className="py-8">
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
      </Container>
    );
  }
  
  const { module, progress } = moduleData;
  const currentContentSection = contentSections[currentSection];
  const isLastSection = currentSection === contentSections.length - 1;
  const progressPercentage = ((currentSection + 1) / contentSections.length) * 100;
  
  return (
    <Container>
      <div className="py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild 
              className="mb-2"
            >
              <Link to="/learning">
                <ChevronLeft className="mr-1 w-4 h-4" /> Back to Learning Center
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">{module.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{module.category.charAt(0).toUpperCase() + module.category.slice(1)}</Badge>
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
            <Progress value={progressPercentage} className="w-full md:w-64 h-2" />
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
                  <CardDescription>{currentContentSection.title}</CardDescription>
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
            <Button 
              onClick={handleNextSection}
            >
              {isLastSection ? (
                <>
                  {moduleData?.quizzes?.length 
                    ? "Go to Quiz" 
                    : "Complete Module"
                  }
                  <CheckCircle className="ml-1 w-4 h-4" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="ml-1 w-4 h-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Container>
  );
};

export default ModuleDetail;