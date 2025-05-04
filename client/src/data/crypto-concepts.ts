export type CryptoConcept = {
  id: string;
  title: string;
  category?: string;
  definition: string;
  explanation: string;
  example?: string;
  learnMoreUrl?: string;
};

export const conceptData: Record<string, CryptoConcept> = {
  "blockchain": {
    id: "blockchain",
    title: "Blockchain Technology",
    category: "Fundamentals",
    definition: "A decentralized, distributed ledger that records transactions across many computers.",
    explanation: "Blockchain is the underlying technology that powers cryptocurrencies. It's a chain of blocks containing information that is linked using cryptography. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data. The blockchain is managed by a peer-to-peer network, and once recorded, the data in a block cannot be altered without altering all subsequent blocks.",
    example: "When you send Bitcoin to someone, that transaction is verified by miners, added to a block with other transactions, and appended to the blockchain. This record is permanent and viewable by anyone on the network.",
    learnMoreUrl: "https://www.investopedia.com/terms/b/blockchain.asp"
  },
  "wallet": {
    id: "wallet",
    title: "Cryptocurrency Wallet",
    category: "Security",
    definition: "A digital tool that allows you to store, send, and receive cryptocurrencies.",
    explanation: "A crypto wallet is a software program, hardware device, or service that stores the public and private keys needed to make cryptocurrency transactions. Wallets don't actually store your cryptocurrency — they store your keys. Your cryptocurrencies exist on the blockchain, and your keys allow you to access and manage them.",
    example: "If you have a Bitcoin wallet with a private key, you can use it to send your Bitcoin to another wallet address, similar to how you might transfer money from your bank account to someone else's.",
    learnMoreUrl: "https://www.coinbase.com/learn/crypto-basics/what-is-a-crypto-wallet"
  },
  "volatility": {
    id: "volatility",
    title: "Market Volatility",
    category: "Trading",
    definition: "The rate at which the price of an asset increases or decreases for a set of returns.",
    explanation: "Cryptocurrency markets are known for their high volatility, meaning prices can change dramatically in short periods. This volatility can create opportunities for traders but also poses significant risks. Factors contributing to crypto volatility include market sentiment, regulatory news, technological developments, and relatively low liquidity compared to traditional markets.",
    example: "Bitcoin's price might increase by 15% one day and then decrease by 10% the next, making it much more volatile than traditional investments like stocks or bonds.",
    learnMoreUrl: "https://www.investopedia.com/terms/v/volatility.asp"
  },
  "market-cap": {
    id: "market-cap",
    title: "Market Capitalization",
    category: "Analysis",
    definition: "The total value of a cryptocurrency, calculated by multiplying the current price by the circulating supply.",
    explanation: "Market capitalization (or market cap) is used to rank the relative size of a cryptocurrency. It's calculated by multiplying the price of a coin by its circulating supply. Market cap helps investors understand the overall value and potential growth of a cryptocurrency project, rather than just focusing on the price per coin.",
    example: "If a cryptocurrency has 10 million coins in circulation and each coin is worth $10, the market cap is $100 million.",
    learnMoreUrl: "https://www.investopedia.com/terms/m/marketcapitalization.asp"
  },
  "staking": {
    id: "staking",
    title: "Crypto Staking",
    category: "Earning",
    definition: "The process of actively participating in transaction validation on a proof-of-stake blockchain.",
    explanation: "Staking involves holding funds in a cryptocurrency wallet to support the security and operations of a blockchain network. In return for locking up your assets and participating in validating transactions, you receive rewards, similar to earning interest in a savings account. Staking is only available on blockchains that use the proof-of-stake consensus mechanism.",
    example: "If you stake 100 ETH on Ethereum's proof-of-stake network, you might earn 5% annual rewards, resulting in 5 additional ETH over a year.",
    learnMoreUrl: "https://ethereum.org/en/staking/"
  },
  "decentralization": {
    id: "decentralization",
    title: "Decentralization",
    category: "Fundamentals",
    definition: "The distribution of power, control, and decision-making away from central authorities to a distributed network.",
    explanation: "Decentralization is a core principle of many blockchain networks and cryptocurrencies. In a decentralized system, no single entity has control over the entire network. Instead, control is distributed among many participants. This design aims to increase transparency, reduce censorship risk, eliminate single points of failure, and provide greater user autonomy.",
    example: "Unlike traditional banking where a central bank controls the monetary system, Bitcoin operates on a network of thousands of computers worldwide, with no single entity in control of the currency or its transactions.",
    learnMoreUrl: "https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/mining/"
  },
  "smart-contract": {
    id: "smart-contract",
    title: "Smart Contracts",
    category: "Technology",
    definition: "Self-executing contracts with the terms directly written into code.",
    explanation: "Smart contracts are programs stored on a blockchain that automatically execute when predetermined conditions are met. They eliminate the need for intermediaries in transactions and can be used for a wide range of applications, from simple transfers to complex decentralized applications (dApps). Ethereum was the first major platform to support smart contracts, but many other blockchains now offer this functionality.",
    example: "A smart contract could automatically transfer ownership of a digital asset when payment is received, without requiring a lawyer or escrow service.",
    learnMoreUrl: "https://ethereum.org/en/developers/docs/smart-contracts/"
  },
  "defi": {
    id: "defi",
    title: "Decentralized Finance (DeFi)",
    category: "Applications",
    definition: "Financial applications built on blockchain networks that operate without central intermediaries.",
    explanation: "DeFi refers to a movement that aims to create an open-source, permissionless, and transparent financial service ecosystem available to everyone and operating without any central authority. Users maintain full control over their assets and interact with this ecosystem through peer-to-peer (P2P), decentralized applications (dApps). DeFi services include lending, borrowing, trading, insurance, and more.",
    example: "Using a DeFi lending platform, you could lend your cryptocurrency and earn interest, or borrow against your crypto assets without going through a bank or credit check.",
    learnMoreUrl: "https://ethereum.org/en/defi/"
  },
  "nft": {
    id: "nft",
    title: "Non-Fungible Tokens (NFTs)",
    category: "Digital Assets",
    definition: "Unique digital assets that represent ownership of specific items or content on the blockchain.",
    explanation: "Unlike cryptocurrencies where each token is identical (fungible), NFTs are unique tokens that cannot be replicated or equated on a 1:1 basis with another token. They can represent ownership of digital art, collectibles, music, videos, virtual real estate, in-game items, and even real-world assets. NFTs use blockchain technology to provide verifiable proof of ownership and authenticity.",
    example: "An artist could create a digital artwork and sell it as an NFT, allowing the buyer to have verifiable ownership of the original piece, even if the image itself can be viewed or copied by others.",
    learnMoreUrl: "https://ethereum.org/en/nft/"
  },
  "mining": {
    id: "mining",
    title: "Cryptocurrency Mining",
    category: "Technology",
    definition: "The process of validating transactions and creating new blocks on a proof-of-work blockchain.",
    explanation: "Mining involves using specialized computer hardware to solve complex mathematical problems that validate transactions and secure the network. Miners are rewarded with newly created coins and transaction fees. This process requires significant computational power and electricity, which has raised environmental concerns about some cryptocurrencies like Bitcoin.",
    example: "Bitcoin miners use specialized ASIC hardware to solve cryptographic puzzles, and the first miner to solve the puzzle gets to add a new block to the blockchain and receive the block reward (currently 6.25 BTC).",
    learnMoreUrl: "https://www.investopedia.com/tech/how-does-bitcoin-mining-work/"
  }
};