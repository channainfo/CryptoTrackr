import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  searchDefinitions,
  getAllDefinitions,
} from "@/data/crypto-definitions";
import type { CryptoDefinition } from "@/types/education";

// Function to categorize definitions based on their keys
const categorizeDefinitions = (definitions: CryptoDefinition[]) => {
  const categories: Record<string, CryptoDefinition[]> = {
    "Market Terms": [],
    "Investment Strategies": [],
    "Technical Concepts": [],
    Cryptocurrencies: [],
    Security: [],
    Analysis: [],
    DeFi: [],
    NFTs: [],
    "Tax & Regulatory": [],
    "Portfolio Management": [],
    Other: [],
  };

  definitions.forEach((def) => {
    const key = def.term.toLowerCase();

    if (
      key.includes("market") ||
      key.includes("fomo") ||
      key.includes("bull") ||
      key.includes("bear") ||
      key.includes("sentiment")
    ) {
      categories["Market Terms"].push(def);
    } else if (
      key.includes("hodl") ||
      key.includes("dca") ||
      key.includes("diversification") ||
      key.includes("research")
    ) {
      categories["Investment Strategies"].push(def);
    } else if (
      key.includes("consensus") ||
      key.includes("pow") ||
      key.includes("pos") ||
      key.includes("contract") ||
      key.includes("blockchain")
    ) {
      categories["Technical Concepts"].push(def);
    } else if (
      key.includes("bitcoin") ||
      key.includes("ethereum") ||
      key.includes("stablecoin") ||
      key.includes("token")
    ) {
      categories["Cryptocurrencies"].push(def);
    } else if (
      key.includes("wallet") ||
      key.includes("key") ||
      key.includes("2fa") ||
      key.includes("seed")
    ) {
      categories["Security"].push(def);
    } else if (key.includes("analysis") || key.includes("indicator")) {
      categories["Analysis"].push(def);
    } else if (
      key.includes("defi") ||
      key.includes("yield") ||
      key.includes("amm")
    ) {
      categories["DeFi"].push(def);
    } else if (key.includes("nft")) {
      categories["NFTs"].push(def);
    } else if (
      key.includes("tax") ||
      key.includes("kyc") ||
      key.includes("gain") ||
      key.includes("regulatory")
    ) {
      categories["Tax & Regulatory"].push(def);
    } else if (
      key.includes("portfolio") ||
      key.includes("rebalancing") ||
      key.includes("alert")
    ) {
      categories["Portfolio Management"].push(def);
    } else {
      categories["Other"].push(def);
    }
  });

  // Filter out empty categories
  return Object.entries(categories)
    .filter(([_, defs]) => defs.length > 0)
    .reduce(
      (acc, [category, defs]) => {
        acc[category] = defs;
        return acc;
      },
      {} as Record<string, CryptoDefinition[]>,
    );
};

const GlossaryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const definitions = searchTerm
    ? searchDefinitions(searchTerm)
    : getAllDefinitions();
  const categorizedDefinitions = categorizeDefinitions(definitions);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold dark:text-white">
            Crypto Glossary
          </h1>
        </div>
        <p className="text-neutral-mid dark:text-gray-400 mt-1 mb-6">
          Learn the essential cryptocurrency terms and concepts to better
          understand the crypto market.
        </p>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-mid" />
          <Input
            placeholder="Search for terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {definitions.length === 0 ? (
        <div className="text-center py-12 bg-neutral-lighter dark:bg-zinc-800 rounded-xl">
          <p className="text-neutral-mid dark:text-gray-400">
            No terms found matching your search. Try a different keyword.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(categorizedDefinitions).map(([category, defs]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4 dark:text-white">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {defs.map((def) => (
                  <Card
                    key={def.term}
                    className="dark:bg-zinc-900 border-0 shadow-sm"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">
                        {def.term}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-mid dark:text-gray-400">
                        {def.definition}
                      </p>
                    </CardContent>
                    {def.learnMoreUrl && (
                      <CardFooter>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary"
                          asChild
                        >
                          <a
                            href={def.learnMoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Learn more →
                          </a>
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlossaryPage;
