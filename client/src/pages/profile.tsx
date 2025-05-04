import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Wallet {
  id: string;
  user_id: string;
  address: string;
  chain_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const ProfilePage = () => {
  const { user, isLoading: isUserLoading } = useUser();
  
  // Fetch user's wallets
  const {
    data: wallets = [],
    isLoading: isWalletsLoading,
  } = useQuery<Wallet[]>({
    queryKey: ['/api/auth/wallets'],
    enabled: !!user,
    retry: 1,
  });
  
  // Function to get initials from username
  const getInitials = (username: string) => {
    return username
      .split(/[\s_-]/)
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };
  
  // Generate a background color based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500'
    ];
    
    // Simple hash function to get consistent color for a username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Get a color from the array
    const colorIndex = Math.abs(hash % colors.length);
    return colors[colorIndex];
  };

  if (isUserLoading) {
    return (
      <div className="container max-w-4xl py-10 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-4 flex-1">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>User not found or not logged in.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Your personal information and connected wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className={`h-24 w-24 ${getAvatarColor(user.username)}`}>
              <AvatarFallback className="text-xl">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-4 flex-1">
              <h2 className="text-xl font-semibold">{user.username}</h2>
              
              {user.createdAt && (
                <div className="flex items-center gap-2 text-sm text-neutral-mid">
                  <Clock className="h-4 w-4" />
                  <span>Member since {format(new Date(user.createdAt), 'MMMM d, yyyy')}</span>
                </div>
              )}
              
              {user.walletAddress && (
                <div className="flex items-center gap-2 text-sm text-neutral-mid">
                  <Wallet className="h-4 w-4" />
                  <span>Primary wallet: {user.walletType || ''} ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Connected Wallets</CardTitle>
          <CardDescription>Wallets linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {isWalletsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : wallets.length > 0 ? (
            <div className="space-y-4">
              {wallets.map(wallet => (
                <div 
                  key={wallet.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-xs px-2 py-1 rounded-md bg-primary/10 text-primary uppercase font-medium`}>
                      {wallet.chain_type}
                    </div>
                    <div className="font-mono text-sm">
                      {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 6)}
                    </div>
                  </div>
                  
                  {wallet.is_default && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-800/30 dark:text-green-400">
                      Default
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-mid text-center py-6">
              No wallets connected yet. Go to settings to link wallets to your account.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;