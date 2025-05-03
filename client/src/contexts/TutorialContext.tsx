import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type TutorialContextType = {
  showTutorial: boolean;
  startTutorial: () => void;
  endTutorial: () => void;
  tutorialStep: number;
  setTutorialStep: (step: number) => void;
  tutorialCompleted: boolean;
  markTutorialComplete: () => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider = ({ children }: TutorialProviderProps) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  // Check if tutorial has been completed from localStorage
  useEffect(() => {
    const tutorialStatus = localStorage.getItem('tutorialCompleted');
    if (tutorialStatus === 'true') {
      setTutorialCompleted(true);
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
    localStorage.setItem('tutorialCompleted', 'true');
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
        markTutorialComplete
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