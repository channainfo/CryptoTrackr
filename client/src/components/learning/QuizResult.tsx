import React from 'react';
import { Link } from 'wouter';
import { Award, Trophy, Star, RotateCcw, Home, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Quiz } from '@/data/quizData';

interface QuizResultProps {
  quiz: Quiz;
  score: number;
  onRetry: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({ quiz, score, onRetry }) => {
  // Calculate percentage score
  const percentage = Math.round((score / quiz.questions.length) * 100);
  
  // Determine message based on score
  const getMessage = () => {
    if (percentage >= 90) return 'Excellent! You're a crypto expert!';
    if (percentage >= 70) return 'Great job! You have solid knowledge!';
    if (percentage >= 50) return 'Good effort! Keep learning!';
    return 'Keep studying! You'll improve with practice.';
  };
  
  // Determine badge based on score
  const getBadge = () => {
    if (percentage >= 90) return <Trophy className="h-16 w-16 text-yellow-500" />;
    if (percentage >= 70) return <Award className="h-16 w-16 text-blue-500" />;
    if (percentage >= 50) return <Star className="h-16 w-16 text-green-500" />;
    return <Star className="h-16 w-16 text-gray-400" />;
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Quiz Results</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          {getBadge()}
          <h3 className="text-xl font-bold">{getMessage()}</h3>
          <p className="text-muted-foreground">
            You scored {score} out of {quiz.questions.length} questions correctly.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Your Score</span>
            <span className="text-sm font-medium">{percentage}%</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2.5" 
            indicatorClassName={
              percentage >= 90 ? "bg-yellow-500" :
              percentage >= 70 ? "bg-blue-500" :
              percentage >= 50 ? "bg-green-500" : "bg-red-500"
            }
          />
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Keep Learning</h4>
          <p className="text-sm text-muted-foreground">
            Continue exploring our learning materials to improve your knowledge about cryptocurrencies and blockchain technology.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-initial" onClick={onRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry Quiz
          </Button>
          <Link href="/learning" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Quizzes
            </Button>
          </Link>
        </div>
        <Link href="/" className="w-full sm:w-auto">
          <Button className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default QuizResult;