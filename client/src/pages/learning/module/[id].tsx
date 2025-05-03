import React, { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Book,
  BookOpen,
  Award,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  Clock,
  Terminal,
  Code,
  Image,
  Video,
  FileText,
  BarChart
} from "lucide-react";
import {
  useLearningModule,
  useLearningModuleWithQuizzes,
  useUserModuleProgress,
  useStartModule,
  useCompleteModule,
  useUpdateSectionProgress
} from "@/hooks/use-learning";
import type { 
  LearningModule, 
  LearningQuiz, 
  LearningProgress,
  LearningCategory,
  ContentSection
} from "@/types/education";

// Default user ID for demo purposes
const DEFAULT_USER_ID = "demo";

const CategoryIcons: Record<LearningCategory, React.ReactNode> = {
  basics: <Book className="w-4 h-4" />,
  trading: <TrendingUp className="w-4 h-4" />,
  defi: <Zap className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  advanced: <Award className="w-4 h-4" />
};

const ContentTypeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  chart: <BarChart className="w-4 h-4" />
};

// Parse module content into sections
function parseModuleContent(content: string): ContentSection[] {
  try {
    return JSON.parse(content);
  } catch (e) {
    // If not JSON, treat it as a single text section
    return [
      {
        title: "Content",
        content,
        type: "text"
      }
    ];
  }
}

