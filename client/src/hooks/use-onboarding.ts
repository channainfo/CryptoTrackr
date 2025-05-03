import { useState, useCallback } from 'react';

// Define tour types
export type TourType = 'dashboard' | 'portfolio' | 'learning' | 'transactions' | 'markets' | 'alerts';

export interface OnboardingOptions {
  isEnabled?: boolean;
  forceStart?: boolean;
}

export function useOnboarding(tourId: TourType, options: OnboardingOptions = {}) {
  const { isEnabled = true, forceStart = false } = options;
  
  // Check if this tour was already completed
  const wasCompleted = (): boolean => {
    try {
      const completedTours = localStorage.getItem('completed-tours');
      if (!completedTours) return false;
      const parsedTours = JSON.parse(completedTours) as string[];
      return parsedTours.includes(tourId);
    } catch (e) {
      console.error('Error checking tour completion:', e);
      return false;
    }
  };
  
  // Initialize showTour based on forceStart or whether it has been completed
  const [showTour, setShowTour] = useState(forceStart || (isEnabled && !wasCompleted()));
  
  // Check if this tour has already been completed
  const hasTourBeenCompleted = useCallback((): boolean => {
    const completedTours = localStorage.getItem('completed-tours');
    if (!completedTours) return false;
    
    try {
      const parsedTours = JSON.parse(completedTours) as string[];
      return parsedTours.includes(tourId);
    } catch (e) {
      console.error('Error parsing completed tours:', e);
      return false;
    }
  }, [tourId]);
  
  // Reset the tour to be shown again (remove from completed list)
  const resetTour = useCallback(() => {
    const completedTours = localStorage.getItem('completed-tours');
    if (!completedTours) return;
    
    try {
      const parsedTours = JSON.parse(completedTours) as string[];
      const updatedTours = parsedTours.filter(t => t !== tourId);
      localStorage.setItem('completed-tours', JSON.stringify(updatedTours));
      
      // Set to show the tour
      setShowTour(true);
    } catch (e) {
      console.error('Error parsing completed tours:', e);
    }
  }, [tourId]);
  
  // Start the tour manually
  const startTour = useCallback(() => {
    setShowTour(true);
  }, []);
  
  // Stop the tour manually
  const stopTour = useCallback(() => {
    setShowTour(false);
  }, []);
  
  // Handler for when tour completes
  const handleTourComplete = useCallback(() => {
    setShowTour(false);
  }, []);
  
  // Check if all onboarding tours have been completed
  const hasCompletedAllTours = useCallback((): boolean => {
    const allTourTypes: TourType[] = [
      'dashboard', 
      'portfolio', 
      'learning', 
      'transactions', 
      'markets', 
      'alerts'
    ];
    
    const completedTours = localStorage.getItem('completed-tours');
    if (!completedTours) return false;
    
    try {
      const parsedTours = JSON.parse(completedTours) as string[];
      return allTourTypes.every(tour => parsedTours.includes(tour));
    } catch (e) {
      console.error('Error parsing completed tours:', e);
      return false;
    }
  }, []);
  
  // Reset all tours
  const resetAllTours = useCallback(() => {
    localStorage.removeItem('completed-tours');
  }, []);
  
  return {
    tourId,
    showTour,
    isEnabled,
    hasTourBeenCompleted: hasTourBeenCompleted(),
    hasCompletedAllTours: hasCompletedAllTours(),
    startTour,
    stopTour,
    resetTour,
    resetAllTours,
    handleTourComplete
  };
}