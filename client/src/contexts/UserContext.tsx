import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

// Define user type
export interface User {
  id: string;
  username: string;
  createdAt?: string;
  walletAddress?: string;
  walletType?: string;
  email?: string;
  name?: string;
  phone?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: false, // Don't retry on 401 errors to avoid unnecessary calls
    // When a 401 is received, immediately consider the user unauthenticated
    refetchOnWindowFocus: true, // Re-check auth when window regains focus
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  return (
    <UserContext.Provider value={{ user: user || null, isLoading, error: error as Error | null }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};