// Quiz component
const ModuleQuiz = ({ 
  quiz, 
  onComplete 
}: { 
  quiz: LearningQuiz; 
  onComplete: (score: number) => void;
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const isCorrect = selectedAnswer === quiz.correctOption;
  
  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setIsAnswered(true);
    if (isCorrect) {
      onComplete(1);
    } else {
      onComplete(0);
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Quiz</CardTitle>
        <CardDescription>Test your knowledge</CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-medium mb-4">{quiz.question}</h3>
        
        <RadioGroup value={selectedAnswer?.toString() || ""} onValueChange={(val) => setSelectedAnswer(parseInt(val))}>
          {quiz.options.map((option, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 p-3 rounded-md border mb-2 ${
                isAnswered
                  ? index === quiz.correctOption
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : index === selectedAnswer
                    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    : ""
                  : "hover:bg-muted"
              }`}
            >
              <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={isAnswered} />
              <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                {option}
              </Label>
              {isAnswered && index === quiz.correctOption && (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </div>
          ))}
        </RadioGroup>
        
        {isAnswered && quiz.explanation && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md">
            <h4 className="font-medium mb-1">Explanation</h4>
            <p>{quiz.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!isAnswered ? (
          <Button onClick={handleSubmit} disabled={selectedAnswer === null}>
            Submit Answer
          </Button>
        ) : (
          <div className="flex items-center">
            <Badge variant={isCorrect ? "default" : "destructive"} className="mr-2">
              {isCorrect ? "Correct" : "Incorrect"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isCorrect ? "Great job!" : "Review the explanation and try again next time."}
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

// Content section component
const ContentSectionComponent = ({ section }: { section: ContentSection }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3 flex items-center">
        {ContentTypeIcons[section.type] && (
          <span className="mr-2">{ContentTypeIcons[section.type]}</span>
        )}
        {section.title}
      </h2>
      
      {section.type === "text" && (
        <div className="prose dark:prose-invert max-w-none">
          {section.content.split("\n").map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      )}
      
      {section.type === "image" && section.mediaUrl && (
        <div className="my-4">
          <img 
            src={section.mediaUrl} 
            alt={section.title} 
            className="rounded-md max-w-full mx-auto"
          />
          <p className="text-sm text-center text-muted-foreground mt-2">{section.content}</p>
        </div>
      )}
      
      {section.type === "video" && section.mediaUrl && (
        <div className="my-4">
          <div className="relative pb-[56.25%] h-0">
            <iframe
              src={section.mediaUrl}
              className="absolute top-0 left-0 w-full h-full rounded-md"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{section.content}</p>
        </div>
      )}
      
      {section.type === "code" && (
        <div className="my-4">
          <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm font-mono">
            <code>{section.content}</code>
          </pre>
        </div>
      )}
      
      {section.type === "chart" && (
        <div className="my-4 p-4 bg-muted rounded-md">
          <p className="text-center text-muted-foreground">[Chart visualization would appear here]</p>
          <p className="text-sm text-muted-foreground mt-2">{section.content}</p>
        </div>
      )}
    </div>
  );
};

const ModuleDetailPage = () => {
  const params = useParams<{ id: string }>();
  const moduleId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAttempted, setQuizAttempted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  // Fetch module with quizzes
  const { 
    data: moduleWithQuizzes, 
    isLoading: isLoadingModule 
  } = useLearningModuleWithQuizzes(moduleId);
  
  // Fetch user progress for this module
  const { 
    data: progress, 
    isLoading: isLoadingProgress 
  } = useUserModuleProgress(DEFAULT_USER_ID, moduleId);
  
  // Mutations for updating progress
  const startModule = useStartModule();
  const completeModule = useCompleteModule();
  const updateSectionProgress = useUpdateSectionProgress();
  
  // Parse module content
  const contentSections = moduleWithQuizzes ? parseModuleContent(moduleWithQuizzes.content) : [];
  const totalSections = contentSections.length;
  
  // Check if we have a quiz
  const hasQuiz = moduleWithQuizzes?.quizzes && moduleWithQuizzes.quizzes.length > 0;
  const quiz = hasQuiz ? moduleWithQuizzes.quizzes[0] : null;
  
  // Compute progress percentage
  const progressPercentage = progress?.status === "completed" 
    ? 100 
    : progress?.status === "in_progress" && progress.lastCompletedSection !== undefined
    ? Math.round(((progress.lastCompletedSection + 1) / (totalSections + (hasQuiz ? 1 : 0))) * 100)
    : 0;
  
  // Start the module if not started yet
  React.useEffect(() => {
    if (
      moduleId && 
      !isLoadingProgress && 
      (!progress || progress.status === "not_started")
    ) {
      startModule.mutate(
        { userId: DEFAULT_USER_ID, moduleId },
        {
          onSuccess: () => {
            toast({
              title: "Module started",
              description: "Your progress will be tracked as you learn.",
            });
          },
          onError: (error) => {
            toast({
              title: "Error starting module",
              description: "There was an error starting the module. Please try again.",
              variant: "destructive",
            });
          }
        }
      );
    }
  }, [moduleId, progress, isLoadingProgress]);
  
  // Handle section navigation
  const goToNextSection = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
      
      // Update progress in the database
      updateSectionProgress.mutate(
        { userId: DEFAULT_USER_ID, moduleId, sectionNumber: currentSection },
        {
          onError: (error) => {
            toast({
              title: "Error saving progress",
              description: "There was an error saving your progress. Please try again.",
              variant: "destructive",
            });
          }
        }
      );
    }
  };
  
  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };
  
  // Handle quiz completion
  const handleQuizComplete = (score: number) => {
    setQuizAttempted(true);
    setQuizScore(score);
    
    // Mark the module as completed
    completeModule.mutate(
      { userId: DEFAULT_USER_ID, moduleId, quizScore: score },
      {
        onSuccess: () => {
          toast({
            title: "Module completed!",
            description: score === 1 
              ? "Congratulations! You've successfully completed this module." 
              : "You've completed this module. Review the content and try the quiz again for a better score.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error saving progress",
            description: "There was an error saving your progress. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };
  
  // Loading state
  if (isLoadingModule || isLoadingProgress) {
    return (
      <Container>
        <div className="py-8">
          <div className="flex items-center space-x-2 mb-6">
            <Button variant="outline" size="icon" asChild>
              <Link to="/learning">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Loading module...</h1>
          </div>
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Container>
    );
  }
  
  // If module not found
  if (!moduleWithQuizzes) {
    return (
      <Container>
        <div className="py-8">
          <div className="flex items-center space-x-2 mb-6">
            <Button variant="outline" size="icon" asChild>
              <Link to="/learning">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Module not found</h1>
          </div>
          <p>Sorry, the module you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-4" asChild>
            <Link to="/learning">Return to Learning Center</Link>
          </Button>
        </div>
      </Container>
    );
  }
  
  // Show quiz if at the end of module content and has quiz
  const showQuiz = currentSection === totalSections - 1 && hasQuiz && quiz;
  
  // Determine if the module is completed
  const isCompleted = progress?.status === "completed";
  
  return (
    <Container>
      <div className="py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link to="/learning">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Badge 
              variant="outline" 
              className={`bg-${moduleWithQuizzes.category}-500 text-white`}
            >
              <span className="mr-1">
                {CategoryIcons[moduleWithQuizzes.category as LearningCategory]}
              </span> 
              {moduleWithQuizzes.category.charAt(0).toUpperCase() + moduleWithQuizzes.category.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">{moduleWithQuizzes.estimatedMinutes} min</span>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge variant={isCompleted ? "default" : "outline"}>
              {isCompleted ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
              {isCompleted ? "Completed" : progress?.status === "in_progress" ? "In Progress" : "Not Started"}
            </Badge>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{moduleWithQuizzes.title}</h1>
        <p className="text-muted-foreground mb-6">{moduleWithQuizzes.description}</p>
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-1 text-sm">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        {/* Section navigation */}
        <div className="mb-6">
          {contentSections.map((_, index) => (
            <Button
              key={index}
              variant={index === currentSection ? "default" : "outline"}
              size="sm"
              className="mr-2 mb-2"
              onClick={() => setCurrentSection(index)}
              disabled={index > (progress?.lastCompletedSection || 0) + 1 && !isCompleted}
            >
              {index + 1}
            </Button>
          ))}
          {hasQuiz && (
            <Button
              variant={showQuiz ? "default" : "outline"}
              size="sm"
              className="mb-2"
              onClick={() => setCurrentSection(totalSections - 1)}
              disabled={!isCompleted && (!progress?.lastCompletedSection || progress.lastCompletedSection < totalSections - 1)}
            >
              Quiz
            </Button>
          )}
        </div>
        
        {/* Content */}
        <div className="mb-8">
          {currentSection < contentSections.length && (
            <ContentSectionComponent section={contentSections[currentSection]} />
          )}
          
          {showQuiz && quiz && (
            <>
              {/* If the user hasn't attempted the quiz or the module isn't completed */}
              {(!quizAttempted || !isCompleted) && (
                <ModuleQuiz quiz={quiz} onComplete={handleQuizComplete} />
              )}
              
              {/* If the user has completed the module, show completion message */}
              {isCompleted && (
                <Card className="mb-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                      Module Completed!
                    </CardTitle>
                    <CardDescription>
                      You've successfully completed this module with a score of {progress?.quizScore === 1 ? "100%" : "0%"}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      {progress?.quizScore === 1 
                        ? "Great job! You've mastered this topic. Continue your learning journey with other modules." 
                        : "You've completed this module. You might want to review the content and try the quiz again for a better score."}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild>
                      <Link to="/learning">Return to Learning Center</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </>
          )}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousSection}
            disabled={currentSection === 0}
          >
            Previous Section
          </Button>
          
          {currentSection < totalSections - 1 && (
            <Button onClick={goToNextSection}>
              Next Section
            </Button>
          )}
          
          {currentSection === totalSections - 1 && !hasQuiz && !isCompleted && (
            <Button 
              onClick={() => completeModule.mutate(
                { userId: DEFAULT_USER_ID, moduleId },
                {
                  onSuccess: () => {
                    toast({
                      title: "Module completed!",
                      description: "Congratulations! You've successfully completed this module.",
                    });
                  }
                }
              )}
            >
              Complete Module
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
};

export default ModuleDetailPage;