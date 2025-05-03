// General education types
export interface CryptoDefinition {
  term: string;
  definition: string;
  category: string;
  related?: string[];
}

// Learning module types
export type LearningModuleStatus = 'not_started' | 'in_progress' | 'completed';
export type LearningCategory = 'basics' | 'trading' | 'defi' | 'security' | 'advanced';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  content: string;
  category: LearningCategory;
  difficulty: number;
  order: number;
  estimatedMinutes: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningQuiz {
  id: string;
  moduleId: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningProgress {
  id: string;
  userId: string;
  moduleId: string;
  status: LearningModuleStatus;
  lastCompletedSection?: number;
  quizScore?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningModuleWithQuizzes extends LearningModule {
  quizzes: LearningQuiz[];
}

export interface LearningStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  notStartedModules: number;
  completionPercentage: number;
  averageQuizScore: number;
}

// Quiz attempt tracking
export interface QuizAttempt {
  moduleId: string;
  answers: number[];
  score: number;
  completed: boolean;
  timestamp: string;
}

// Section types for modular content
export interface ContentSection {
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'code' | 'chart';
  mediaUrl?: string;
}

// Learning path
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: string[]; // Module IDs in sequence
  difficulty: number;
  estimatedHours: number;
  imageUrl?: string;
}