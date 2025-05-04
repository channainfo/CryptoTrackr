import React, { useEffect } from 'react';
import { useCryptoConcepts } from '@/contexts/CryptoConceptsContext';
import ConceptTrigger from '@/components/tutorial/ConceptTrigger';

// This component will be used to wrap the dashboard and show crypto concepts to first-time users
const DashboardCryptoConceptsProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { hasSeenConcept } = useCryptoConcepts();
  
  // Determine which concept to show based on the user's progress
  const walletConcept = !hasSeenConcept('wallet') ? 'wallet' : null;
  const volatilityConcept = !hasSeenConcept('volatility') ? 'volatility' : null;
  
  return (
    <>
      {children}
      
      {/* Auto-show wallet concept on dashboard */}
      {walletConcept && (
        <ConceptTrigger 
          conceptId={walletConcept} 
          trigger="dashboard" 
          autoShow={true} 
        />
      )}
      
      {/* Auto-show volatility concept if wallet was already seen */}
      {!walletConcept && volatilityConcept && (
        <ConceptTrigger 
          conceptId={volatilityConcept} 
          trigger="dashboard" 
          autoShow={true} 
        />
      )}
    </>
  );
};

export default DashboardCryptoConceptsProvider;