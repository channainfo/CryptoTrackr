import React from 'react';
import { Route, Redirect, useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

/**
 * A wrapper for Route that redirects to the login page if the user is not authenticated
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  path, 
  component: Component 
}) => {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {() => {
        if (!user) {
          // Redirect to login page and store the intended destination
          setLocation('/login');
          return null;
        }
        
        // User is authenticated, render the component
        return <Component />;
      }}
    </Route>
  );
};

export default ProtectedRoute;