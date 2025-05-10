import { db } from "../db";
import {
  learningModules,
  learningQuizzes,
  InsertLearningModule
} from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Sample content for Bitcoin Basics module
 */
const bitcoinBasicsContent = JSON.stringify([
  {
    "title": "What is Bitcoin?",
    "content": "Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network without the need for intermediaries.\n\nCreated in 2009 by an unknown person or group using the name Satoshi Nakamoto, Bitcoin pioneered the concept of cryptocurrency and remains the most valuable and widely-used digital currency today.",
    "type": "text"
  },
  {
    "title": "How Bitcoin Works",
    "content": "Bitcoin relies on blockchain technology, which is essentially a distributed public ledger. All bitcoin transactions are recorded on this ledger, which is maintained by a network of computers (nodes) running the Bitcoin software.\n\nTransactions are verified by network nodes through cryptography and recorded in the blockchain. Bitcoin uses a consensus mechanism called Proof of Work (PoW) to validate transactions and secure the network.",
    "type": "text"
  },
  {
    "title": "Bitcoin Mining",
    "content": "Mining is the process through which new bitcoins are created and transactions are added to the blockchain. Miners use powerful computers to solve complex mathematical problems that validate transactions.\n\nWhen miners successfully validate a block of transactions, they are rewarded with newly created bitcoins and transaction fees. This process requires substantial computational power and electricity.",
    "type": "text"
  },
  {
    "title": "Storing and Using Bitcoin",
    "content": "Bitcoin is stored in digital wallets, which can be software on your computer or smartphone, a web service, or a hardware device. Each wallet has a public address (where others can send bitcoins to you) and a private key (which you use to send bitcoins to others).\n\nBitcoin can be used for online purchases, as an investment, or transferred to other users. Transactions are irreversible and pseudonymous, meaning they're linked to addresses rather than personal identities.",
    "type": "text"
  },
  {
    "title": "Bitcoin's Value and Volatility",
    "content": "Bitcoin's price is determined by supply and demand in the market. Its value can be highly volatile, with significant price swings occurring within short timeframes.\n\nFactors affecting Bitcoin's price include adoption rates, regulatory news, macroeconomic trends, technological developments, and market sentiment. Many investors see Bitcoin as a store of value or 'digital gold' due to its fixed supply cap of 21 million coins.",
    "type": "text"
  }
]);

/**
 * Sample content for Trading Basics module
 */
const tradingBasicsContent = JSON.stringify([
  {
    "title": "Understanding Cryptocurrency Markets",
    "content": "Cryptocurrency markets operate 24/7 across a global network of exchanges. Unlike traditional financial markets with set trading hours, crypto never sleeps, allowing traders to buy and sell at any time.\n\nThese markets are characterized by higher volatility than traditional markets, creating both risks and opportunities for traders. Understanding market dynamics is essential before committing significant capital.",
    "type": "text"
  },
  {
    "title": "Types of Orders",
    "content": "Market Order: Executes immediately at the current market price. Provides guaranteed execution but not a guaranteed price.\n\nLimit Order: Sets a specific price at which you're willing to buy or sell. The order will only execute at your specified price or better.\n\nStop Loss Order: Automatically sells when the price falls to a specified level, helping to limit potential losses.\n\nTake Profit Order: Automatically sells when the price rises to a specified level, securing profits.",
    "type": "text"
  },
  {
    "title": "Key Trading Metrics",
    "content": "Volume: The total amount of a cryptocurrency traded over a specific period. Higher volume usually indicates higher liquidity and more market interest.\n\nMarket Depth: Shows the quantity of orders at different price levels, helping to assess potential price impact when buying or selling.\n\nBid-Ask Spread: The difference between the highest price a buyer is willing to pay and the lowest price a seller is willing to accept. Tighter spreads indicate more liquid markets.",
    "type": "text"
  },
  {
    "title": "Risk Management Strategies",
    "content": "Position Sizing: Determining how much of your capital to allocate to each trade. A common rule is risking no more than 1-2% of your portfolio on any single trade.\n\nDiversification: Spreading investments across multiple cryptocurrencies to reduce risk exposure to any single asset.\n\nRisk-Reward Ratio: Determining potential profit versus potential loss before entering a trade. A minimum 1:2 risk-reward ratio is often recommended, meaning potential profits should be at least twice potential losses.",
    "type": "text"
  },
  {
    "title": "Technical vs. Fundamental Analysis",
    "content": "Technical Analysis: Studies price charts and trading patterns to predict future price movements. Uses indicators like moving averages, relative strength index (RSI), and MACD.\n\nFundamental Analysis: Evaluates a cryptocurrency's intrinsic value based on factors like development activity, adoption metrics, tokenomics, and team expertise.\n\nSuccessful traders often use both approaches: technical analysis for timing entry and exit points, and fundamental analysis for selecting promising projects.",
    "type": "text"
  }
]);

