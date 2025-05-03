import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { useToast } from '@/hooks/use-toast';

// Props interface
interface OnboardingWizardProps {
  tourId: string;
  showTour: boolean;
  onComplete: () => void;
  steps: Step[];
}

// Helper to mark a tour as completed
const markTourAsCompleted = (tourId: string): void => {
  const completedTours = localStorage.getItem('completed-tours');
  let parsedTours: string[] = [];
  
  if (completedTours) {
    try {
      parsedTours = JSON.parse(completedTours);
    } catch (e) {
      console.error('Error parsing completed tours:', e);
    }
  }
  
  if (!parsedTours.includes(tourId)) {
    parsedTours.push(tourId);
    localStorage.setItem('completed-tours', JSON.stringify(parsedTours));
  }
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
  tourId, 
  showTour, 
  onComplete,
  steps 
}) => {
  const { toast } = useToast();
  const [run, setRun] = useState(showTour);
  
  // Update run state when showTour prop changes
  useEffect(() => {
    setRun(showTour);
  }, [showTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    // Tour is completed (either all steps viewed or skipped)
    if (status === 'finished' || status === 'skipped') {
      markTourAsCompleted(tourId);
      
      if (onComplete) {
        onComplete();
      }
      
      // Show toast when tour completes
      toast({
        title: "Tour completed!",
        description: "You can restart tours anytime from your settings.",
      });
    }
    
    // For debugging
    console.log('Joyride state:', {
      type,
      index,
      status,
    });
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#3b82f6', // blue-500
          // Use these colors to match your theme
          backgroundColor: 'var(--background)',
          textColor: 'var(--foreground)',
          arrowColor: 'var(--background)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
        },
        buttonBack: {
          marginRight: 10,
        },
      }}
    />
  );
};

export default OnboardingWizard;