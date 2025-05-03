import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { quizzes, Quiz } from '@/data/quizData';
import QuizCard from '@/components/learning/QuizCard';

const LearningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>(quizzes);

  useEffect(() => {
    // Apply filters
    let filtered = [...quizzes];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(query) || 
        quiz.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (activeTab !== 'all') {
      filtered = filtered.filter(quiz => quiz.category === activeTab);
    }
    
    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(quiz => quiz.difficulty === difficultyFilter);
    }
    
    setFilteredQuizzes(filtered);
  }, [searchQuery, activeTab, difficultyFilter]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(quizzes.map(quiz => quiz.category)))];

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-10">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <GraduationCap className="mr-2 h-6 w-6" />
              Learning Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Test your knowledge and learn about cryptocurrency concepts
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                className="pl-8 w-full sm:w-[200px] lg:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[120px] lg:w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto py-2">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === 'all' 
                  ? (
                    <>
                      <BookOpen className="mr-1 h-4 w-4" />
                      All Quizzes
                    </>
                  )
                  : category
                }
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              {filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQuizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <GraduationCap className="h-12 w-12 mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No quizzes found</h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setDifficultyFilter('all');
                      setActiveTab('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default LearningPage;