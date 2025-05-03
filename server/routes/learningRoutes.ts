import { Router } from "express";
import { db } from "../db";
import { 
  learningModules, 
  learningQuizzes, 
  userLearningProgress,
  learningModuleStatusEnum
} from "@shared/schema";
import { eq, and, inArray, desc, count, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Get all learning modules
router.get("/modules", async (req, res) => {
  try {
    const modules = await db.select().from(learningModules).orderBy(learningModules.order);
    res.json(modules);
  } catch (error) {
    console.error("Error fetching learning modules:", error);
    res.status(500).json({ message: "Failed to fetch learning modules" });
  }
});

// Get learning modules by category
router.get("/modules/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const modules = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.category, category as any))
      .orderBy(learningModules.order);
    
    res.json(modules);
  } catch (error) {
    console.error("Error fetching learning modules by category:", error);
    res.status(500).json({ message: "Failed to fetch learning modules" });
  }
});

// Get learning modules by difficulty
router.get("/modules/difficulty/:difficulty", async (req, res) => {
  try {
    const difficulty = parseInt(req.params.difficulty);
    const modules = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.difficulty, difficulty))
      .orderBy(learningModules.order);
    
    res.json(modules);
  } catch (error) {
    console.error("Error fetching learning modules by difficulty:", error);
    res.status(500).json({ message: "Failed to fetch learning modules" });
  }
});

// Get a single learning module with quizzes and user progress
router.get("/modules/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string || "demo";
    
    // Get the module
    const [module] = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, id));
    
    if (!module) {
      return res.status(404).json({ message: "Learning module not found" });
    }
    
    // Get the quizzes
    const quizzes = await db
      .select()
      .from(learningQuizzes)
      .where(eq(learningQuizzes.moduleId, id))
      .orderBy(learningQuizzes.order);
    
    // For demo user, always return null for progress
    let progress = null;
    
    // Only query the database for non-demo users
    if (userId !== 'demo') {
      const [userProgress] = await db
        .select()
        .from(userLearningProgress)
        .where(
          and(
            eq(userLearningProgress.userId, userId),
            eq(userLearningProgress.moduleId, id)
          )
        );
      
      if (userProgress) {
        progress = userProgress;
      }
    }
    
    res.json({
      module,
      quizzes,
      progress
    });
  } catch (error) {
    console.error("Error fetching learning module details:", error);
    res.status(500).json({ message: "Failed to fetch learning module details" });
  }
});

// Get a quiz with associated module
router.get("/quizzes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the quiz
    const [quiz] = await db
      .select()
      .from(learningQuizzes)
      .where(eq(learningQuizzes.id, id));
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    // Get the associated module
    const [module] = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, quiz.moduleId));
    
    res.json({
      quiz,
      module
    });
  } catch (error) {
    console.error("Error fetching quiz details:", error);
    res.status(500).json({ message: "Failed to fetch quiz details" });
  }
});

// Get user learning progress
router.get("/progress/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Special handling for demo user - return empty array to prevent UUID errors
    if (userId === 'demo') {
      return res.json([]);
    }
    
    const progress = await db
      .select()
      .from(userLearningProgress)
      .where(eq(userLearningProgress.userId, userId));
    
    res.json(progress);
  } catch (error) {
    console.error("Error fetching user learning progress:", error);
    res.status(500).json({ message: "Failed to fetch user learning progress" });
  }
});

// Get user learning stats
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Special handling for demo user - return default stats
    if (userId === 'demo') {
      // Count all modules
      const totalModulesResult = await db
        .select({ count: count() })
        .from(learningModules);
      
      const totalModules = totalModulesResult[0]?.count || 0;
      
      return res.json({
        completedModules: 0,
        inProgressModules: 0,
        notStartedModules: totalModules,
        totalModules,
        completionPercentage: 0
      });
    }
    
    // Get counts of each status type
    const completedModulesResult = await db
      .select({ count: count() })
      .from(userLearningProgress)
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.status, "completed")
        )
      );
    
    const inProgressModulesResult = await db
      .select({ count: count() })
      .from(userLearningProgress)
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.status, "in_progress")
        )
      );
    
    // Count all modules
    const totalModulesResult = await db
      .select({ count: count() })
      .from(learningModules);
    
    const completedModules = completedModulesResult[0]?.count || 0;
    const inProgressModules = inProgressModulesResult[0]?.count || 0;
    const totalModules = totalModulesResult[0]?.count || 0;
    const notStartedModules = totalModules - (completedModules + inProgressModules);
    
    const completionPercentage = totalModules > 0 
      ? Math.round((completedModules / totalModules) * 100) 
      : 0;
    
    res.json({
      completedModules,
      inProgressModules,
      notStartedModules,
      totalModules,
      completionPercentage
    });
  } catch (error) {
    console.error("Error fetching user learning stats:", error);
    res.status(500).json({ message: "Failed to fetch user learning stats" });
  }
});

