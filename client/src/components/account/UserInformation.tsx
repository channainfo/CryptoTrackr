import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type UserInfo = {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
};

export const UserInformation = () => {
  // Fetch user information
  const { data: userInfo, isLoading } = useQuery<UserInfo>({
    queryKey: ["/api/auth/me"],
    retry: 1,
  });

  // Format date if available
  const formattedDate = userInfo?.createdAt 
    ? format(new Date(userInfo.createdAt), "PPP") 
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
                {userInfo?.id || "Not available"}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-dark">Username</p>
              <p className="text-base">
                {userInfo?.username || "Not available"}
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