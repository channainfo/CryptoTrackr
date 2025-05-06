import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Achievement } from '@shared/schema';
import { useUser } from '@/contexts/UserContext';

export const useAchievements = () => {
  const { toast } = useToast();
  const { user } = useUser();
  
  // Fetch achievements from the API
  const { 
    data: achievements = [], 
    isLoading,
    error,
    refetch 
  } = useQuery<Achievement[]>({ 
    queryKey: ['/api/achievements'],
    enabled: !!user, // Only fetch if user is authenticated
  });
  
  // Calculate achievements on server
  const calculateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/achievements/calculate', { method: 'POST' });
    },
    onSuccess: () => {
      // Invalidate and refetch achievements after calculation
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
      toast({
        title: 'Achievements updated',
        description: 'Your achievements have been recalculated based on your latest activity.',
      });
    },
    onError: (error) => {
      console.error('Error calculating achievements:', error);
      toast({
        title: 'Achievement update failed',
        description: 'Unable to update achievements at this time.',
        variant: 'destructive',
      });
    }
  });
  
  // Calculate achievements when explicitly requested
  const calculateAchievements = useCallback(() => {
    if (!user) return;
    calculateMutation.mutate();
  }, [user, calculateMutation]);
  
  // Mark achievement as earned
  const earnAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      return await apiRequest(`/api/achievements/${achievementId}/earn`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
    },
    onError: (error) => {
      console.error('Error marking achievement as earned:', error);
      toast({
        title: 'Action failed',
        description: 'Unable to update achievement status.',
        variant: 'destructive',
      });
    }
  });
  
  // Update achievement progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string, progress: number }) => {
      return await apiRequest(`/api/achievements/${id}/progress`, { 
        method: 'PATCH',
        data: { progress } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
    },
    onError: (error) => {
      console.error('Error updating achievement progress:', error);
      toast({
        title: 'Action failed',
        description: 'Unable to update achievement progress.',
        variant: 'destructive',
      });
    }
  });
  
  // Function to mark an achievement as earned
  const earnAchievement = useCallback((achievementId: string) => {
    if (!user) return;
    earnAchievementMutation.mutate(achievementId);
  }, [user, earnAchievementMutation]);
  
  // Function to update achievement progress
  const updateAchievementProgress = useCallback((achievementId: string, progress: number) => {
    if (!user) return;
    updateProgressMutation.mutate({ id: achievementId, progress });
  }, [user, updateProgressMutation]);
  
  // Initial calculation when user first logs in
  useEffect(() => {
    // This will trigger a calculation if the user is logged in and has no achievements yet
    if (user && achievements.length === 0 && !isLoading) {
      calculateAchievements();
    }
  }, [user, achievements.length, isLoading, calculateAchievements]);
  
  return { 
    achievements, 
    isLoading,
    error,
    calculateAchievements,
    earnAchievement, 
    updateAchievementProgress,
    calculating: calculateMutation.isPending 
  };
};

