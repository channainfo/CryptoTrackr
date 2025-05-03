import { eq, desc, sql, and } from "drizzle-orm";
import { db } from "../db";
import {
  learningModules,
  learningQuizzes,
  userLearningProgress,
  LearningModule,
  InsertLearningModule,
  LearningQuiz,
  InsertLearningQuiz,
  UserLearningProgress,
  InsertUserLearningProgress,
  learningModuleStatusEnum
} from "@shared/schema";

/**
 * Model for learning modules
 */
export class LearningModuleModel {
  /**
   * Find a learning module by ID
   */
  static async findById(id: string): Promise<LearningModule | undefined> {
    const [module] = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, id));
    
    return module;
  }

  /**
   * Find a learning module with quizzes by ID
   */
  static async findByIdWithQuizzes(id: string) {
    const module = await this.findById(id);
    if (!module) return undefined;

    const quizzes = await db
      .select()
      .from(learningQuizzes)
      .where(eq(learningQuizzes.moduleId, id))
      .orderBy(learningQuizzes.order);

    return {
      ...module,
      quizzes
    };
  }

  /**
   * Find all learning modules
   */
  static async findAll(): Promise<LearningModule[]> {
    return db
      .select()
      .from(learningModules)
      .orderBy(learningModules.order);
  }

  /**
   * Find all learning modules by category
   */
  static async findByCategory(category: string): Promise<LearningModule[]> {
    return db
      .select()
      .from(learningModules)
      .where(eq(learningModules.category, category))
      .orderBy(learningModules.order);
  }

  /**
   * Find all learning modules by difficulty level
   */
  static async findByDifficulty(difficulty: number): Promise<LearningModule[]> {
    return db
      .select()
      .from(learningModules)
      .where(eq(learningModules.difficulty, difficulty))
      .orderBy(learningModules.order);
  }

  /**
   * Create a new learning module
   */
  static async create(data: InsertLearningModule): Promise<LearningModule> {
    const [module] = await db
      .insert(learningModules)
      .values(data)
      .returning();
    
    return module;
  }

  /**
   * Update a learning module
   */
  static async update(
    id: string, 
    data: Partial<Omit<LearningModule, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<LearningModule | undefined> {
    const [module] = await db
      .update(learningModules)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(learningModules.id, id))
      .returning();
    
    return module;
  }

  /**
   * Delete a learning module
   */
  static async delete(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(learningModules)
      .where(eq(learningModules.id, id))
      .returning();
    
    return !!deleted;
  }

  /**
   * Find or create a quiz for a module
   */
  static async createQuiz(data: InsertLearningQuiz): Promise<LearningQuiz> {
    const [quiz] = await db
      .insert(learningQuizzes)
      .values(data)
      .returning();
    
    return quiz;
  }

  /**
   * Update a quiz
   */
  static async updateQuiz(
    id: string,
    data: Partial<Omit<LearningQuiz, 'id' | 'moduleId' | 'createdAt' | 'updatedAt'>>
  ): Promise<LearningQuiz | undefined> {
    const [quiz] = await db
      .update(learningQuizzes)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(learningQuizzes.id, id))
      .returning();
    
    return quiz;
  }

  /**
   * Delete a quiz
   */
  static async deleteQuiz(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(learningQuizzes)
      .where(eq(learningQuizzes.id, id))
      .returning();
    
    return !!deleted;
  }

  /**
   * Get user progress for a module
   */
  static async getUserProgress(userId: string, moduleId: string): Promise<UserLearningProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userLearningProgress)
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.moduleId, moduleId)
        )
      );
    
    return progress;
  }

  /**
   * Get all user progress
   */
  static async getAllUserProgress(userId: string): Promise<UserLearningProgress[]> {
    return db
      .select()
      .from(userLearningProgress)
      .where(eq(userLearningProgress.userId, userId));
  }

  /**
   * Create or update user progress
   */
  static async recordUserProgress(
    data: InsertUserLearningProgress
  ): Promise<UserLearningProgress> {
    // Check if progress already exists
    const existingProgress = await this.getUserProgress(data.userId, data.moduleId);
    
    if (existingProgress) {
      // Update existing progress
      const [updated] = await db
        .update(userLearningProgress)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userLearningProgress.userId, data.userId),
            eq(userLearningProgress.moduleId, data.moduleId)
          )
        )
        .returning();
      
      return updated;
    } else {
      // Create new progress
      const [progress] = await db
        .insert(userLearningProgress)
        .values(data)
        .returning();
      
      return progress;
    }
  }

  /**
   * Start a module
   */
  static async startModule(userId: string, moduleId: string): Promise<UserLearningProgress> {
    return this.recordUserProgress({
      userId,
      moduleId,
      status: 'in_progress',
      startedAt: new Date(),
      lastCompletedSection: 0
    });
  }

  /**
   * Complete a module
   */
  static async completeModule(
    userId: string, 
    moduleId: string, 
    quizScore?: number
  ): Promise<UserLearningProgress> {
    return this.recordUserProgress({
      userId,
      moduleId,
      status: 'completed',
      completedAt: new Date(),
      quizScore
    });
  }

  /**
   * Update section progress
   */
  static async updateSectionProgress(
    userId: string,
    moduleId: string,
    sectionNumber: number
  ): Promise<UserLearningProgress> {
    return this.recordUserProgress({
      userId,
      moduleId,
      lastCompletedSection: sectionNumber,
      status: 'in_progress'
    });
  }

  /**
   * Get user learning stats
   */
  static async getUserLearningStats(userId: string) {
    const allModules = await this.findAll();
    const userProgress = await this.getAllUserProgress(userId);
    
    const totalModules = allModules.length;
    const completedModules = userProgress.filter(p => p.status === 'completed').length;
    const inProgressModules = userProgress.filter(p => p.status === 'in_progress').length;
    
    const averageScore = userProgress
      .filter(p => p.quizScore !== null && p.quizScore !== undefined)
      .reduce((sum, p) => sum + (p.quizScore || 0), 0) / 
      (userProgress.filter(p => p.quizScore !== null && p.quizScore !== undefined).length || 1);
    
    return {
      totalModules,
      completedModules,
      inProgressModules,
      notStartedModules: totalModules - completedModules - inProgressModules,
      completionPercentage: Math.round((completedModules / totalModules) * 100),
      averageQuizScore: Math.round(averageScore)
    };
  }

  /**
   * Find next recommended module for user
   */
  static async getNextRecommendedModule(userId: string): Promise<LearningModule | undefined> {
    const userProgress = await this.getAllUserProgress(userId);
    
    // Get modules that are not completed
    const completedModuleIds = userProgress
      .filter(p => p.status === 'completed')
      .map(p => p.moduleId);
    
    const inProgressModuleIds = userProgress
      .filter(p => p.status === 'in_progress')
      .map(p => p.moduleId);
    
    // First, check if there are any in-progress modules
    if (inProgressModuleIds.length > 0) {
      const [firstInProgressModule] = await db
        .select()
        .from(learningModules)
        .where(eq(learningModules.id, inProgressModuleIds[0]))
        .limit(1);
      
      if (firstInProgressModule) {
        return firstInProgressModule;
      }
    }
    
    // If not, find the first not-started module
    const notStartedModule = await db
      .select()
      .from(learningModules)
      .where(
        sql`${learningModules.id} NOT IN (${completedModuleIds.concat(inProgressModuleIds).join(', ')})`
      )
      .orderBy(learningModules.order)
      .limit(1);
    
    return notStartedModule[0];
  }
}