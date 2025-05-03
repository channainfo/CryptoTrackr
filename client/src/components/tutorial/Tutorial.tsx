import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import { useLocation } from 'wouter';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';

interface TutorialProps {}

const Tutorial = () => {
  const { showTutorial, endTutorial, markTutorialComplete, isFirstVisit } = useTutorial();
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 tutorial-welcome">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-lg mx-4 text-center shadow-2xl border border-blue-200 dark:border-blue-900">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Welcome to Trailer</h2>
              <p className="text-muted-foreground">Your personal crypto portfolio management platform</p>
            </div>
            
            <div className="mb-8 space-y-4">
              <p className="text-lg leading-relaxed">
                Track your crypto portfolio performance, manage multiple portfolios, and get detailed insights on your investments.
              </p>
              
              <ul className="flex flex-col space-y-2 text-left pl-2">
                <li className="flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Monitor your investments in real-time
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Track performance across different time periods
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Manage multiple portfolios with detailed analytics
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button onClick={() => setRun(true)} className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Start Tutorial
              </Button>
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