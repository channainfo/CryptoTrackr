import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing admin authentication
 * This keeps admin authentication state separate from regular user authentication
 */
export function useAdminAuth() {
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem('adminToken')
  );
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    const expiryString = localStorage.getItem('adminTokenExpiry');
    return expiryString ? parseInt(expiryString, 10) : null;
  });
  const { toast } = useToast();

  // Check if the admin token is valid (not expired)
  const isTokenValid = () => {
    if (!adminToken || !expiresAt) {
      console.log('Admin token validation failed - no token or expiry:', { adminToken: !!adminToken, expiresAt });
      return false;
    }
    
    const isValid = Date.now() < expiresAt;
    console.log('Admin token validation result:', { 
      isValid, 
      now: Date.now(), 
      expiresAt,
      timeRemaining: (expiresAt - Date.now()) / 1000 + ' seconds'
    });
    
    return isValid;
  };

  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: async () => {
      console.log('Attempting admin login');
      try {
        const response = await apiRequest({
          url: '/api/admin/login',
          method: 'POST',
        });
        console.log('Admin login response:', response);
        return response;
      } catch (error) {
        console.error('Admin login API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Admin login mutation success, data:', data);
      if (!data || !data.adminToken || !data.expiresIn) {
        console.error('Missing token data in admin login response:', data);
        toast({
          title: 'Admin Login Error',
          description: 'Invalid response from server',
          variant: 'destructive',
        });
        return;
      }
      
      const { adminToken, expiresIn } = data;
      const expiryTime = Date.now() + expiresIn * 1000;
      
      // Store admin token and expiry in localStorage and state
      localStorage.setItem('adminToken', adminToken);
      localStorage.setItem('adminTokenExpiry', expiryTime.toString());
      
      setAdminToken(adminToken);
      setExpiresAt(expiryTime);
      
      console.log('Admin token saved, expires in:', expiresIn, 'seconds');
      
      toast({
        title: 'Admin Access Granted',
        description: 'You now have admin privileges',
      });
    },
    onError: (error: any) => {
      console.error('Admin login error:', error);
      toast({
        title: 'Admin Login Failed',
        description: error.message || 'You do not have admin privileges',
        variant: 'destructive',
      });
    },
  });

  // Admin logout mutation
  const adminLogoutMutation = useMutation({
    mutationFn: async () => {
      // Only send logout request if we have a token
      if (adminToken) {
        await apiRequest({
          url: '/api/admin/logout',
          method: 'POST',
          headers: { Authorization: `AdminToken ${adminToken}` },
        });
      }
      return true;
    },
    onSuccess: () => {
      // Clear admin token from localStorage and state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminTokenExpiry');
      
      setAdminToken(null);
      setExpiresAt(null);
      
      toast({
        title: 'Admin Logout Successful',
        description: 'Admin session has ended',
      });
    },
    onError: (error: any) => {
      // Even if logout fails, clear local state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminTokenExpiry');
      
      setAdminToken(null);
      setExpiresAt(null);
      
      toast({
        title: 'Admin Logout Error',
        description: error.message || 'Error during admin logout',
        variant: 'destructive',
      });
    },
  });

  // Auth header getter for admin API requests
  const getAdminAuthHeader = (): Record<string, string> => {
    return isTokenValid() && adminToken ? { Authorization: `AdminToken ${adminToken}` } : {};
  };

  return {
    // Auth state
    isAdmin: isTokenValid(),
    adminToken: isTokenValid() ? adminToken : null,
    
    // Auth mutations
    adminLoginMutation,
    adminLogoutMutation,
    
    // Utility function for admin API calls
    getAdminAuthHeader,
  };
}