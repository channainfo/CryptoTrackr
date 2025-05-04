import React, { useState } from 'react';
import { Award, Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AchievementBadge, { Achievement } from './AchievementBadge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface AchievementGridProps {
  achievements: Achievement[];
  isLoading?: boolean;
  className?: string;
}

const AchievementGrid: React.FC<AchievementGridProps> = ({ 
  achievements,
  isLoading = false,
  className
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'progress'>('name');
  const { toast } = useToast();
  
  // Filter achievements based on search term and filter setting
  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = 
      search === '' || 
      achievement.title.toLowerCase().includes(search.toLowerCase()) ||
      achievement.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'earned' && achievement.earned) || 
      (filter === 'locked' && !achievement.earned);
    
    return matchesSearch && matchesFilter;
  });
  
  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title);
    }
    
    if (sortBy === 'recent') {
      if (!a.earnedDate && !b.earnedDate) return 0;
      if (!a.earnedDate) return 1;
      if (!b.earnedDate) return -1;
      return new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime();
    }
    
    if (sortBy === 'progress') {
      const aProgress = a.progress !== undefined ? a.progress / (a.maxProgress || 1) : (a.earned ? 1 : 0);
      const bProgress = b.progress !== undefined ? b.progress / (b.maxProgress || 1) : (b.earned ? 1 : 0);
      return bProgress - aProgress;
    }
    
    return 0;
  });
  
  // Group achievements for display
  const earnedAchievements = sortedAchievements.filter(a => a.earned);
  const inProgressAchievements = sortedAchievements.filter(a => !a.earned && a.progress !== undefined);
  const lockedAchievements = sortedAchievements.filter(a => !a.earned && a.progress === undefined);
  
  const earnedCount = earnedAchievements.length;
  const totalCount = achievements.length;
  const earnedPercentage = Math.round((earnedCount / totalCount) * 100);
  
  // Handle search clear
  const handleClearSearch = () => {
    setSearch('');
  };
  
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Investment Achievements
            </CardTitle>
            <CardDescription>
              Track your progress and earn badges for your investment milestones
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {earnedCount}/{totalCount} ({earnedPercentage}%)
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search achievements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1.5 h-7 w-7 rounded-full p-0"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-[120px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="earned">Earned</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {sortedAchievements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? (
                  <p>No achievements match your search.</p>
                ) : filter !== 'all' ? (
                  <p>No {filter} achievements found.</p>
                ) : (
                  <p>No achievements available.</p>
                )}
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="all">
                    All ({sortedAchievements.length})
                  </TabsTrigger>
                  <TabsTrigger value="earned">
                    Earned ({earnedAchievements.length})
                  </TabsTrigger>
                  <TabsTrigger value="in-progress">
                    In Progress ({inProgressAchievements.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {sortedAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex flex-col items-center">
                        <AchievementBadge 
                          achievement={achievement}
                          size="md"
                        />
                        <div className="mt-2 text-center">
                          <p className="text-sm font-medium truncate max-w-[100px]" title={achievement.title}>
                            {achievement.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="earned">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {earnedAchievements.length > 0 ? (
                      earnedAchievements.map((achievement) => (
                        <div key={achievement.id} className="flex flex-col items-center">
                          <AchievementBadge 
                            achievement={achievement}
                            size="md"
                          />
                          <div className="mt-2 text-center">
                            <p className="text-sm font-medium truncate max-w-[100px]" title={achievement.title}>
                              {achievement.title}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <p>No earned achievements yet. Keep investing to unlock badges!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="in-progress">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {inProgressAchievements.length > 0 ? (
                      inProgressAchievements.map((achievement) => (
                        <div key={achievement.id} className="flex flex-col items-center">
                          <AchievementBadge 
                            achievement={achievement}
                            size="md"
                          />
                          <div className="mt-2 text-center">
                            <p className="text-sm font-medium truncate max-w-[100px]" title={achievement.title}>
                              {achievement.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {achievement.progress}/{achievement.maxProgress}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <p>No achievements in progress.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementGrid;