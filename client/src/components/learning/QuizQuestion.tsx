import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, Copy } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { QuizQuestion as QuizQuestionType } from '@/data/quizData';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onNextQuestion: (isCorrect: boolean) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onNextQuestion
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  const handleSubmit = () => {
    if (selectedOption === null) return;
    setHasAnswered(true);
  };
  
  const handleNext = () => {
    onNextQuestion(selectedOption === question.correctAnswer);
    setSelectedOption(null);
    setHasAnswered(false);
    setCopiedToClipboard(false);
  };
  
  const copyExplanationToClipboard = () => {
    navigator.clipboard.writeText(question.explanation);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };
  
  const progress = (questionNumber / totalQuestions) * 100;
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <CardTitle>Question {questionNumber} of {totalQuestions}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-lg font-medium mb-6">{question.question}</div>
        
        <RadioGroup value={selectedOption?.toString()} onValueChange={(value) => !hasAnswered && setSelectedOption(parseInt(value))}>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-3 rounded-lg border ${
                  hasAnswered
                    ? index === question.correctAnswer
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : selectedOption === index
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <RadioGroupItem 
                  value={index.toString()} 
                  id={`option-${index}`} 
                  disabled={hasAnswered}
                  className="border-primary"
                />
                <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                  {option}
                </Label>
                {hasAnswered && (
                  index === question.correctAnswer 
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" /> 
                    : selectedOption === index 
                      ? <XCircle className="h-5 w-5 text-red-500" />
                      : null
                )}
              </div>
            ))}
          </div>
        </RadioGroup>
        
        {hasAnswered && (
          <Alert className={`mt-4 ${
            selectedOption === question.correctAnswer 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                {selectedOption === question.correctAnswer 
                  ? <CheckCircle2 className="h-5 w-5 text-green-500" /> 
                  : <XCircle className="h-5 w-5 text-red-500" />}
              </div>
              <div className="flex-1">
                <AlertDescription>
                  <p className="font-medium mb-1">
                    {selectedOption === question.correctAnswer 
                      ? 'Correct!' 
                      : 'Incorrect!'}
                  </p>
                  <p className="text-sm">{question.explanation}</p>
                </AlertDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={copyExplanationToClipboard}
                title="Copy explanation to clipboard"
              >
                {copiedToClipboard ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="justify-between">
        {!hasAnswered ? (
          <div className="w-full flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={selectedOption === null}
            >
              Check Answer
            </Button>
          </div>
        ) : (
          <div className="w-full flex justify-end">
            <Button onClick={handleNext}>
              Next Question
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizQuestion;