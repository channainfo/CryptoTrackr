import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type TutorialContextType = {
  showTutorial: boolean;
  startTutorial: () => void;
  endTutorial: () => void;
  tutorialStep: number;
  setTutorialStep: (step: number) => void;
  tutorialCompleted: boolean;
  markTutorialComplete: () => void;
  isFirstVisit: boolean;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider = ({ children }: TutorialProviderProps) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Check if tutorial has been completed from localStorage and if this is first visit
  useEffect(() => {
    // Check tutorial completion status
    const tutorialStatus = localStorage.getItem('tutorialCompleted');
    if (tutorialStatus === 'true') {
      setTutorialCompleted(true);
    }
    
    // Check if this is the first visit
    const firstVisitStatus = localStorage.getItem('firstVisitCompleted');
    if (firstVisitStatus === 'true') {
      setIsFirstVisit(false);
    } else {
      // Auto start tutorial for first-time visitors
      setShowTutorial(true);
    }
  }, []);

  const startTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(0);
  };

  const endTutorial = () => {
    setShowTutorial(false);
  };

  const markTutorialComplete = () => {
    setTutorialCompleted(true);
    setIsFirstVisit(false);
    localStorage.setItem('tutorialCompleted', 'true');
    localStorage.setItem('firstVisitCompleted', 'true');
  };

  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        startTutorial,
        endTutorial,
        tutorialStep,
        setTutorialStep,
        tutorialCompleted,
        markTutorialComplete,
        isFirstVisit
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};