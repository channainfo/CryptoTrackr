import React, { useEffect } from 'react';
import { useCryptoConcepts } from '@/contexts/CryptoConceptsContext';
import CryptoConceptPopup from './CryptoConceptPopup';

interface ConceptTriggerProps {
  conceptId: string;
  trigger?: string; // Optional specific trigger to match
  children?: React.ReactNode;
  autoShow?: boolean; // Whether to show the concept automatically when the component mounts
}

const ConceptTrigger: React.FC<ConceptTriggerProps> = ({
  conceptId,
  trigger,
  children,
  autoShow = false
}) => {
  const {
    concepts,
    showConcept,
    hideConcept,
    currentConcept,
    isConceptVisible,
    markConceptSeen,
    hasSeenConcept
  } = useCryptoConcepts();

  // Find the concept
  const concept = concepts.find(c => c.id === conceptId);

  // Show the concept when component mounts if autoShow is true and concept hasn't been seen
  useEffect(() => {
    if (autoShow && concept && !hasSeenConcept(conceptId)) {
      // Small delay to not show immediately on page load
      const timer = setTimeout(() => {
        showConcept(conceptId);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoShow, concept, conceptId, hasSeenConcept, showConcept]);

  // Check if the trigger matches any of the concept's triggers
  const shouldTrigger = concept?.triggers.includes(trigger || '') || !trigger;

  const handleClick = () => {
    if (concept && shouldTrigger && !hasSeenConcept(conceptId)) {
      showConcept(conceptId);
    }
  };

  const handleClose = () => {
    hideConcept();
    if (concept) {
      markConceptSeen(concept.id);
    }
  };

  // If this component is wrapping children, add onClick handler
  if (children) {
    return (
      <>
        <div onClick={handleClick}>
          {children}
        </div>
        
        {concept && isConceptVisible && currentConcept?.id === conceptId && (
          <CryptoConceptPopup
            id={concept.id}
            title={concept.title}
            description={concept.description}
            icon={concept.icon}
            isOpen={isConceptVisible}
            onClose={handleClose}
          />
        )}
      </>
    );
  }

  // If no children, just render the popup when triggered
  return (
    <>
      {concept && isConceptVisible && currentConcept?.id === conceptId && (
        <CryptoConceptPopup
          id={concept.id}
          title={concept.title}
          description={concept.description}
          icon={concept.icon}
          isOpen={isConceptVisible}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default ConceptTrigger;