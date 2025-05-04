import React from 'react';
import { useCryptoConcepts } from '@/contexts/CryptoConceptsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Book } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CryptoConceptsListProps {
  className?: string;
  showAllConcepts?: boolean; // Whether to show all concepts or just unseen ones
}

const CryptoConceptsList: React.FC<CryptoConceptsListProps> = ({
  className,
  showAllConcepts = false
}) => {
  const { concepts, showConcept, hasSeenConcept } = useCryptoConcepts();
  
  // Filter concepts based on whether they've been seen
  const filteredConcepts = showAllConcepts 
    ? concepts 
    : concepts.filter(concept => !hasSeenConcept(concept.id));
  
  if (filteredConcepts.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-xl">Crypto Concepts</CardTitle>
          <CardDescription>
            {showAllConcepts
              ? "No crypto concepts are available right now"
              : "You've seen all available crypto concepts!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Check className="h-12 w-12 text-primary mb-2" />
            <p className="text-muted-foreground">
              {showAllConcepts
                ? "Check back later for new crypto concepts"
                : "Browse all concepts to refresh your knowledge"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {showAllConcepts ? "All Crypto Concepts" : "New Crypto Concepts"}
        </h3>
        <Badge variant="outline" className="px-2 py-1">
          <Book className="h-3.5 w-3.5 mr-1" />
          {filteredConcepts.length} concept{filteredConcepts.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredConcepts.map((concept) => (
          <Card key={concept.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-primary">{concept.icon}</div>
                  <CardTitle className="text-base">{concept.title}</CardTitle>
                </div>
                {hasSeenConcept(concept.id) && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Viewed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{concept.description}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={() => showConcept(concept.id)}
              >
                Read More
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CryptoConceptsList;