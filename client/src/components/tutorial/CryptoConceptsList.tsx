import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCryptoConcepts } from '@/contexts/CryptoConceptsContext';
import { conceptData } from '../../data/crypto-concepts';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';

interface CryptoConceptsListProps {
  category?: string;
  limit?: number;
  showStatus?: boolean;
}

const CryptoConceptsList: React.FC<CryptoConceptsListProps> = ({ 
  category, 
  limit,
  showStatus = true
}) => {
  const { hasSeenConcept, showConcept } = useCryptoConcepts();
  
  // Get all concepts and convert to array
  const allConcepts = Object.values(conceptData);
  
  // Filter by category if specified
  const filteredConcepts = category 
    ? allConcepts.filter(concept => concept.category === category)
    : allConcepts;
    
  // Limit the number of concepts if specified
  const conceptsToDisplay = limit 
    ? filteredConcepts.slice(0, limit) 
    : filteredConcepts;
    
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {conceptsToDisplay.map(concept => (
        <Card key={concept.id} className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{concept.title}</CardTitle>
              {showStatus && (
                <Badge variant={hasSeenConcept(concept.id) ? "outline" : "secondary"}>
                  {hasSeenConcept(concept.id) ? (
                    <><Eye className="mr-1 h-3 w-3" /> Viewed</>
                  ) : (
                    <><EyeOff className="mr-1 h-3 w-3" /> New</>
                  )}
                </Badge>
              )}
            </div>
            {concept.category && (
              <CardDescription>
                <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {concept.category}
                </Badge>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pb-2 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {concept.definition}
            </p>
          </CardContent>
          <CardFooter className="pt-2">
            <div className="flex gap-2 w-full">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-grow"
                onClick={() => {
                  console.log("CryptoConceptsList: Showing concept:", concept.id);
                  showConcept(concept.id);
                }}
              >
                View Concept
              </Button>
              {concept.learnMoreUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-shrink-0"
                  asChild
                >
                  <a href={concept.learnMoreUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CryptoConceptsList;