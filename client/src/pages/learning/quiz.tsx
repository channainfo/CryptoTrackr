import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuizById } from '@/data/quizData';
import QuizQuestion from '@/components/learning/QuizQuestion';
import QuizResult from '@/components/learning/QuizResult';
import NotFound from '@/pages/not-found';

const QuizPage: React.FC = () => {
  const [match, params] = useRoute('/learning/quiz/:id');
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Get quiz data
  const quizId = params?.id;
  const quiz = quizId ? getQuizById(quizId) : undefined;
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // If quiz not found, show 404
  if (!quiz && !loading) {
    return <NotFound />;
  }
  
  const handleNextQuestion = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(score + 1);
    }
    
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };
  
  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-10">
      {!quizCompleted ? (
        <>
          <div className="mb-6 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/learning')}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{quiz!.title}</h1>
              <p className="text-sm text-muted-foreground">{quiz!.description}</p>
            </div>
          </div>
          
          <QuizQuestion
            question={quiz!.questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={quiz!.questions.length}
            onNextQuestion={handleNextQuestion}
          />
        </>
      ) : (
        <QuizResult
          quiz={quiz!}
          score={score}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};

export default QuizPage;