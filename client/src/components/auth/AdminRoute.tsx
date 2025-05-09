import { useAuth } from "@/hooks/use-auth";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Route, Redirect, useLocation } from "wouter";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading: isUserLoading } = useAuth();
  const { isAdmin, adminLoginMutation } = useAdminAuth();
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isAttemptingAdminAuth, setIsAttemptingAdminAuth] = useState(false);
  const [location, setLocation] = useLocation();
  
  console.log("AdminRoute render state:", { 
    path, 
    currentPath: location,
    user: !!user, 
    isAdmin, 
    isUserLoading,
    isPromptOpen,
    isAttemptingAdminAuth
  });

  // Show admin auth prompt if user is logged in but not admin authenticated
  useEffect(() => {
    // This runs when we access an admin route
    if (location.startsWith(path) && user && !isAdmin && !isAttemptingAdminAuth) {
      console.log("Admin route detected, showing auth prompt");
      setIsPromptOpen(true);
    }
  }, [path, user, isAdmin, isAttemptingAdminAuth, location]);

  // Handle admin login attempt
  const handleAdminLoginAttempt = async () => {
    setIsAttemptingAdminAuth(true);
    try {
      console.log('Attempting admin login from AdminRoute component');
      await adminLoginMutation.mutateAsync();
      console.log('Admin login mutation completed, waiting for state update');
      
      // Don't close the dialog immediately - wait for the isAdmin state to update
      setTimeout(() => {
        console.log('Checking admin status after timeout:', { isAdmin: adminLoginMutation.isSuccess });
        setIsPromptOpen(false);
      }, 1000);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error in admin login attempt:', error);
      // Keep dialog open on error
    } finally {
      setTimeout(() => {
        setIsAttemptingAdminAuth(false);
      }, 500);
    }
  };

  // Loading state for user authentication
  if (isUserLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If not logged in as a regular user first
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // If logged in as user but not authenticated as admin
  if (!isAdmin) {
    // Only show dialog if user is logged in
    if (user) {
      return (
        <Route path={path}>
          {/* Admin authentication prompt */}
          <AlertDialog open={isPromptOpen} onOpenChange={(open) => {
            setIsPromptOpen(open);
            // Only redirect if dialog is being closed by user and not during auth attempt
            if (!open && !isAttemptingAdminAuth) {
              console.log('Dialog closed by user, redirecting to home');
              setLocation('/');
            }
          }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Admin Authentication Required</AlertDialogTitle>
              <AlertDialogDescription>
                This page requires admin privileges. Your admin status will be verified 
                against the database and you'll receive a temporary access token.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                // Will already redirect through onOpenChange
                setIsPromptOpen(false);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Admin authentication button clicked");
                  handleAdminLoginAttempt();
                }}
                disabled={adminLoginMutation.isPending || isAttemptingAdminAuth}
              >
                {(adminLoginMutation.isPending || isAttemptingAdminAuth) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Authenticate as Admin'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Content placeholder while auth dialog is shown */}
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Admin Authentication Required</h1>
          <p>Please authenticate as an administrator to access this page.</p>
        </div>
      </Route>
    );
    }
    // If not admin and dialog not shown, redirect to root
    return <Redirect to="/" />;
  }

  // User is authenticated and admin token is valid
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
