import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { useLocation } from 'wouter';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';

interface TutorialProps {
  isFirstVisit?: boolean;
}

const Tutorial = ({ isFirstVisit = false }: TutorialProps) => {
  const { showTutorial, endTutorial, markTutorialComplete } = useTutorial();
  const [location] = useLocation();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  // Update steps based on current route
  useEffect(() => {
    if (location === '/' || location === '/dashboard') {
      setSteps([
        {
          target: '.tutorial-welcome',
          content: 'Welcome to Trailer! This tutorial will show you how to use the app effectively.',
          placement: 'center',
          disableBeacon: true,
          title: 'Welcome to Trailer',
        },
        {
          target: '.tutorial-portfolios',
          content: 'Here you can select from your different portfolios or create a new one.',
          placement: 'bottom',
          disableBeacon: true,
          title: 'Portfolio Selection',
        },
        {
          target: '.tutorial-assets',
          content: 'This table shows all your crypto assets. Click on any asset to see detailed performance.',
          placement: 'top',
          disableBeacon: true,
          title: 'Your Assets',
        },
        {
          target: '.tutorial-add-crypto',
          content: 'Click here to add new crypto to your portfolio.',
          placement: 'bottom-end',
          disableBeacon: true,
          title: 'Add Crypto',
        },
        {
          target: '.tutorial-performance',
          content: 'Track your portfolio performance over time. Use the "Record Value" button to save the current value for historical tracking.',
          placement: 'top',
          disableBeacon: true,
          title: 'Performance Tracking',
        },
        {
          target: '.tutorial-transactions',
          content: 'View your recent transactions here.',
          placement: 'top',
          disableBeacon: true,
          title: 'Transactions',
        },
        {
          target: '.tutorial-market',
          content: 'Check the current market trends for popular cryptocurrencies.',
          placement: 'top',
          disableBeacon: true,
          title: 'Market Trends',
        }
      ]);
    } else if (location.startsWith('/token/')) {
      setSteps([
        {
          target: '.tutorial-token-detail',
          content: 'This page shows detailed information about a specific token in your portfolio.',
          placement: 'center',
          disableBeacon: true,
          title: 'Token Details',
        },
        {
          target: '.tutorial-token-stats',
          content: 'Here you can see key metrics about your token holdings.',
          placement: 'bottom',
          disableBeacon: true,
          title: 'Token Statistics',
        },
        {
          target: '.tutorial-token-performance',
          content: 'View how this token has performed over different time periods.',
          placement: 'top',
          disableBeacon: true,
          title: 'Token Performance',
        },
        {
          target: '.tutorial-back-button',
          content: 'Click here to return to your dashboard.',
          placement: 'bottom',
          disableBeacon: true,
          title: 'Navigation',
        }
      ]);
    }
  }, [location]);

  // Start tutorial when showTutorial is true
  useEffect(() => {
    if (showTutorial && steps.length > 0) {
      setRun(true);
    } else {
      setRun(false);
    }
  }, [showTutorial, steps]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (['finished', 'skipped'].includes(status)) {
      setRun(false);
      endTutorial();
      markTutorialComplete();
    }
  };

  // If it's not the first visit and tutorial isn't explicitly shown, don't render anything
  if (!isFirstVisit && !showTutorial) {
    return null;
  }

  return (
    <>
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
            primaryColor: '#3b82f6',
            zIndex: 10000,
          },
          buttonBack: {
            marginRight: 10
          }
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip'
        }}
      />
      
      {/* Welcome overlay for first time visitors */}
      {isFirstVisit && !run && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 tutorial-welcome">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Trailer</h2>
            <p className="mb-6">
              Track your crypto portfolio performance, manage multiple portfolios, and get detailed insights on your investments.
            </p>
            <div className="flex flex-col space-y-4">
              <Button onClick={() => setRun(true)}>Start Tutorial</Button>
              <Button variant="outline" onClick={() => {
                endTutorial();
                markTutorialComplete();
              }}>
                Skip Tutorial
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Tutorial;