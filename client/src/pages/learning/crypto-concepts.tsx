import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CryptoConceptsList from "@/components/tutorial/CryptoConceptsList";
import CryptoConceptPopup from "@/components/tutorial/CryptoConceptPopup";
import { conceptData } from "../../data/crypto-concepts";
import { useCryptoConcepts } from "@/contexts/CryptoConceptsContext";

// Get unique categories from all concepts
const getCategories = () => {
  const categories = new Set<string>();
  Object.values(conceptData).forEach((concept) => {
    if (concept.category) {
      categories.add(concept.category);
    }
  });
  return ["All", ...Array.from(categories)];
};

const CryptoConceptsPage: React.FC = () => {
  const [category, setCategory] = useState("All");
  const { showConcept } = useCryptoConcepts();

  // Get all categories
  const categories = getCategories();

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <div>
        {/* Back button and title */}
        <div className="flex items-center mb-2">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/learning">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Learning
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Crypto Concepts</h1>
            <p className="text-muted-foreground mb-6">
              Explore key cryptocurrency concepts to enhance your understanding
              of the crypto world.
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Category Tabs */}
        <Tabs
          defaultValue="All"
          className="w-full mb-6"
          onValueChange={setCategory}
        >
          <div className="overflow-x-auto overflow-y-hidden pb-2 no-scrollbar">
            <TabsList className="mb-4 inline-flex min-w-max">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab content */}
          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-0">
              <CryptoConceptsList category={cat === "All" ? undefined : cat} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Popup for displaying concept details */}
      <CryptoConceptPopup />
    </div>
  );
};

export default CryptoConceptsPage;
