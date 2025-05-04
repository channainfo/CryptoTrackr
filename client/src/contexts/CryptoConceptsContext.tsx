import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bitcoin, Wallet, BarChart2, ArrowRight, LineChart, AlertTriangle } from 'lucide-react';

// Define types for crypto concepts
export interface CryptoConcept {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  triggers: string[]; // Which parts of the app should trigger this concept popup
}

interface CryptoConceptsContextType {
  concepts: CryptoConcept[];
  showConcept: (conceptId: string) => void;
  hideConcept: () => void;
  currentConcept: CryptoConcept | null;
  isConceptVisible: boolean;
  markConceptSeen: (conceptId: string) => void;
  hasSeenConcept: (conceptId: string) => boolean;
}

const CryptoConceptsContext = createContext<CryptoConceptsContextType | undefined>(undefined);

// Define the crypto concepts data
const cryptoConcepts: CryptoConcept[] = [
  {
    id: 'market-cap',
    title: 'Market Capitalization',
    description: 'Market capitalization is the total value of a cryptocurrency. It\'s calculated by multiplying the total number of coins in circulation by the current price of a single coin. Higher market cap typically indicates a more established cryptocurrency.',
    icon: <LineChart className="h-5 w-5" />,
    triggers: ['market-trends', 'token-detail']
  },
  {
    id: 'decentralization',
    title: 'Decentralization',
    description: 'Decentralization means that no single entity controls the network. Instead, it\'s maintained by many participants. This provides security and censorship resistance, as there\'s no central point of failure or control.',
    icon: <Bitcoin className="h-5 w-5" />,
    triggers: ['add-crypto']
  },
  {
    id: 'blockchain',
    title: 'Blockchain Technology',
    description: 'A blockchain is a digital ledger of transactions that\'s duplicated and distributed across the entire network of computer systems. Each block contains a number of transactions, and when a block is filled, it\'s added to the chain.',
    icon: <ArrowRight className="h-5 w-5" />,
    triggers: ['token-detail', 'learning']
  },
  {
    id: 'wallet',
    title: 'Crypto Wallets',
    description: 'A crypto wallet is a digital tool that allows you to store and manage your cryptocurrencies. It contains your private keys, which are the passwords that give you access to your digital assets.',
    icon: <Wallet className="h-5 w-5" />,
    triggers: ['portfolio', 'dashboard']
  },
  {
    id: 'volatility',
    title: 'Crypto Volatility',
    description: 'Volatility refers to how much the price of a cryptocurrency changes over time. Cryptocurrencies are known for their high volatility, which means their prices can rise or fall dramatically in a short period. This creates both opportunities and risks.',
    icon: <BarChart2 className="h-5 w-5" />,
    triggers: ['risk-assessment', 'analytics']
  },
  {
    id: 'staking',
    title: 'Staking',
    description: 'Staking is the process of actively participating in transaction validation on a proof-of-stake blockchain. It involves locking up your coins to support the network and earn rewards, similar to earning interest on a savings account.',
    icon: <AlertTriangle className="h-5 w-5" />,
    triggers: ['token-detail', 'learning']
  }
];

export const CryptoConceptsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentConcept, setCurrentConcept] = useState<CryptoConcept | null>(null);
  const [isConceptVisible, setIsConceptVisible] = useState(false);
  const [seenConcepts, setSeenConcepts] = useState<string[]>([]);

  // Load seen concepts from localStorage on component mount
  useEffect(() => {
    const savedSeenConcepts = localStorage.getItem('seenCryptoConcepts');
    if (savedSeenConcepts) {
      try {
        setSeenConcepts(JSON.parse(savedSeenConcepts));
      } catch (error) {
        console.error('Error parsing seen concepts from localStorage:', error);
      }
    }
  }, []);

  // Save seen concepts to localStorage when updated
  useEffect(() => {
    localStorage.setItem('seenCryptoConcepts', JSON.stringify(seenConcepts));
  }, [seenConcepts]);

  const showConcept = (conceptId: string) => {
    const concept = cryptoConcepts.find(c => c.id === conceptId);
    if (concept && !seenConcepts.includes(conceptId)) {
      setCurrentConcept(concept);
      setIsConceptVisible(true);
    }
  };

  const hideConcept = () => {
    setIsConceptVisible(false);
    setTimeout(() => {
      setCurrentConcept(null);
    }, 300); // Small delay to allow the exit animation to play
  };

  const markConceptSeen = (conceptId: string) => {
    if (!seenConcepts.includes(conceptId)) {
      setSeenConcepts([...seenConcepts, conceptId]);
    }
  };

  const hasSeenConcept = (conceptId: string) => {
    return seenConcepts.includes(conceptId);
  };

  return (
    <CryptoConceptsContext.Provider 
      value={{ 
        concepts: cryptoConcepts,
        showConcept,
        hideConcept,
        currentConcept,
        isConceptVisible,
        markConceptSeen,
        hasSeenConcept
      }}
    >
      {children}
    </CryptoConceptsContext.Provider>
  );
};

export const useCryptoConcepts = () => {
  const context = useContext(CryptoConceptsContext);
  if (context === undefined) {
    throw new Error('useCryptoConcepts must be used within a CryptoConceptsProvider');
  }
  return context;
};