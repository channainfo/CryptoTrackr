import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

// Define different tour types for different pages
export type TourType = 'dashboard' | 'portfolio' | 'learning' | 'transactions' | 'markets' | 'alerts';

// Props interface
interface OnboardingWizardProps {
  tourType: TourType;
  isEnabled?: boolean;
  onComplete?: () => void;
}

// Helper to get tour steps based on tour type
const getTourSteps = (tourType: TourType): Step[] => {
  switch (tourType) {
    case 'dashboard':
      return [
        {
          target: '.dashboard-overview',
          content: 'This is your main dashboard where you can see an overview of your cryptocurrency portfolio performance.',
          disableBeacon: true,
          placement: 'bottom',
        },
        {
          target: '.portfolio-selector',
          content: 'Switch between your different portfolios using this selector.',
          placement: 'bottom',
        },
        {
          target: '.portfolio-summary',
          content: 'View your portfolio summary including total value and 24-hour performance.',
          placement: 'left',
        },
        {
          target: '.asset-allocation',
          content: 'This chart shows your asset allocation across different cryptocurrencies.',
          placement: 'top',
        },
        {
          target: '.market-sentiment',
          content: 'The market sentiment indicator shows the overall market mood to help with your investment decisions.',
          placement: 'left',
        },
        {
          target: '.quick-actions',
          content: 'Use these quick actions to add crypto, record values, and manage your portfolio.',
          placement: 'top',
        },
      ];
    
    case 'portfolio':
      return [
        {
          target: '.portfolio-tabs',
          content: 'Navigate between different views of your portfolio.',
          disableBeacon: true,
          placement: 'bottom',
        },
        {
          target: '.portfolio-chart',
          content: 'This chart shows your portfolio performance over time.',
          placement: 'bottom',
        },
        {
          target: '.portfolio-assets',
          content: 'View all cryptocurrencies in your portfolio, including current value and performance.',
          placement: 'top',
        },
        {
          target: '.add-asset-button',
          content: 'Click here to add new cryptocurrencies to your portfolio.',
          placement: 'left',
        },
      ];
    
    case 'learning':
      return [
        {
          target: '.learning-stats',
          content: 'Track your progress through our educational modules.',
          disableBeacon: true,
          placement: 'left',
        },
        {
          target: '.learning-path',
          content: 'Follow this guided path to learn about cryptocurrencies from beginner to advanced topics.',
          placement: 'bottom',
        },
        {
          target: '.recommended-module',
          content: 'Based on your progress, here\'s the next recommended module for you to complete.',
          placement: 'left',
        },
        {
          target: '.achievement-grid',
          content: 'Earn achievements as you complete modules and quizzes.',
          placement: 'top',
        },
        {
          target: '.tabs-wrapper',
          content: 'Browse modules by category using these tabs. You can scroll horizontally to see all categories.',
          placement: 'top',
        },
      ];
    
    case 'transactions':
      return [
        {
          target: '.transaction-filters',
          content: 'Filter your transaction history by type, date, or cryptocurrency.',
          disableBeacon: true,
          placement: 'bottom',
        },
        {
          target: '.add-transaction-button',
          content: 'Record a new buy or sell transaction.',
          placement: 'left',
        },
        {
          target: '.transaction-list',
          content: 'Review all your recorded transactions here.',
          placement: 'top',
        },
      ];
    
    case 'markets':
      return [
        {
          target: '.market-overview',
          content: 'Get a quick overview of the cryptocurrency market.',
          disableBeacon: true,
          placement: 'bottom',
        },
        {
          target: '.top-gainers',
          content: 'See the best performing cryptocurrencies in the last 24 hours.',
          placement: 'bottom',
        },
        {
          target: '.top-losers',
          content: 'Check the worst performing cryptocurrencies in the last 24 hours.',
          placement: 'bottom',
        },
        {
          target: '.market-table',
          content: 'Browse detailed information about all available cryptocurrencies.',
          placement: 'top',
        },
        {
          target: '.search-crypto',
          content: 'Looking for a specific cryptocurrency? Use the search feature.',
          placement: 'bottom',
        },
      ];
    
    case 'alerts':
      return [
        {
          target: '.alerts-overview',
          content: 'Set up price alerts to get notified when cryptocurrencies reach specific prices.',
          disableBeacon: true,
          placement: 'bottom',
        },
        {
          target: '.create-alert-button',
          content: 'Click here to create a new price alert.',
          placement: 'left',
        },
        {
          target: '.active-alerts',
          content: 'View and manage your currently active alerts.',
          placement: 'top',
        },
        {
          target: '.alert-history',
          content: 'See a history of your triggered alerts.',
          placement: 'top',
        },
      ];
    
    default:
      return [];
  }
};

// Check if user already completed a tour
const hasTourBeenCompleted = (tourType: TourType): boolean => {
  const completedTours = localStorage.getItem('completed-tours');
  if (!completedTours) return false;
  
  try {
    const parsedTours = JSON.parse(completedTours) as string[];
    return parsedTours.includes(tourType);
  } catch (e) {
    console.error('Error parsing completed tours:', e);
    return false;
  }
};

// Mark a tour as completed
const markTourAsCompleted = (tourType: TourType): void => {
  const completedTours = localStorage.getItem('completed-tours');
  let parsedTours: string[] = [];
  
  if (completedTours) {
    try {
      parsedTours = JSON.parse(completedTours);
    } catch (e) {
      console.error('Error parsing completed tours:', e);
    }
  }
  
  if (!parsedTours.includes(tourType)) {
    parsedTours.push(tourType);
    localStorage.setItem('completed-tours', JSON.stringify(parsedTours));
  }
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
  tourType, 
  isEnabled = true, 
  onComplete 
}) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [location] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get steps for the specified tour type
    const tourSteps = getTourSteps(tourType);
    setSteps(tourSteps);
    
    // Check if we should show the tour
    const hasCompleted = hasTourBeenCompleted(tourType);
    
    // Only run the tour if it's enabled, not completed, and we have steps
    setRun(isEnabled && !hasCompleted && tourSteps.length > 0);
  }, [tourType, isEnabled]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    // Tour is completed (either all steps viewed or skipped)
    if (status === 'finished' || status === 'skipped') {
      setRun(false);
      markTourAsCompleted(tourType);
      
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