/**
 * Sample content for DeFi Basics module
 */
const defiBasicsContent = JSON.stringify([
  {
    "title": "What is DeFi?",
    "content": "Decentralized Finance (DeFi) refers to financial services built on blockchain technology that operate without centralized intermediaries like banks or financial institutions.\n\nDeFi aims to create an open, permissionless financial system where anyone with an internet connection can access services like lending, borrowing, trading, and investing, regardless of their location or social status.",
    "type": "text"
  },
  {
    "title": "Key DeFi Components",
    "content": "Smart Contracts: Self-executing contracts with the terms directly written into code, enabling trustless transactions without intermediaries.\n\nDecentralized Applications (dApps): Frontend interfaces that connect users to DeFi protocols and services.\n\nDecentralized Exchanges (DEXs): Platforms for trading cryptocurrencies without a central authority managing the order book.\n\nLiquidity Pools: Collections of funds locked in smart contracts that facilitate trading, lending, and other financial activities.",
    "type": "text"
  },
  {
    "title": "Common DeFi Services",
    "content": "Lending and Borrowing: Platforms that allow users to lend their crypto assets to earn interest or borrow assets by providing collateral.\n\nDecentralized Exchanges: Services that facilitate peer-to-peer trading without a central authority.\n\nStaking and Yield Farming: Methods for earning passive income by committing assets to support network operations or provide liquidity.\n\nSynthetic Assets: Tokenized derivatives that track the value of real-world assets like stocks, commodities, or fiat currencies.",
    "type": "text"
  },
  {
    "title": "DeFi Risks and Considerations",
    "content": "Smart Contract Risk: Vulnerabilities in the code could lead to hacks or unexpected behavior resulting in loss of funds.\n\nImpermanent Loss: A risk for liquidity providers when asset prices change significantly relative to when they were deposited.\n\nRegulatory Uncertainty: The evolving regulatory landscape could impact DeFi operations and user access.\n\nVolatility and Market Risk: Crypto price fluctuations can affect collateral requirements, potentially leading to liquidations.",
    "type": "text"
  },
  {
    "title": "Getting Started with DeFi",
    "content": "Non-Custodial Wallet: You'll need a wallet like MetaMask that allows you to interact with DeFi protocols while maintaining control of your private keys.\n\nBase Currency: Most DeFi applications operate on Ethereum or other smart contract platforms, so you'll need ETH or the native token of your chosen network for transactions.\n\nGas Fees: Understand that each transaction requires a network fee, which can vary significantly during periods of high network congestion.\n\nResearch: Due to the rapidly evolving landscape, thorough research and risk assessment are essential before committing significant funds to any DeFi protocol.",
    "type": "text"
  }
]);

