import React from 'react';
import { useCryptoConcepts } from '@/contexts/CryptoConceptsContext';
import ConceptTrigger from '@/components/tutorial/ConceptTrigger';

// This component will be used to wrap the token detail page and show relevant crypto concepts 
const TokenCryptoConceptsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { hasSeenConcept } = useCryptoConcepts();
  
  // Determine which concept to show based on the user's progress
  const stakingConcept = !hasSeenConcept('staking') ? 'staking' : null;
  const decentralizationConcept = !hasSeenConcept('decentralization') ? 'decentralization' : null;
  
  return (
    <>
      {children}
      
      {/* Auto-show staking concept on token detail page */}
      {stakingConcept && (
        <ConceptTrigger 
          conceptId={stakingConcept} 
          trigger="token-detail" 
          autoShow={true} 
        />
      )}
      
      {/* Auto-show decentralization concept if staking was already seen */}
      {!stakingConcept && decentralizationConcept && (
        <ConceptTrigger 
          conceptId={decentralizationConcept} 
          trigger="token-detail" 
          autoShow={true} 
        />
      )}
    </>
  );
};

export default TokenCryptoConceptsProvider;