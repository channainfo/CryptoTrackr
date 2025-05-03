// Learning module types
export type LearningCategory = 'basics' | 'trading' | 'defi' | 'security' | 'advanced';
export type LearningStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  content: string; // JSON string of content sections
  category: LearningCategory;
  difficulty: number;
  order: number;
  estimatedMinutes: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentSection {
  title: string;
  content: string;
  type: 'text' | 'video' | 'image' | 'interactive';
  // Additional properties can be added for different content types
}

export interface LearningQuiz {
  id: string;
  moduleId: string;
  question: string;
  options: string[]; // Array of option texts
  correctOption: number; // Index of the correct option
  explanation: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningProgress {
  id: string;
  userId: string;
  moduleId: string;
  status: LearningStatus;
  lastCompletedSection: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Crypto definition types for the glossary and tooltips
export interface CryptoDefinition {
  term: string;
  definition: string;
  category: string;
  shortDefinition?: string;
  learnMoreUrl?: string;
}

export interface CryptoDefinitionDictionary {
  [key: string]: CryptoDefinition;
}