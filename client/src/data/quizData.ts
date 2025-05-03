export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'basics' | 'investing' | 'technology' | 'security' | 'defi' | 'nft' | 'trading';
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  timeInMinutes: number;
}

export const quizzes: Quiz[] = [
  {
    id: 'crypto-basics',
    title: 'Cryptocurrency Basics',
    description: 'Test your knowledge of fundamental cryptocurrency concepts',
    category: 'basics',
    difficulty: 'beginner',
    timeInMinutes: 5,
    questions: [
      {
        id: 'basics-1',
        question: 'What is a blockchain?',
        options: [
          'A centralized database owned by a single company',
          'A distributed, decentralized ledger that records transactions across multiple computers',
          'A type of cryptocurrency that only exists on the internet',
          'A digital wallet used to store cryptocurrencies'
        ],
        correctAnswer: 1,
        explanation: 'A blockchain is a distributed, decentralized ledger that records transactions across many computers so that the record cannot be altered retroactively without the alteration of all subsequent blocks and the consensus of the network.',
        difficulty: 'beginner',
        category: 'basics'
      },
      {
        id: 'basics-2',
        question: 'What does "HODL" stand for in the crypto community?',
        options: [
          'Hold On for Dear Life',
          'Have Only Digital Ledgers',
          'High-Output Distributed Ledger',
          'It was originally a typo for "hold" that became popular'
        ],
        correctAnswer: 3,
        explanation: '"HODL" originated from a misspelling of "hold" in a Bitcoin forum post during a market crash in 2013. It has been retroactively interpreted as "Hold On for Dear Life" but was originally just a typo that became a meme.',
        difficulty: 'beginner',
        category: 'basics'
      },
      {
        id: 'basics-3',
        question: 'What is a cryptocurrency wallet?',
        options: [
          'A physical device that stores cryptocurrency coins',
          'An online bank account for digital currencies',
          'Software that stores your private and public keys to interact with the blockchain',
          'A website where you can buy cryptocurrencies'
        ],
        correctAnswer: 2,
        explanation: 'A cryptocurrency wallet is a digital tool that stores your private and public keys, allowing you to interact with various blockchain networks. It doesn\'t actually store your coins; those live on the blockchain. The wallet stores the keys needed to access and manage them.',
        difficulty: 'beginner',
        category: 'basics'
      },
      {
        id: 'basics-4',
        question: 'What is the main difference between a cryptocurrency and a token?',
        options: [
          'They are different names for the same thing',
          'Cryptocurrencies have their own blockchain, while tokens are built on existing blockchains',
          'Tokens can be physical, cryptocurrencies are always digital',
          'Cryptocurrencies are only used for payments, tokens have other utilities'
        ],
        correctAnswer: 1,
        explanation: 'Cryptocurrencies (like Bitcoin) operate on their own native blockchain. Tokens (like many ERC-20 tokens) are created on existing blockchain platforms like Ethereum and do not have their own blockchain.',
        difficulty: 'beginner',
        category: 'basics'
      },
      {
        id: 'basics-5',
        question: 'What is a "gas fee" in cryptocurrency transactions?',
        options: [
          'A fee charged by cryptocurrency exchanges',
          'A tax imposed by governments on crypto transactions',
          'A payment to miners/validators for processing transactions on a blockchain',
          'A subscription fee for wallet services'
        ],
        correctAnswer: 2,
        explanation: 'Gas fees are payments made by users to compensate for the computing energy required to process and validate transactions on the blockchain. These fees are paid to miners or validators who maintain the network.',
        difficulty: 'beginner',
        category: 'basics'
      }
    ]
  },
  {
    id: 'defi-basics',
    title: 'DeFi Fundamentals',
    description: 'Learn about Decentralized Finance concepts and applications',
    category: 'defi',
    difficulty: 'intermediate',
    timeInMinutes: 8,
    questions: [
      {
        id: 'defi-1',
        question: 'What is DeFi?',
        options: [
          'A specific cryptocurrency token',
          'Decentralized Finance - financial services on the blockchain without traditional intermediaries',
          'Digital File system for storing cryptocurrency data',
          'A type of hardware wallet'
        ],
        correctAnswer: 1,
        explanation: 'DeFi (Decentralized Finance) refers to financial services and applications built on blockchain technology that aim to recreate and improve upon traditional financial systems without central authorities or intermediaries like banks.',
        difficulty: 'intermediate',
        category: 'defi'
      },
      {
        id: 'defi-2',
        question: 'What is a "liquidity pool" in DeFi?',
        options: [
          'A group of traders who share market information',
          'A collection of funds locked in a smart contract to facilitate trading and lending',
          'A centralized exchange\'s reserve of cryptocurrencies',
          'A fund managed by professional crypto investors'
        ],
        correctAnswer: 1,
        explanation: 'A liquidity pool is a collection of funds locked in a smart contract that provides liquidity to decentralized exchanges and other DeFi protocols. Users who provide liquidity to these pools often earn fees or rewards in return.',
        difficulty: 'intermediate',
        category: 'defi'
      },
      {
        id: 'defi-3',
        question: 'What is "yield farming"?',
        options: [
          'Mining cryptocurrencies using renewable energy',
          'A strategy where users move their assets between different protocols to maximize returns',
          'Growing physical crops and selling them for cryptocurrency',
          'The process of staking a single cryptocurrency for extended periods'
        ],
        correctAnswer: 1,
        explanation: 'Yield farming involves strategically moving crypto assets between different DeFi protocols to maximize returns. Users "farm" for yields by providing liquidity or locking up assets in projects that offer the best interest rates, token rewards, or other incentives.',
        difficulty: 'intermediate',
        category: 'defi'
      },
      {
        id: 'defi-4',
        question: 'What is an "impermanent loss" in DeFi?',
        options: [
          'When a blockchain temporarily goes offline',
          'The potential loss liquidity providers face when the price of their deposited assets changes compared to holding them',
          'A short-term dip in cryptocurrency prices',
          'When a wallet is temporarily locked due to forgotten passwords'
        ],
        correctAnswer: 1,
        explanation: 'Impermanent loss occurs when the price ratio of assets in a liquidity pool changes after deposit. If you had simply held the assets instead of providing liquidity, you might have had a greater value. It\'s "impermanent" because the loss is only realized when you withdraw your assets from the pool.',
        difficulty: 'intermediate',
        category: 'defi'
      },
      {
        id: 'defi-5',
        question: 'What is a "flash loan" in DeFi?',
        options: [
          'A loan that is processed very quickly',
          'A loan with extremely high interest rates',
          'An uncollateralized loan that must be borrowed and repaid within a single transaction block',
          'A loan specifically for buying NFTs'
        ],
        correctAnswer: 2,
        explanation: 'A flash loan is a special type of uncollateralized loan where the borrowing and repayment must occur within the same transaction block on the blockchain. If the borrowed funds aren\'t repaid within the same transaction, the entire transaction is reverted as if it never happened.',
        difficulty: 'intermediate',
        category: 'defi'
      }
    ]
  },
  {
    id: 'crypto-security',
    title: 'Cryptocurrency Security',
    description: 'Test your knowledge about keeping your crypto assets safe',
    category: 'security',
    difficulty: 'beginner',
    timeInMinutes: 5,
    questions: [
      {
        id: 'security-1',
        question: 'What is a private key in cryptocurrency?',
        options: [
          'A password created by a cryptocurrency exchange',
          'A secret code that allows you to access and manage your cryptocurrency',
          'A software program that mines new coins',
          'An identification number assigned to your wallet by the blockchain'
        ],
        correctAnswer: 1,
        explanation: 'A private key is a secure cryptographic code that allows access to your cryptocurrency holdings. It works like a highly secure password that proves your ownership of your digital assets and should never be shared with anyone.',
        difficulty: 'beginner',
        category: 'security'
      },
      {
        id: 'security-2',
        question: 'What is a "seed phrase" or "recovery phrase"?',
        options: [
          'A password hint to help you remember your exchange login',
          'A series of random words that can be used to recover your wallet and private keys',
          'A promotional code for getting free cryptocurrency',
          'A phrase that describes the technology behind a particular cryptocurrency'
        ],
        correctAnswer: 1,
        explanation: 'A seed phrase (or recovery phrase) is a series of words (usually 12, 18, or 24) that can be used to recover your wallet and the private keys it contains. It should be written down physically and stored securely offline, as anyone with access to this phrase can access your funds.',
        difficulty: 'beginner',
        category: 'security'
      },
      {
        id: 'security-3',
        question: 'What is a hardware wallet?',
        options: [
          'A mobile app for tracking cryptocurrency prices',
          'A physical device specifically designed to securely store cryptocurrency private keys offline',
          'A type of exchange that specializes in hardware mining equipment',
          'A paper document where you write down your wallet addresses'
        ],
        correctAnswer: 1,
        explanation: 'A hardware wallet is a physical device specifically designed to store cryptocurrency private keys offline (cold storage). This significantly increases security by keeping your keys isolated from potentially vulnerable internet-connected devices.',
        difficulty: 'beginner',
        category: 'security'
      },
      {
        id: 'security-4',
        question: 'What is a "phishing attack" in the context of cryptocurrency?',
        options: [
          'When miners compete to solve complex math problems',
          'A method to accelerate the block verification process',
          'An attempt to trick users into revealing their private keys or seed phrases through deceptive means',
          'A legitimate technique for recovering lost cryptocurrency'
        ],
        correctAnswer: 2,
        explanation: 'A phishing attack is when scammers attempt to trick users into revealing sensitive information like private keys, seed phrases, or login credentials. This is often done through fake websites that mimic legitimate crypto services, deceptive emails, or social media messages.',
        difficulty: 'beginner',
        category: 'security'
      },
      {
        id: 'security-5',
        question: 'What is "2FA" and why is it important for cryptocurrency security?',
        options: [
          'Two-Factor Authentication - an extra layer of security beyond just a password',
          'Two Frequency Algorithm - a method used to encrypt wallet addresses',
          'Two-Fund Analysis - a strategy for splitting investments between two cryptocurrencies',
          'Two-Factor Allocation - a technique for mining two cryptocurrencies simultaneously'
        ],
        correctAnswer: 0,
        explanation: '2FA (Two-Factor Authentication) adds an extra security layer beyond just your password. When enabled, you need both your password and a second verification method (like a code from your phone) to access your accounts, making them much more secure against unauthorized access.',
        difficulty: 'beginner',
        category: 'security'
      }
    ]
  },
  {
    id: 'crypto-trading',
    title: 'Cryptocurrency Trading Concepts',
    description: 'Learn about trading strategies and market analysis',
    category: 'trading',
    difficulty: 'intermediate',
    timeInMinutes: 8,
    questions: [
      {
        id: 'trading-1',
        question: 'What is "DYOR" in the crypto community?',
        options: [
          'Diversify Your Online Resources',
          'Download Your Own Reserves',
          'Do Your Own Research',
          'Determine Yearly Output Ratios'
        ],
        correctAnswer: 2,
        explanation: 'DYOR stands for "Do Your Own Research." It\'s a common phrase in the crypto community that encourages investors to conduct their own investigation and analysis before investing in cryptocurrencies rather than acting on tips or hype.',
        difficulty: 'intermediate',
        category: 'trading'
      },
      {
        id: 'trading-2',
        question: 'What is "dollar-cost averaging" (DCA) in cryptocurrency investing?',
        options: [
          'Converting all your dollars to cryptocurrency at once',
          'Investing a fixed amount regularly regardless of the asset\'s price',
          'Trading between dollar-pegged stablecoins to generate profits',
          'Setting a fixed dollar amount as your maximum investment'
        ],
        correctAnswer: 1,
        explanation: 'Dollar-cost averaging is an investment strategy where you invest a fixed amount of money at regular intervals regardless of the asset\'s price. This reduces the impact of volatility and eliminates the need to time the market perfectly.',
        difficulty: 'intermediate',
        category: 'trading'
      },
      {
        id: 'trading-3',
        question: 'What is a "limit order" in cryptocurrency trading?',
        options: [
          'A restriction on how much cryptocurrency you can buy in one day',
          'An order to buy or sell at a specific price or better',
          'The maximum amount of leverage allowed on a trading platform',
          'A cap on trading fees set by exchanges'
        ],
        correctAnswer: 1,
        explanation: 'A limit order is an instruction to buy or sell a cryptocurrency at a specified price or better. Unlike market orders that execute immediately at the current market price, limit orders only execute when the market reaches your specified price.',
        difficulty: 'intermediate',
        category: 'trading'
      },
      {
        id: 'trading-4',
        question: 'What does "FOMO" mean in cryptocurrency trading?',
        options: [
          'Fear Of Missing Out - making investments based on the anxiety of missing potential gains',
          'Fully Optimized Mining Operation',
          'Future Of Money Opportunity',
          'Fixed Orders Mandatory Oversight'
        ],
        correctAnswer: 0,
        explanation: 'FOMO stands for "Fear Of Missing Out." In crypto trading, it refers to the anxiety that drives people to make investment decisions based on the fear that they might miss potential profits, often leading to buying at market peaks or investing in projects without proper research.',
        difficulty: 'intermediate',
        category: 'trading'
      },
      {
        id: 'trading-5',
        question: 'What is a "stop-loss" order?',
        options: [
          'An order that prevents you from trading when markets are highly volatile',
          'A limit on how much cryptocurrency you can sell in one day',
          'An automatic order to sell an asset when it reaches a specified lower price',
          'A trading strategy that focuses only on minimizing losses rather than maximizing gains'
        ],
        correctAnswer: 2,
        explanation: 'A stop-loss order is an automatic instruction to sell an asset when its price drops to a specified level. It\'s designed to limit an investor\'s loss on a position and can help take emotion out of trading decisions by automatically executing when certain conditions are met.',
        difficulty: 'intermediate',
        category: 'trading'
      }
    ]
  }
];

// Function to get quiz by ID
export function getQuizById(id: string): Quiz | undefined {
  return quizzes.find(quiz => quiz.id === id);
}

// Function to get quizzes by category
export function getQuizzesByCategory(category: string): Quiz[] {
  return quizzes.filter(quiz => quiz.category === category);
}

// Function to get quizzes by difficulty
export function getQuizzesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Quiz[] {
  return quizzes.filter(quiz => quiz.difficulty === difficulty);
}