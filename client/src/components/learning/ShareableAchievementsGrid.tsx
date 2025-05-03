import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon
} from 'react-share';
import { Award, Trophy, BookOpen, Share2 } from 'lucide-react';
import type { LearningModule, LearningProgress } from '@/types/education';
import { cn } from '@/lib/utils';
import { generateAchievements } from '@/lib/achievements';
import { useToast } from '@/hooks/use-toast';

interface ShareableAchievementsGridProps {
  modules: LearningModule[];
  progress: LearningProgress[] | undefined;
  className?: string;
}

export const ShareableAchievementsGrid: React.FC<ShareableAchievementsGridProps> = ({
  modules,
  progress,
  className
}) => {
  const { toast } = useToast();
  
  // Generate achievements based on modules and progress
  const achievements = generateAchievements(modules, progress);
  const earnedAchievements = achievements.filter(a => a.completed);
  const hasAchievements = earnedAchievements.length > 0;
  
  // For sharing
  const shareUrl = window.location.origin + '/learning';
  const shareTitle = "Check out my crypto learning achievements on Trailer!";
  const shareText = "I'm learning about cryptocurrency on Trailer. Join me and improve your crypto knowledge!";
  
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="mr-2 w-5 h-5 text-amber-500" />
            <span>Share Your Progress</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {earnedAchievements.length} achievements
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {hasAchievements ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Learning Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your crypto learning journey
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {earnedAchievements.slice(0, 3).map(achievement => {
                  const Icon = achievement.icon;
                  return (
                    <div key={achievement.id} className="inline-flex items-center bg-white dark:bg-gray-800 px-3 py-1 rounded-full border text-sm">
                      <Icon className="w-4 h-4 mr-2 text-indigo-500" />
                      <span>{achievement.title}</span>
                    </div>
                  );
                })}
                {earnedAchievements.length > 3 && (
                  <div className="inline-flex items-center bg-white dark:bg-gray-800 px-3 py-1 rounded-full border text-sm">
                    <span>+{earnedAchievements.length - 3} more</span>
                  </div>
                )}
              </div>
              
              <div className="text-center font-semibold mb-4">
                Share on social media
              </div>
              
              <div className="flex justify-center gap-4">
                <TwitterShareButton url={shareUrl} title={shareText}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <TwitterIcon size={18} round />
                    <span>Twitter</span>
                  </Button>
                </TwitterShareButton>
                
                <FacebookShareButton url={shareUrl}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <FacebookIcon size={18} round />
                    <span>Facebook</span>
                  </Button>
                </FacebookShareButton>
                
                <LinkedinShareButton url={shareUrl} title={shareTitle}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <LinkedinIcon size={18} round />
                    <span>LinkedIn</span>
                  </Button>
                </LinkedinShareButton>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {earnedAchievements.map(achievement => {
                const Icon = achievement.icon;
                
                // Determine background gradient based on achievement type
                let bgGradient = "from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50";
                let iconGradient = "from-indigo-500 to-purple-500";
                
                if (achievement.id.includes('basics')) {
                  bgGradient = "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20";
                  iconGradient = "from-blue-500 to-indigo-500";
                } else if (achievement.id.includes('trading')) {
                  bgGradient = "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20";
                  iconGradient = "from-green-500 to-emerald-500";
                } else if (achievement.id.includes('defi')) {
                  bgGradient = "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20";
                  iconGradient = "from-purple-500 to-violet-500";
                } else if (achievement.id.includes('security')) {
                  bgGradient = "from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20";
                  iconGradient = "from-red-500 to-orange-500";
                } else if (achievement.id.includes('advanced')) {
                  bgGradient = "from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20";
                  iconGradient = "from-amber-500 to-yellow-500";
                } else if (achievement.id === 'crypto_master') {
                  bgGradient = "from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20";
                  iconGradient = "from-indigo-600 via-purple-600 to-pink-600";
                }
                
                return (
                  <div key={achievement.id} 
                    className={`flex p-3 border rounded-lg items-center gap-3 bg-gradient-to-r ${bgGradient} hover:shadow-md transition-all`}>
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${iconGradient} flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-sm truncate">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                    </div>
                    <div className="relative flex-shrink-0">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8" 
                        onClick={(e) => {
                          // Open a small popup menu for sharing this specific achievement
                          e.stopPropagation();
                          // For now we'll just copy the URL to clipboard with achievement ID
                          const shareUrl = `${window.location.origin}/learning?achievement=${achievement.id}`;
                          navigator.clipboard.writeText(shareUrl)
                            .then(() => {
                              alert('Link copied to clipboard!');
                            })
                            .catch(err => {
                              console.error('Could not copy text: ', err);
                            });
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No Achievements Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete learning modules to earn achievements that you can share with others.
            </p>
            <Button variant="outline" asChild>
              <a href="/learning">Start Learning</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShareableAchievementsGrid;