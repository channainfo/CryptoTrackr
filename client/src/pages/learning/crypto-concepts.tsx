import React from 'react';
import { useCryptoConcepts } from '@/contexts/CryptoConceptsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, Check, Lightbulb, BookOpen } from 'lucide-react';
import CryptoConceptsList from '@/components/tutorial/CryptoConceptsList';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

const CryptoConceptsPage: React.FC = () => {
  const { concepts, hasSeenConcept } = useCryptoConcepts();
  
  // Calculate stats
  const totalConcepts = concepts.length;
  const seenConcepts = concepts.filter(concept => hasSeenConcept(concept.id)).length;
  const unseenConcepts = totalConcepts - seenConcepts;
  const completionPercentage = totalConcepts > 0 
    ? Math.round((seenConcepts / totalConcepts) * 100) 
    : 0;
  
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <Breadcrumbs 
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Learning', href: '/learning' },
          { label: 'Crypto Concepts' }
        ]}
      />
      
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Crypto Concepts</h2>
          <p className="text-muted-foreground mt-1">
            Learn essential cryptocurrency terminology and concepts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-sm">
            <Book className="h-5 w-5 mr-2 text-primary" />
            <span className="font-medium">{seenConcepts}</span>
            <span className="text-muted-foreground ml-1">/{totalConcepts} concepts learned</span>
          </div>
        </div>
      </div>
      
      {/* Concepts Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Total Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalConcepts}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Cryptocurrency terms and concepts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Concepts Learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{seenConcepts}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {completionPercentage}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              New Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unseenConcepts}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Concepts waiting to be discovered
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-blue-100 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Learning Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Crypto concepts will appear automatically as you navigate the app. Click on them to learn more!
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Concepts List Tabs */}
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            New Concepts
            {unseenConcepts > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                {unseenConcepts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            All Concepts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="new">
          <CryptoConceptsList showAllConcepts={false} />
        </TabsContent>
        
        <TabsContent value="all">
          <CryptoConceptsList showAllConcepts={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CryptoConceptsPage;