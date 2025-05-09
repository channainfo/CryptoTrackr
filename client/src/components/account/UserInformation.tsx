import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export const UserInformation = () => {
  // Get user information from auth context
  const { user, isLoading } = useAuth();

  // Format date if available
  const formattedDate = user?.createdAt 
    ? format(new Date(user.createdAt), "PPP") 
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Information</CardTitle>
        <CardDescription>
          Account details that may be needed when contacting support
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-60" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-60" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-60" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-dark">User ID</p>
              <p className="text-base font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                {user?.id || "Not available"}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-dark">Username</p>
              <p className="text-base">
                {user?.username || "Not available"}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-dark">Account Created</p>
              <p className="text-base">
                {formattedDate || "Not available"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};