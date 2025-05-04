import React from 'react';
import { useCryptoConcepts } from '@/contexts/CryptoConceptsContext';
import ConceptTrigger from '@/components/tutorial/ConceptTrigger';

// This component will be used to wrap the portfolio page and show crypto concepts 
const PortfolioCryptoConceptsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { hasSeenConcept } = useCryptoConcepts();
  
  // Determine which concept to show based on the user's progress
  const marketCapConcept = !hasSeenConcept('market-cap') ? 'market-cap' : null;
  const blockchainConcept = !hasSeenConcept('blockchain') ? 'blockchain' : null;
  
  return (
    <>
      {children}
      
      {/* Auto-show market cap concept on portfolio page */}
      {marketCapConcept && (
        <ConceptTrigger 
          conceptId={marketCapConcept} 
          trigger="portfolio" 
          autoShow={true} 
        />
      )}
      
      {/* Auto-show blockchain concept if market cap was already seen */}
      {!marketCapConcept && blockchainConcept && (
        <ConceptTrigger 
          conceptId={blockchainConcept} 
          trigger="portfolio" 
          autoShow={true} 
        />
      )}
    </>
  );
};

export default PortfolioCryptoConceptsProvider;