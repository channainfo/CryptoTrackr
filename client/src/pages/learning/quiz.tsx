import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuizDetails, useSubmitQuiz } from "@/hooks/use-learning";
import { ArrowLeft, CheckCircle2, XCircle, Award } from "lucide-react";

// Default user ID for demo purposes
const DEFAULT_USER_ID = "demo";

const QuizPage = ({ params }: { params: { id: string } }) => {
  const id = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Fetch quiz details
  const { data: quizData, isLoading } = useQuizDetails(id);

  // Submit quiz answer mutation
  const submitQuizMutation = useSubmitQuiz();

  const handleSubmit = () => {
    if (selectedOption === null) {
      toast({
        title: "Please select an answer",
        description: "You need to select an option before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Check if the answer is correct
    const isAnswerCorrect = selectedOption === quizData?.quiz?.correctOption;
    setIsCorrect(isAnswerCorrect);
    setIsSubmitted(true);

    // Submit answer to the server
    submitQuizMutation.mutate({
      userId: DEFAULT_USER_ID,
      quizId: id,
      isCorrect: isAnswerCorrect,
    });
  };

  const handleContinue = () => {
    if (quizData?.module) {
      // For demo user, make sure we mark the module as completed in localStorage
      if (DEFAULT_USER_ID === "demo") {
        const savedProgressStr = localStorage.getItem("demo-learning-progress");
        let savedProgress = [];

        if (savedProgressStr) {
          try {
            savedProgress = JSON.parse(savedProgressStr);
          } catch (e) {
            console.error("Error parsing progress:", e);
          }
        }

        const moduleId = quizData.module.id;
        const existingProgress = savedProgress.find(
          (p: any) => p.moduleId === moduleId,
        );

        if (existingProgress) {
          existingProgress.status = "completed";
          existingProgress.lastCompletedSection = 10; // High number to indicate completion
          existingProgress.updatedAt = new Date().toISOString();
          existingProgress.completedAt = new Date().toISOString();
        } else {
          savedProgress.push({
            id: `demo-${moduleId}`,
            userId: DEFAULT_USER_ID,
            moduleId,
            status: "completed",
            lastCompletedSection: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          });
        }

        localStorage.setItem(
          "demo-learning-progress",
          JSON.stringify(savedProgress),
        );
      }

      setLocation(`/learning`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div>
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData?.quiz || !quizData?.module) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div>
          <Alert variant="destructive">
            <AlertTitle>Quiz Not Found</AlertTitle>
            <AlertDescription>
              The quiz you're looking for couldn't be found.
              <Button asChild variant="link" className="p-0 ml-2">
                <Link to="/learning">Return to Learning Center</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const { quiz, module } = quizData;
  const options = quiz.options as string[];

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to={`/learning/module/${module.id}`}>
            <ArrowLeft className="mr-1 w-4 h-4" /> Back to Module
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">{module.title} Quiz</h1>
        <p className="text-muted-foreground mb-6">
          Test your knowledge about what you've learned
        </p>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Question {quiz.order}</CardTitle>
            <CardDescription className="text-lg font-medium text-foreground mt-2">
              {quiz.question}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <RadioGroup
              value={selectedOption?.toString()}
              onValueChange={(value) => setSelectedOption(parseInt(value))}
              disabled={isSubmitted}
              className="space-y-3"
            >
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`
                  flex items-center space-x-2 rounded-md border p-3
                  ${isSubmitted && index === quiz.correctOption ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : ""}
                  ${isSubmitted && selectedOption === index && index !== quiz.correctOption ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" : ""}
                `}
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-grow cursor-pointer py-1"
                  >
                    {option}
                  </Label>
                  {isSubmitted && index === quiz.correctOption && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {isSubmitted &&
                    selectedOption === index &&
                    index !== quiz.correctOption && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                </div>
              ))}
            </RadioGroup>

            {isSubmitted && (
              <Alert
                className={`mt-4 ${isCorrect ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"}`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <Award className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertTitle className="text-amber-500">
                      Incorrect Answer
                    </AlertTitle>
                  )}
                  <div>
                    {isCorrect ? (
                      <AlertTitle className="text-green-500">
                        Correct!
                      </AlertTitle>
                    ) : (
                      <AlertTitle className="text-amber-500">
                        Incorrect Answer
                      </AlertTitle>
                    )}
                    <AlertDescription className="mt-1">
                      {quiz.explanation}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            {!isSubmitted ? (
              <Button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="w-full"
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleContinue} className="w-full">
                Continue
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default QuizPage;
