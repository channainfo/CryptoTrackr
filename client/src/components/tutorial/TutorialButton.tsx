import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTutorial } from '@/contexts/TutorialContext';

const TutorialButton = () => {
  const { startTutorial, tutorialCompleted } = useTutorial();

  if (tutorialCompleted) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-full shadow-md"
                onClick={startTutorial}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Start app tutorial</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return null;
};

export default TutorialButton;