import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { 
  LearningModule, 
  LearningQuiz, 
  LearningProgress, 
  LearningStats,
  LearningModuleWithQuizzes 
} from "@/types/education";

// Get all learning modules
export function useLearningModules() {
  return useQuery({
    queryKey: ['/api/learning/modules'],
    refetchOnWindowFocus: false
  });
}

// Get learning modules by category
export function useLearningModulesByCategory(category: string) {
  return useQuery({
    queryKey: ['/api/learning/modules/category', category],
    queryFn: () => apiRequest(`/api/learning/modules/category/${category}`),
    refetchOnWindowFocus: false,
    enabled: !!category
  });
}

// Get a specific learning module
export function useLearningModule(moduleId: string) {
  return useQuery<LearningModule>({
    queryKey: ['/api/learning/modules', moduleId],
    queryFn: () => apiRequest(`/api/learning/modules/${moduleId}`),
    refetchOnWindowFocus: false,
    enabled: !!moduleId
  });
}

// Get a learning module with quizzes
export function useLearningModuleWithQuizzes(moduleId: string) {
  return useQuery<LearningModuleWithQuizzes>({
    queryKey: ['/api/learning/modules', moduleId, 'with-quizzes'],
    queryFn: () => apiRequest(`/api/learning/modules/${moduleId}/with-quizzes`),
    refetchOnWindowFocus: false,
    enabled: !!moduleId
  });
}

// Get user progress for all modules
export function useUserLearningProgress(userId: string) {
  return useQuery<LearningProgress[]>({
    queryKey: ['/api/learning/progress', userId],
    queryFn: () => apiRequest(`/api/learning/progress/${userId}`),
    refetchOnWindowFocus: false,
    enabled: !!userId
  });
}

// Get user progress for a specific module
export function useUserModuleProgress(userId: string, moduleId: string) {
  return useQuery<LearningProgress>({
    queryKey: ['/api/learning/progress', userId, moduleId],
    queryFn: () => apiRequest(`/api/learning/progress/${userId}/${moduleId}`),
    refetchOnWindowFocus: false,
    enabled: !!userId && !!moduleId
  });
}

// Get user learning stats
export function useUserLearningStats(userId: string) {
  return useQuery<LearningStats>({
    queryKey: ['/api/learning/stats', userId],
    queryFn: () => apiRequest(`/api/learning/stats/${userId}`),
    refetchOnWindowFocus: false,
    enabled: !!userId
  });
}

// Get next recommended module
export function useNextRecommendedModule(userId: string) {
  return useQuery<LearningModule>({
    queryKey: ['/api/learning/recommend', userId],
    queryFn: () => apiRequest(`/api/learning/recommend/${userId}`),
    refetchOnWindowFocus: false,
    enabled: !!userId
  });
}

// Start a module
export function useStartModule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, moduleId }: { userId: string; moduleId: string }) => 
      apiRequest(`/api/learning/progress/${userId}/${moduleId}/start`, { 
        method: 'POST' 
      }),
    onSuccess: (_, variables) => {
      const { userId, moduleId } = variables;
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', userId, moduleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/recommend', userId] });
    }
  });
}

// Complete a module
export function useCompleteModule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, moduleId, quizScore }: { userId: string; moduleId: string; quizScore?: number }) => 
      apiRequest(`/api/learning/progress/${userId}/${moduleId}/complete`, { 
        method: 'POST',
        body: JSON.stringify({ quizScore })
      }),
    onSuccess: (_, variables) => {
      const { userId, moduleId } = variables;
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', userId, moduleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/stats', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/recommend', userId] });
    }
  });
}

// Update section progress
export function useUpdateSectionProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, moduleId, sectionNumber }: { userId: string; moduleId: string; sectionNumber: number }) => 
      apiRequest(`/api/learning/progress/${userId}/${moduleId}/section/${sectionNumber}`, { 
        method: 'POST' 
      }),
    onSuccess: (_, variables) => {
      const { userId, moduleId } = variables;
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', userId, moduleId] });
    }
  });
}

// Create a learning module (admin functionality)
export function useCreateLearningModule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (moduleData: Partial<LearningModule>) => 
      apiRequest('/api/learning/modules', { 
        method: 'POST',
        body: JSON.stringify(moduleData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules'] });
    }
  });
}

// Update a learning module (admin functionality)
export function useUpdateLearningModule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: Partial<LearningModule> }) => 
      apiRequest(`/api/learning/modules/${moduleId}`, { 
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: (_, variables) => {
      const { moduleId } = variables;
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules', moduleId, 'with-quizzes'] });
    }
  });
}

// Create a quiz (admin functionality)
export function useCreateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ moduleId, quizData }: { moduleId: string; quizData: Partial<LearningQuiz> }) => 
      apiRequest(`/api/learning/modules/${moduleId}/quizzes`, { 
        method: 'POST',
        body: JSON.stringify(quizData)
      }),
    onSuccess: (_, variables) => {
      const { moduleId } = variables;
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules', moduleId, 'with-quizzes'] });
    }
  });
}

// Update a quiz (admin functionality)
export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ quizId, moduleId, data }: { quizId: string; moduleId: string; data: Partial<LearningQuiz> }) => 
      apiRequest(`/api/learning/quizzes/${quizId}`, { 
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: (_, variables) => {
      const { moduleId } = variables;
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules', moduleId, 'with-quizzes'] });
    }
  });
}