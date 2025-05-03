import React, { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

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
  const { theme, resolvedTheme } = useTheme();
  const [run, setRun] = useState(showTour);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  
  // Update run state when showTour prop changes
  useEffect(() => {
    setRun(showTour);
  }, [showTour]);
  
  // Function to check if dark mode is enabled
  const checkDarkMode = useCallback(() => {
    // Multiple ways to detect dark mode
    const isDark = resolvedTheme === 'dark' || 
                  theme === 'dark' || 
                  document.documentElement.classList.contains('dark') ||
                  window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setCurrentTheme(isDark ? 'dark' : 'light');
    console.log('OnboardingWizard: Theme detection -', { 
      theme, 
      resolvedTheme, 
      isDark,
      systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      hasDocDarkClass: document.documentElement.classList.contains('dark')
    });
    
    return isDark;
  }, [theme, resolvedTheme]);

  // Track theme changes from next-themes
  useEffect(() => {
    checkDarkMode();
  }, [theme, resolvedTheme, checkDarkMode]);
  
  // Also observe DOM changes to catch other theme changes
  useEffect(() => {
    // Set up a mutation observer to detect class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up
    return () => observer.disconnect();
  }, [checkDarkMode]);

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

  // Use our tracked theme state for styling
  const isDarkTheme = currentTheme === 'dark';
  
  // Debug current theme
  console.log('OnboardingWizard: Using theme for rendering:', currentTheme);
  
  return (
    <Joyride
      key={`joyride-${currentTheme}-${tourId}`} // Force re-render on theme change
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
          zIndex: 99999, // Ensure extremely high z-index to appear above all elements
          primaryColor: '#3b82f6', // blue-500
          // Theme-specific colors
          backgroundColor: isDarkTheme ? '#1e1e1e' : '#ffffff', // Dark gray in dark mode, white in light mode
          textColor: isDarkTheme ? '#f1f5f9' : '#333333', // Light text in dark mode, dark text in light mode
          arrowColor: isDarkTheme ? '#1e1e1e' : '#ffffff', // Match tooltip background
          overlayColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
        },
        tooltipContainer: {
          textAlign: 'left',
          boxShadow: 'none', // Remove the box-shadow entirely
        },
        buttonNext: {
          backgroundColor: '#3b82f6', // Always blue
          color: 'white',
        },
        buttonBack: {
          marginRight: 10,
          color: isDarkTheme ? '#f1f5f9' : '#333333',
        },
        buttonSkip: {
          color: isDarkTheme ? '#f1f5f9' : '#333333',
        },
        tooltip: {
          fontSize: '14px',
          padding: '15px',
          borderRadius: '6px',
          boxShadow: 'none', // Explicitly remove any box shadow
          filter: 'none', // Remove any filter that might create shadows
          border: isDarkTheme ? '1px solid #3f3f46' : '1px solid #e5e7eb', // Add a subtle border instead of shadow
        },
        tooltipContent: {
          padding: '5px 0',
          color: isDarkTheme ? '#f1f5f9' : '#333333',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: 'bold',
          color: isDarkTheme ? 'white' : '#111827',
        },
        beacon: {
          animation: 'pulse',
          background: '#3b82f6', // Always blue
        },
      }}
    />
  );
};

export default OnboardingWizard;