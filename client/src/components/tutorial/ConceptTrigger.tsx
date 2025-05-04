import React, { useEffect } from 'react';
import { useCryptoConcepts } from '@/contexts/CryptoConceptsContext';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface ConceptTriggerProps {
  conceptId: string;
  trigger?: 'dashboard' | 'portfolio' | 'token-detail' | 'market' | string;
  autoShow?: boolean;
  children?: React.ReactNode;
  showIcon?: boolean;
  label?: string;
}

/**
 * Component that triggers a crypto concept popup
 * Can be used in three ways:
 * 1. As a trigger button with a label
 * 2. As a wrapper around existing content
 * 3. With autoShow=true to automatically show concepts on page load (for first-time users)
 */
const ConceptTrigger: React.FC<ConceptTriggerProps> = ({
  conceptId,
  trigger,
  autoShow = false,
  children,
  showIcon = true,
  label
}) => {
  const { showConcept, hasSeenConcept } = useCryptoConcepts();
  
  // Auto-show the concept when component mounts if autoShow is true
  // and the user hasn't seen it before
  useEffect(() => {
    if (autoShow && !hasSeenConcept(conceptId)) {
      // Add a small delay so the page loads first
      const timer = setTimeout(() => {
        showConcept(conceptId);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoShow, conceptId, hasSeenConcept, showConcept]);
  
  // If used as a wrapper component
  if (children) {
    return (
      <div 
        className="inline-block cursor-help" 
        onClick={() => showConcept(conceptId)}
      >
        {children}
        {showIcon && (
          <HelpCircle 
            className="inline ml-1 text-blue-500 dark:text-blue-400 h-4 w-4" 
          />
        )}
      </div>
    );
  }
  
  // If used as a standalone button/link
  return (
    <Button
      variant="link"
      className="text-blue-500 dark:text-blue-400 p-0 h-auto"
      onClick={() => {
        console.log("ConceptTrigger clicked, showing concept:", conceptId);
        showConcept(conceptId);
      }}
    >
      {label || conceptId}
      {showIcon && <HelpCircle className="ml-1 h-4 w-4" />}
    </Button>
  );
};

export default ConceptTrigger;