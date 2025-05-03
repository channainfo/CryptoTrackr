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
    
    // Special handling for demo user - return null progress
    let progress = null;
    if (userId !== 'demo') {
      // Get user progress for non-demo users
      const [userProgress] = await db
        .select()
        .from(userLearningProgress)
        .where(
          and(
            eq(userLearningProgress.userId, userId),
            eq(userLearningProgress.moduleId, id)
          )
        );
      progress = userProgress;
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

// Get next recommended module
router.get("/recommended/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Special handling for demo user - recommend first module by order
    if (userId === 'demo') {
      const [firstModule] = await db
        .select()
        .from(learningModules)
        .orderBy(learningModules.order);
      
      return res.json(firstModule || null);
    }
    
    // Get user progress
    const userProgress = await db
      .select()
      .from(userLearningProgress)
      .where(eq(userLearningProgress.userId, userId));
    
    // Extract IDs of completed modules
    const completedModuleIds = userProgress
      .filter(p => p.status === "completed")
      .map(p => p.moduleId);
    
    // Extract IDs of in-progress modules
    const inProgressModuleIds = userProgress
      .filter(p => p.status === "in_progress")
      .map(p => p.moduleId);
    
    // First, recommend any in-progress module
    if (inProgressModuleIds.length > 0) {
      const [inProgressModule] = await db
        .select()
        .from(learningModules)
        .where(inArray(learningModules.id, inProgressModuleIds))
        .orderBy(learningModules.order);
      
      if (inProgressModule) {
        return res.json(inProgressModule);
      }
    }
    
    // Otherwise, recommend the next not-started module by order
    const [nextModule] = await db
      .select()
      .from(learningModules)
      .where(
        completedModuleIds.length > 0
          ? sql`${learningModules.id} NOT IN (${completedModuleIds.join(',')})`
          : sql`1=1` // If no completed modules, recommend any module
      )
      .orderBy(learningModules.order);
    
    if (nextModule) {
      return res.json(nextModule);
    }
    
    // If no modules found (unlikely), return first module
    const [firstModule] = await db
      .select()
      .from(learningModules)
      .orderBy(learningModules.order);
    
    res.json(firstModule || null);
  } catch (error) {
    console.error("Error fetching recommended module:", error);
    res.status(500).json({ message: "Failed to fetch recommended module" });
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