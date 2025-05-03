import React from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TutorialButton = () => {
  const { startTutorial } = useTutorial();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={startTutorial}
            className="fixed bottom-5 right-5 z-50 bg-primary text-white hover:bg-primary/90 shadow-lg rounded-full h-12 w-12"
          >
            <HelpCircle className="h-6 w-6" />
            <span className="sr-only">Start Tutorial</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Start Tutorial</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TutorialButton;