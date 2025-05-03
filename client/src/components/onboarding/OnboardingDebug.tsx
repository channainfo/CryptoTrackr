import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

interface OnboardingDebugProps {
  tourId: string;
  showTour: boolean;
  onStartTour: () => void;
  onResetTour: () => void;
}

const OnboardingDebug: React.FC<OnboardingDebugProps> = ({
  tourId,
  showTour,
  onStartTour,
  onResetTour
}) => {
  const { toast } = useToast();
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  
  useEffect(() => {
    // Load completed tours from localStorage
    const loadCompletedTours = () => {
      try {
        const storedTours = localStorage.getItem('completed-tours');
        if (storedTours) {
          setCompletedTours(JSON.parse(storedTours));
        }
      } catch (e) {
        console.error('Error loading completed tours:', e);
      }
    };
    
    loadCompletedTours();
    
    // Set up an interval to refresh the completed tours
    const interval = setInterval(loadCompletedTours, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleClearAllTours = () => {
    localStorage.removeItem('completed-tours');
    setCompletedTours([]);
    
    toast({
      title: "All tours reset",
      description: "You can now restart all onboarding tours.",
    });
  };
  
  const handleForceComplete = () => {
    // Add this tour to completed tours
    const newCompletedTours = [...completedTours];
    if (!newCompletedTours.includes(tourId)) {
      newCompletedTours.push(tourId);
      localStorage.setItem('completed-tours', JSON.stringify(newCompletedTours));
      setCompletedTours(newCompletedTours);
      
      toast({
        title: "Tour marked as completed",
        description: `The ${tourId} tour has been marked as completed.`,
      });
    }
  };
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg opacity-70 hover:opacity-100 transition-opacity">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Onboarding Debug</CardTitle>
        <CardDescription className="text-xs">
          Tour ID: {tourId} | Active: {showTour ? 'Yes' : 'No'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-xs">
          <div className="font-semibold mb-1">Completed Tours:</div>
          {completedTours.length === 0 ? (
            <div className="text-gray-500">No tours completed</div>
          ) : (
            <ul className="list-disc pl-4">
              {completedTours.map(tour => (
                <li key={tour} className={tour === tourId ? 'font-semibold' : ''}>
                  {tour}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button size="sm" variant="outline" onClick={onStartTour}>
          Start Tour
        </Button>
        <Button size="sm" variant="outline" onClick={onResetTour}>
          Reset Tour
        </Button>
        <Button size="sm" variant="outline" onClick={handleClearAllTours}>
          Reset All
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OnboardingDebug;