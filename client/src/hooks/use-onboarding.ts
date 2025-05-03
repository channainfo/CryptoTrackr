import { useState, useCallback, useEffect } from 'react';
import { TourType } from '@/components/onboarding/OnboardingWizard';

export interface OnboardingOptions {
  isEnabled?: boolean;
  forceStart?: boolean;
}

export function useOnboarding(tourType: TourType, options: OnboardingOptions = {}) {
  const { isEnabled = true, forceStart = false } = options;
  const [showTour, setShowTour] = useState(forceStart);
  
  // Check if this tour has already been completed
  const hasTourBeenCompleted = useCallback((): boolean => {
    const completedTours = localStorage.getItem('completed-tours');
    if (!completedTours) return false;
    
    try {
      const parsedTours = JSON.parse(completedTours) as string[];
      return parsedTours.includes(tourType);
    } catch (e) {
      console.error('Error parsing completed tours:', e);
      return false;
    }
  }, [tourType]);
  
  // Reset the tour to be shown again (remove from completed list)
  const resetTour = useCallback(() => {
    const completedTours = localStorage.getItem('completed-tours');
    if (!completedTours) return;
    
    try {
      const parsedTours = JSON.parse(completedTours) as string[];
      const updatedTours = parsedTours.filter(t => t !== tourType);
      localStorage.setItem('completed-tours', JSON.stringify(updatedTours));
      
      // Set to show the tour
      setShowTour(true);
    } catch (e) {
      console.error('Error parsing completed tours:', e);
    }
  }, [tourType]);
  
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
    tourType,
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