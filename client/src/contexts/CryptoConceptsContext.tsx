import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the types for our context
type ConceptId = string;

interface CryptoConceptsContextType {
  hasSeenConcept: (conceptId: ConceptId) => boolean;
  markConceptAsSeen: (conceptId: ConceptId) => void;
  showConcept: (conceptId: ConceptId) => void;
  currentConcept: ConceptId | null;
  closeConcept: () => void;
}

// Create the context with a default value
const CryptoConceptsContext = createContext<CryptoConceptsContextType | undefined>(undefined);

// Storage key for seen concepts in localStorage
const STORAGE_KEY = 'crypto-concepts-seen';

interface CryptoConceptsProviderProps {
  children: React.ReactNode;
}

export const CryptoConceptsProvider: React.FC<CryptoConceptsProviderProps> = ({ children }) => {
  // Track which concepts the user has seen
  const [seenConcepts, setSeenConcepts] = useState<Set<ConceptId>>(new Set());
  // Track the currently displayed concept (if any)
  const [currentConcept, setCurrentConcept] = useState<ConceptId | null>(null);

  // Load seen concepts from localStorage on mount
  useEffect(() => {
    try {
      const storedConcepts = localStorage.getItem(STORAGE_KEY);
      if (storedConcepts) {
        setSeenConcepts(new Set(JSON.parse(storedConcepts)));
      }
    } catch (error) {
      console.error('Failed to load seen concepts from localStorage', error);
    }
  }, []);

  // Save seen concepts to localStorage whenever they change
  useEffect(() => {
    if (seenConcepts.size > 0) {
      try {
        const conceptsArray = Array.from(seenConcepts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conceptsArray));
      } catch (error) {
        console.error('Failed to save seen concepts to localStorage', error);
      }
    }
  }, [seenConcepts]);

  // Check if a concept has been seen
  const hasSeenConcept = (conceptId: ConceptId): boolean => {
    return seenConcepts.has(conceptId);
  };

  // Mark a concept as seen
  const markConceptAsSeen = (conceptId: ConceptId): void => {
    setSeenConcepts(prev => {
      const updated = new Set(prev);
      updated.add(conceptId);
      return updated;
    });
    
    // If this is the current concept, close it
    if (currentConcept === conceptId) {
      setCurrentConcept(null);
    }
  };

  // Show a specific concept
  const showConcept = (conceptId: ConceptId): void => {
    console.log("CryptoConceptsContext: Setting current concept to:", conceptId);
    setCurrentConcept(conceptId);
  };

  // Close the current concept
  const closeConcept = (): void => {
    setCurrentConcept(null);
  };

  // Create the context value
  const contextValue: CryptoConceptsContextType = {
    hasSeenConcept,
    markConceptAsSeen,
    showConcept,
    currentConcept,
    closeConcept
  };

  return (
    <CryptoConceptsContext.Provider value={contextValue}>
      {children}
    </CryptoConceptsContext.Provider>
  );
};

// Custom hook to use the crypto concepts context
export const useCryptoConcepts = (): CryptoConceptsContextType => {
  const context = useContext(CryptoConceptsContext);
  
  if (context === undefined) {
    throw new Error('useCryptoConcepts must be used within a CryptoConceptsProvider');
  }
  
  return context;
};