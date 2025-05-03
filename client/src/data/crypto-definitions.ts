interface CryptoDefinition {
  term: string;
  definition: string;
  learnMoreUrl?: string;
}

export const cryptoDefinitions: Record<string, CryptoDefinition> = {
  // Basic Concepts
  'blockchain': {
    term: 'Blockchain',
    definition: 'A distributed digital ledger that records transactions across many computers so that records cannot be altered retroactively without the alteration of all subsequent blocks.',
    learnMoreUrl: 'https://ethereum.org/en/developers/docs/intro-to-ethereum/#what-is-a-blockchain'
  },
  'cryptocurrency': {
    term: 'Cryptocurrency',
    definition: 'A digital or virtual currency that uses cryptography for security and operates on a decentralized network like blockchain.',
    learnMoreUrl: 'https://www.investopedia.com/terms/c/cryptocurrency.asp'
  },
  'decentralization': {
    term: 'Decentralization',
    definition: 'The distribution of power away from a central authority. In cryptocurrency, it means no single entity has control over the network.',
    learnMoreUrl: 'https://ethereum.org/en/developers/docs/consensus-mechanisms/'
  },
  
  // Market Terms
  'market-cap': {
    term: 'Market Capitalization',
    definition: 'The total value of a cryptocurrency. Calculated by multiplying the current price by the total circulating supply.',
    learnMoreUrl: 'https://www.investopedia.com/terms/m/marketcapitalization.asp'
  },
  'volume': {
    term: 'Trading Volume',
    definition: 'The amount of a cryptocurrency that has been traded in a given time period. Higher volumes indicate more market activity and liquidity.',
    learnMoreUrl: 'https://www.investopedia.com/terms/v/volume.asp'
  },
  'liquidity': {
    term: 'Liquidity',
    definition: 'The ease with which a cryptocurrency can be bought or sold without affecting its price. Higher liquidity means easier trading.',
    learnMoreUrl: 'https://www.investopedia.com/terms/l/liquidity.asp'
  },
  'volatility': {
    term: 'Volatility',
    definition: 'A measure of how much the price of a cryptocurrency fluctuates over time. High volatility means rapid and significant price movements.',
    learnMoreUrl: 'https://www.investopedia.com/terms/v/volatility.asp'
  },
  
  // Trading Terms
  'bull-market': {
    term: 'Bull Market',
    definition: 'A market condition where prices are rising or expected to rise, typically characterized by optimism and investor confidence.',
    learnMoreUrl: 'https://www.investopedia.com/terms/b/bullmarket.asp'
  },
  'bear-market': {
    term: 'Bear Market',
    definition: 'A market condition where prices are falling or expected to fall, typically characterized by pessimism and investor fear.',
    learnMoreUrl: 'https://www.investopedia.com/terms/b/bearmarket.asp'
  },
  'fomo': {
    term: 'FOMO (Fear Of Missing Out)',
    definition: 'The anxiety that you might miss an opportunity for profit, leading to impulsive buying decisions when prices are rising.',
    learnMoreUrl: 'https://www.investopedia.com/terms/f/fomo-fear-of-missing-out.asp'
  },
  'dyor': {
    term: 'DYOR (Do Your Own Research)',
    definition: 'A common phrase in the crypto community advising investors to conduct their own research before investing rather than following others\' advice.',
    learnMoreUrl: 'https://academy.binance.com/en/glossary/do-your-own-research'
  },
  
  // Investment Strategies
  'hodl': {
    term: 'HODL',
    definition: 'A misspelling of "hold" that became a backronym for "Hold On for Dear Life". It refers to a strategy of keeping your crypto assets regardless of price fluctuations.',
    learnMoreUrl: 'https://www.investopedia.com/terms/h/hodl.asp'
  },
  'dca': {
    term: 'Dollar-Cost Averaging (DCA)',
    definition: 'An investment strategy where you divide the total amount to be invested across periodic purchases to reduce the impact of volatility.',
    learnMoreUrl: 'https://www.investopedia.com/terms/d/dollarcostaveraging.asp'
  },
  'diversification': {
    term: 'Diversification',
    definition: 'Allocating investments among various assets to reduce risk. In crypto, this means investing in different cryptocurrencies.',
    learnMoreUrl: 'https://www.investopedia.com/terms/d/diversification.asp'
  },
  
  // Technical Concepts
  'consensus': {
    term: 'Consensus Mechanism',
    definition: 'A process used to achieve agreement among distributed processes or systems. Popular mechanisms include Proof of Work and Proof of Stake.',
    learnMoreUrl: 'https://ethereum.org/en/developers/docs/consensus-mechanisms/'
  },
  'pow': {
    term: 'Proof of Work (PoW)',
    definition: 'A consensus mechanism that requires computational work from network participants (miners) to validate transactions and create new blocks.',
    learnMoreUrl: 'https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/'
  },
  'pos': {
    term: 'Proof of Stake (PoS)',
    definition: 'A consensus mechanism where validators are chosen to create new blocks based on the amount of cryptocurrency they hold and are willing to "stake" as collateral.',
    learnMoreUrl: 'https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/'
  },
  'smart-contract': {
    term: 'Smart Contract',
    definition: 'Self-executing contracts with the terms directly written into code, automatically enforcing agreements without intermediaries.',
    learnMoreUrl: 'https://ethereum.org/en/developers/docs/smart-contracts/'
  },
  
  // Specific Cryptocurrencies
  'bitcoin': {
    term: 'Bitcoin (BTC)',
    definition: 'The first and largest cryptocurrency, created by an anonymous person or group known as Satoshi Nakamoto in 2009.',
    learnMoreUrl: 'https://bitcoin.org/en/'
  },
  'ethereum': {
    term: 'Ethereum (ETH)',
    definition: 'A decentralized, open-source blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform.',
    learnMoreUrl: 'https://ethereum.org/en/'
  },
  'stablecoin': {
    term: 'Stablecoin',
    definition: 'A type of cryptocurrency designed to maintain a stable value by pegging to an external asset, such as a fiat currency like the US Dollar.',
    learnMoreUrl: 'https://www.investopedia.com/terms/s/stablecoin.asp'
  },
  
  // Wallet and Security Concepts
  'wallet': {
    term: 'Crypto Wallet',
    definition: 'A digital tool that allows you to store, send, and receive cryptocurrencies. It contains private keys that grant access to your crypto assets.',
    learnMoreUrl: 'https://www.investopedia.com/terms/b/bitcoin-wallet.asp'
  },
  'private-key': {
    term: 'Private Key',
    definition: 'A secret number that allows cryptocurrencies to be spent. Anyone with access to your private key has control over your crypto assets.',
    learnMoreUrl: 'https://www.investopedia.com/terms/p/private-key.asp'
  },
  'seed-phrase': {
    term: 'Seed Phrase',
    definition: 'A series of words that gives you access to the crypto associated with your wallet. It is used to back up and restore your wallet.',
    learnMoreUrl: 'https://www.ledger.com/academy/crypto/what-is-a-recovery-phrase'
  },
  '2fa': {
    term: 'Two-Factor Authentication (2FA)',
    definition: 'An extra layer of security requiring two forms of verification before accessing your account, typically something you know (password) and something you possess (mobile device).',
    learnMoreUrl: 'https://authy.com/what-is-2fa/'
  },
  
  // Analysis Methods
  'fundamental-analysis': {
    term: 'Fundamental Analysis',
    definition: 'Evaluating a cryptocurrency by examining related economic, financial, and other qualitative and quantitative factors to determine its intrinsic value.',
    learnMoreUrl: 'https://www.investopedia.com/terms/f/fundamentalanalysis.asp'
  },
  'technical-analysis': {
    term: 'Technical Analysis',
    definition: 'Using historical price and volume data to forecast future price movements through the identification of patterns and trends.',
    learnMoreUrl: 'https://www.investopedia.com/terms/t/technicalanalysis.asp'
  },
  
  // DeFi Terms
  'defi': {
    term: 'DeFi (Decentralized Finance)',
    definition: 'Financial services and applications built on blockchain technology that operate without a central authority like banks or other financial institutions.',
    learnMoreUrl: 'https://ethereum.org/en/defi/'
  },
  'yield-farming': {
    term: 'Yield Farming',
    definition: 'A practice where crypto assets are lent or staked to generate returns or rewards in the form of additional cryptocurrency.',
    learnMoreUrl: 'https://academy.binance.com/en/articles/what-is-yield-farming-in-decentralized-finance-defi'
  },
  'amm': {
    term: 'Automated Market Maker (AMM)',
    definition: 'A type of decentralized exchange protocol that uses liquidity pools and mathematical formulas to determine prices instead of traditional order books.',
    learnMoreUrl: 'https://academy.binance.com/en/articles/what-is-an-automated-market-maker-amm'
  },
  
  // NFT Related
  'nft': {
    term: 'NFT (Non-Fungible Token)',
    definition: 'A unique digital asset that represents ownership of a specific item or piece of content, such as digital art, collectibles, or virtual real estate.',
    learnMoreUrl: 'https://ethereum.org/en/nft/'
  },
  
  // Tax and Regulatory
  'capital-gains': {
    term: 'Capital Gains',
    definition: 'The profit realized from selling cryptocurrency for more than you paid for it. In many jurisdictions, this profit is subject to capital gains tax.',
    learnMoreUrl: 'https://www.investopedia.com/terms/c/capitalgain.asp'
  },
  'kyc': {
    term: 'KYC (Know Your Customer)',
    definition: 'A standard process to verify customer identity. Cryptocurrency exchanges often require KYC to comply with anti-money laundering regulations.',
    learnMoreUrl: 'https://www.investopedia.com/terms/k/knowyourclient.asp'
  },
  
  // Portfolio Management
  'rebalancing': {
    term: 'Portfolio Rebalancing',
    definition: 'The process of realigning the weight of assets in your portfolio to maintain your desired level of asset allocation and risk.',
    learnMoreUrl: 'https://www.investopedia.com/terms/r/rebalancing.asp'
  },
  'portfolio-diversification': {
    term: 'Portfolio Diversification',
    definition: 'Spreading your investments across various assets to reduce risk. In crypto, this means investing in different types of cryptocurrencies.',
    learnMoreUrl: 'https://www.investopedia.com/terms/d/diversification.asp'
  },
  
  // Alerts and Monitoring
  'price-alert': {
    term: 'Price Alert',
    definition: 'A notification sent when a cryptocurrency reaches a specific price level that you have set. Useful for monitoring your investments without constant checking.',
  },
  'percent-change': {
    term: 'Percent Change',
    definition: 'The percentage increase or decrease in price over a specific time period. Often used to measure performance of a cryptocurrency.',
  },
  'market-sentiment': {
    term: 'Market Sentiment',
    definition: 'A measure of how investors generally feel about the market or a specific cryptocurrency. Can range from extremely bearish (negative) to extremely bullish (positive).',
    learnMoreUrl: 'https://www.investopedia.com/terms/m/marketsentiment.asp'
  },
};

/**
 * Get a definition by its key
 */
export function getDefinition(key: string): CryptoDefinition | undefined {
  return cryptoDefinitions[key];
}

/**
 * Find definitions that match a search term
 */
export function searchDefinitions(searchTerm: string): CryptoDefinition[] {
  const lowerCaseSearch = searchTerm.toLowerCase();
  return Object.values(cryptoDefinitions).filter(
    def => 
      def.term.toLowerCase().includes(lowerCaseSearch) || 
      def.definition.toLowerCase().includes(lowerCaseSearch)
  );
}

/**
 * Get all definitions
 */
export function getAllDefinitions(): CryptoDefinition[] {
  return Object.values(cryptoDefinitions);
}