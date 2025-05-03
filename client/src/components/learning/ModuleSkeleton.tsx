import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const ModuleSkeleton = () => {
  return (
    <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="pb-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 pb-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </CardFooter>
    </Card>
  );
};

export const ModuleSkeletonList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {[...Array(6)].map((_, i) => (
        <ModuleSkeleton key={i} />
      ))}
    </div>
  );
};