import React, { useEffect } from 'react';
import { Route, useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

/**
 * A wrapper for Route that redirects to the login page if the user is not authenticated
 * Uses an early redirect pattern to prevent rendering protected content
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  path, 
  component: Component 
}) => {
  const { user, isLoading } = useUser();
  const [location, setLocation] = useLocation();
  
  // Effect to handle authentication check and redirection
  // This will run as soon as authentication status is known
  useEffect(() => {
    if (!isLoading && !user && location !== '/login') {
      // Redirect to login page immediately if not authenticated
      setLocation('/login');
    }
  }, [user, isLoading, location, setLocation]);
  
  // Only render the route if actually on this path
  return (
    <Route path={path}>
      {() => {
        // Show loading state while checking auth
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        // Don't render anything if not authenticated - the effect will handle redirection
        if (!user) {
          return null;
        }
        
        // User is authenticated, render the component
        return <Component />;
      }}
    </Route>
  );
};

export default ProtectedRoute;