// Get next recommended module with AI-powered personalization
router.get("/recommended/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Dynamic import to avoid circular dependencies
    const { LearningModuleModel } = await import("../models/LearningModuleModel");
    
    // Use the AI-powered recommendation engine
    const recommendation = await LearningModuleModel.getNextRecommendedModule(userId);
    
    // If we couldn't get a recommendation or if there's no module, handle gracefully
    if (!recommendation || !recommendation.module) {
      // Fallback to first module by order if AI recommendation fails
      const [firstModule] = await db
        .select()
        .from(learningModules)
        .orderBy(learningModules.order);
      
      return res.json({
        ...firstModule,
        explanation: "Start with the basics and build a solid foundation."
      });
    }
    
    // Return module with explanation from AI
    res.json({
      ...recommendation.module,
      explanation: recommendation.explanation
    });
  } catch (error) {
    console.error("Error fetching AI-recommended module:", error);
    
    // Fallback to basic recommendation if AI fails
    try {
      // Just get first module by order as fallback
      const [firstModule] = await db
        .select()
        .from(learningModules)
        .orderBy(learningModules.order);
      
      return res.json({
        ...firstModule,
        explanation: "Let's start with this beginner-friendly module."
      });
    } catch (fallbackError) {
      console.error("Error in fallback recommendation:", fallbackError);
      res.status(500).json({ message: "Failed to fetch recommended module" });
    }
  }
});

// Start a module
router.post("/modules/start", async (req, res) => {
  try {
    const { userId, moduleId } = req.body;
    
    if (!userId || !moduleId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Special handling for demo user - return mock progress
    if (userId === 'demo') {
      return res.json({
        id: 'demo-progress',
        userId: 'demo',
        moduleId,
        status: 'in_progress',
        lastCompletedSection: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Check if progress already exists
    const [existingProgress] = await db
      .select()
      .from(userLearningProgress)
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.moduleId, moduleId)
        )
      );
    
    if (existingProgress) {
      return res.json(existingProgress);
    }
    
    // Create new progress record
    const [progress] = await db
      .insert(userLearningProgress)
      .values({
        id: uuidv4(),
        userId,
        moduleId,
        status: "in_progress",
        lastCompletedSection: 0,
      })
      .returning();
    
    res.json(progress);
  } catch (error) {
    console.error("Error starting module:", error);
    res.status(500).json({ message: "Failed to start module" });
  }
});

// Update section progress
router.post("/modules/progress", async (req, res) => {
  try {
    const { userId, moduleId, section } = req.body;
    
    if (!userId || !moduleId || section === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Special handling for demo user - return mock progress
    if (userId === 'demo') {
      return res.json({
        id: 'demo-progress',
        userId: 'demo',
        moduleId,
        status: 'in_progress',
        lastCompletedSection: section,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Update progress
    const [progress] = await db
      .update(userLearningProgress)
      .set({
        lastCompletedSection: section,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.moduleId, moduleId)
        )
      )
      .returning();
    
    if (!progress) {
      return res.status(404).json({ message: "Progress record not found" });
    }
    
    res.json(progress);
  } catch (error) {
    console.error("Error updating section progress:", error);
    res.status(500).json({ message: "Failed to update progress" });
  }
});

// Complete a module
router.post("/modules/complete", async (req, res) => {
  try {
    const { userId, moduleId } = req.body;
    
    if (!userId || !moduleId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Special handling for demo user - return mock completed progress
    if (userId === 'demo') {
      const now = new Date().toISOString();
      return res.json({
        id: 'demo-progress',
        userId: 'demo',
        moduleId,
        status: 'completed',
        lastCompletedSection: 10, // High number to indicate completion
        completedAt: now,
        createdAt: now,
        updatedAt: now
      });
    }
    
    // Update progress
    const [progress] = await db
      .update(userLearningProgress)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.moduleId, moduleId)
        )
      )
      .returning();
    
    if (!progress) {
      return res.status(404).json({ message: "Progress record not found" });
    }
    
    res.json(progress);
  } catch (error) {
    console.error("Error completing module:", error);
    res.status(500).json({ message: "Failed to complete module" });
  }
});

// Submit quiz answer
router.post("/quizzes/submit", async (req, res) => {
  try {
    const { userId, quizId, isCorrect } = req.body;
    
    if (!userId || !quizId || isCorrect === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // This endpoint could be expanded to store quiz results in the database
    // For now, we just acknowledge the submission
    
    res.json({
      success: true,
      userId,
      quizId,
      isCorrect
    });
  } catch (error) {
    console.error("Error submitting quiz answer:", error);
    res.status(500).json({ message: "Failed to submit quiz answer" });
  }
});

export default router;