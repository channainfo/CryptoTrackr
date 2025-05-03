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
  const [stepIndex, setStepIndex] = useState(0);
  
  // Update run state when showTour prop changes
  useEffect(() => {
    setRun(showTour);
  }, [showTour]);

  // For debugging
  useEffect(() => {
    if (showTour) {
      console.log('OnboardingWizard: Tour is enabled with steps:', steps);
    }
  }, [showTour, steps]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;
    
    console.log('Joyride callback:', {
      status,
      type,
      index,
      action,
    });
    
    // Update the step index
    if (type === 'step:after' && action === 'next') {
      setStepIndex(index + 1);
    }
    
    // Tour is completed (either all steps viewed or skipped)
    if (['finished', 'skipped'].includes(status)) {
      // Reset step index
      setStepIndex(0);
      
      // Mark tour as completed
      markTourAsCompleted(tourId);
      
      // Stop running the tour
      setRun(false);
      
      // Call onComplete callback
      if (onComplete) {
        onComplete();
      }
      
      // Show toast when tour completes
      toast({
        title: "Tour completed!",
        description: "You can restart tours anytime from your settings.",
      });
    }
  };

  if (!steps || steps.length === 0) {
    console.warn('OnboardingWizard: No steps provided for tour:', tourId);
    return null;
  }

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={true}
      hideCloseButton={false}
      run={run}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      stepIndex={stepIndex}
      steps={steps}
      disableOverlayClose={false}
      spotlightClicks={false}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#3b82f6', // blue-500
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