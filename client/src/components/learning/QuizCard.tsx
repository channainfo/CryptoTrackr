import React from 'react';
import { BookOpen, Clock, BarChart } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Quiz } from '@/data/quizData';

interface QuizCardProps {
  quiz: Quiz;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800/20 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800/20 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800/20 dark:text-purple-400',
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const { id, title, description, difficulty, category, questions, timeInMinutes } = quiz;
  
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge className={difficultyColors[difficulty]} variant="outline">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-3">
          <div className="flex items-center text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            <span className="capitalize">{category}</span>
            <span className="mx-2">•</span>
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{timeInMinutes} min</span>
            <span className="mx-2">•</span>
            <BarChart className="h-3.5 w-3.5 mr-1" />
            <span>{questions.length} questions</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/learning/quiz/${id}`}>
          <Button className="w-full">Start Quiz</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;