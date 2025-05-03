import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  LearningModule, 
  LearningProgress, 
  LearningQuiz 
} from "@/types/education";

// Remove type parameters from apiRequest calls since we have compatibility issues

// Fetch all learning modules
export function useLearningModules() {
  return useQuery({
    queryKey: ['/api/learning/modules'],
    queryFn: async () => {
      const data = await apiRequest('/api/learning/modules');
      return data as LearningModule[];
    }
  });
}

// Fetch learning modules by category
export function useLearningModulesByCategory(category: string) {
  return useQuery({
    queryKey: ['/api/learning/modules/category', category],
    queryFn: async () => {
      if (!category) return [];
      const data = await apiRequest(`/api/learning/modules/category/${category}`);
      return data as LearningModule[];
    },
    enabled: Boolean(category)
  });
}

// Fetch learning modules by difficulty
export function useLearningModulesByDifficulty(difficulty: number) {
  return useQuery({
    queryKey: ['/api/learning/modules/difficulty', difficulty],
    queryFn: async () => {
      const data = await apiRequest(`/api/learning/modules/difficulty/${difficulty}`);
      return data as LearningModule[];
    },
    enabled: difficulty !== undefined
  });
}

// Fetch a single learning module with its quizzes and user progress
export function useLearningModuleDetails(moduleId: string) {
  return useQuery({
    queryKey: ['/api/learning/modules', moduleId],
    queryFn: async () => {
      const data = await apiRequest(`/api/learning/modules/${moduleId}/details`);
      return data as {
        module: LearningModule;
        quizzes: LearningQuiz[];
        progress?: LearningProgress;
      };
    },
    enabled: Boolean(moduleId)
  });
}

// Fetch quiz details (includes associated module)
export function useQuizDetails(quizId: string) {
  return useQuery({
    queryKey: ['/api/learning/quizzes', quizId],
    queryFn: async () => {
      const data = await apiRequest(`/api/learning/quizzes/${quizId}`);
      return data as {
        quiz: LearningQuiz;
        module: LearningModule;
      };
    },
    enabled: Boolean(quizId)
  });
}

// Fetch user's learning progress for all modules
export function useUserLearningProgress(userId: string) {
  return useQuery({
    queryKey: ['/api/learning/progress', userId],
    queryFn: async () => {
      const data = await apiRequest(`/api/learning/progress/${userId}`);
      return data as LearningProgress[];
    },
    enabled: Boolean(userId)
  });
}

// Fetch user's learning statistics
export function useUserLearningStats(userId: string) {
  return useQuery({
    queryKey: ['/api/learning/stats', userId],
    queryFn: async () => {
      const data = await apiRequest(`/api/learning/stats/${userId}`);
      return data as {
        completedModules: number;
        inProgressModules: number;
        notStartedModules: number;
        totalModules: number;
        completionPercentage: number;
      };
    },
    enabled: Boolean(userId)
  });
}

// Fetch next recommended module for the user
export function useNextRecommendedModule(userId: string) {
  return useQuery({
    queryKey: ['/api/learning/recommended', userId],
    queryFn: async () => {
      const data = await apiRequest(`/api/learning/recommended/${userId}`);
      return data as LearningModule;
    },
    enabled: Boolean(userId)
  });
}

// Start a learning module
export function useStartModule() {
  return useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      return apiRequest('/api/learning/modules/start', {
        method: 'POST',
        data: { userId, moduleId }
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/stats', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules', variables.moduleId] });
    }
  });
}

// Update section progress in a module
export function useUpdateSectionProgress() {
  return useMutation({
    mutationFn: async ({ 
      userId, 
      moduleId, 
      section 
    }: { 
      userId: string; 
      moduleId: string; 
      section: number 
    }) => {
      return apiRequest('/api/learning/modules/progress', {
        method: 'POST',
        data: { userId, moduleId, section }
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules', variables.moduleId] });
    }
  });
}

// Complete a learning module
export function useCompleteModule() {
  return useMutation({
    mutationFn: async ({ userId, moduleId }: { userId: string; moduleId: string }) => {
      return apiRequest('/api/learning/modules/complete', {
        method: 'POST',
        data: { userId, moduleId }
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/stats', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/modules', variables.moduleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/recommended', variables.userId] });
    }
  });
}

// Submit a quiz answer
export function useSubmitQuiz() {
  return useMutation({
    mutationFn: async ({ 
      userId, 
      quizId, 
      isCorrect 
    }: { 
      userId: string; 
      quizId: string; 
      isCorrect: boolean 
    }) => {
      return apiRequest('/api/learning/quizzes/submit', {
        method: 'POST',
        data: { userId, quizId, isCorrect }
      });
    },
    onSuccess: () => {
      // No need to invalidate any queries as quiz submissions don't affect other data
    }
  });
}