// Sample learning modules data
const learningModulesData: InsertLearningModule[] = [
  {
    title: "Bitcoin Basics",
    description: "Learn the fundamental concepts of Bitcoin, including its history, how it works, and its importance in the cryptocurrency ecosystem.",
    content: bitcoinBasicsContent,
    category: "basics",
    difficulty: 1,
    order: 1,
    estimatedMinutes: 15
  },
  {
    title: "Cryptocurrency Trading Fundamentals",
    description: "Master the essentials of crypto trading, including order types, market analysis, and risk management strategies.",
    content: tradingBasicsContent,
    category: "trading",
    difficulty: 2,
    order: 2,
    estimatedMinutes: 20
  },
  {
    title: "Introduction to DeFi",
    description: "Discover decentralized finance and explore how it's transforming the traditional financial landscape.",
    content: defiBasicsContent,
    category: "defi",
    difficulty: 2,
    order: 3,
    estimatedMinutes: 25
  }
];

// Sample quizzes
const learningQuizzesData = [
  {
    question: "What is the maximum supply of Bitcoin?",
    // Use string[] format for options to match the schema
    options: ["10 million", "21 million", "100 million", "There is no maximum supply"],
    correctOption: 1,
    explanation: "Bitcoin has a fixed supply cap of 21 million coins, which is one of its defining features that creates digital scarcity.",
    order: 1
  },
  {
    question: "Which consensus mechanism does Bitcoin use?",
    options: ["Proof of Stake (PoS)", "Proof of Work (PoW)", "Delegated Proof of Stake (DPoS)", "Proof of Authority (PoA)"],
    correctOption: 1,
    explanation: "Bitcoin uses Proof of Work (PoW), a consensus mechanism where miners compete to solve complex mathematical problems to validate transactions and secure the network.",
    order: 2
  },
  {
    question: "What type of order guarantees execution but not price?",
    options: ["Limit order", "Market order", "Stop loss order", "Take profit order"],
    correctOption: 1,
    explanation: "A market order executes immediately at the current market price, guaranteeing execution but not a specific price.",
    order: 1
  },
  {
    question: "What is impermanent loss in DeFi?",
    options: ["A temporary server outage", "Loss due to smart contract hacks", "A risk for liquidity providers when asset prices change", "Fees paid for failed transactions"],
    correctOption: 2,
    explanation: "Impermanent loss occurs when the price of tokens deposited in a liquidity pool changes compared to when they were deposited, potentially resulting in less value than simply holding the tokens.",
    order: 1
  }
];

/**
 * Seed learning modules and quizzes
 */
export async function seedLearningModules() {
  try {
    console.log("Checking if learning modules need to be seeded...");

    // Check if we already have learning modules
    const existingModules = await db.select().from(learningModules);

    if (existingModules.length > 0) {
      console.log(`Found ${existingModules.length} existing learning modules, skipping seeding.`);
      return;
    }

    console.log("Seeding learning modules...");

    // Insert learning modules
    const insertedModules = await db.insert(learningModules).values(learningModulesData).returning();

    console.log(`Successfully seeded ${insertedModules.length} learning modules.`);

    // Associate quizzes with their respective modules
    const bitcoinModule = insertedModules.find(m => m.title === "Bitcoin Basics");
    const tradingModule = insertedModules.find(m => m.title === "Cryptocurrency Trading Fundamentals");
    const defiModule = insertedModules.find(m => m.title === "Introduction to DeFi");

    if (bitcoinModule) {
      await db.insert(learningQuizzes).values([
        { ...learningQuizzesData[0], moduleId: bitcoinModule.id },
        { ...learningQuizzesData[1], moduleId: bitcoinModule.id }
      ]);
    }

    if (tradingModule) {
      await db.insert(learningQuizzes).values({
        ...learningQuizzesData[2],
        moduleId: tradingModule.id
      });
    }

    if (defiModule) {
      await db.insert(learningQuizzes).values({
        ...learningQuizzesData[3],
        moduleId: defiModule.id
      });
    }

    console.log("Successfully seeded learning quizzes.");

  } catch (error) {
    console.error("Error seeding learning modules:", error);
  }
}