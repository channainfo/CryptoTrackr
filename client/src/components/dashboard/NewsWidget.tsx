import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { LucideInfo, Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function NewsWidget({ className }: { className?: string }) {
  const { data, isLoading, isError, error, refetch } = useNews();

  if (isError) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            <span>Crypto News</span>
          </CardTitle>
          <CardDescription>Latest news from the crypto world</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="text-destructive flex flex-col items-center gap-4">
            <LucideInfo className="h-10 w-10" />
            <p>Unable to load news. Please try again later.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          <span>Crypto News</span>
        </CardTitle>
        <CardDescription>
          {isLoading 
            ? "Loading personalized news..."
            : "Personalized news based on your portfolio"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
            ))}
          </>
        ) : (
          // News articles
          <>
            {data?.articles.map((article, index) => (
              <div key={index}>
                <div className="space-y-2">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h3 className="font-semibold hover:text-primary transition-colors flex items-start">
                      <span>{article.title}</span>
                      <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                  </a>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                  </div>
                  {article.relevance && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs bg-primary/5">
                        {article.relevance}
                      </Badge>
                    </div>
                  )}
                </div>
                {index < data.articles.length - 1 && <Separator className="my-3" />}
              </div>
            ))}
          </>
        )}
      </CardContent>
      {!isLoading && data?.portfolioInsight && (
        <>
          <Separator />
          <CardFooter className="pt-4">
            <div className="text-sm italic text-muted-foreground">
              <span className="font-semibold text-primary">Insight:</span> {data.portfolioInsight}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}