import { apiRequest, queryClient } from "./queryClient";

/**
 * Logs out the current user by calling the logout API endpoint
 * and clearing all relevant data
 */
export async function logout() {
  try {
    // Call the logout endpoint
    await apiRequest('/api/auth/logout', {
      method: 'POST'
    });
    
    // Invalidate all queries to force refetching after login state changes
    queryClient.invalidateQueries();
    
    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if the server logout fails, redirect to login
    window.location.href = '/login';
  }
}