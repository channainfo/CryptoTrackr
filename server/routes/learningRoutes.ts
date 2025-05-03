import { Router } from "express";
import { LearningModuleModel } from "../models/LearningModuleModel";
import { insertLearningModuleSchema, insertLearningQuizSchema, insertUserLearningProgressSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Get all learning modules
router.get("/modules", async (req, res) => {
  try {
    const modules = await LearningModuleModel.findAll();
    res.json(modules);
  } catch (error) {
    console.error("Error fetching learning modules:", error);
    res.status(500).json({ error: "Failed to fetch learning modules" });
  }
});

// Get learning modules by category
router.get("/modules/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const modules = await LearningModuleModel.findByCategory(category);
    res.json(modules);
  } catch (error) {
    console.error("Error fetching learning modules by category:", error);
    res.status(500).json({ error: "Failed to fetch learning modules" });
  }
});

// Get learning modules by difficulty
router.get("/modules/difficulty/:difficulty", async (req, res) => {
  try {
    const difficulty = parseInt(req.params.difficulty);
    if (isNaN(difficulty)) {
      return res.status(400).json({ error: "Invalid difficulty level" });
    }
    
    const modules = await LearningModuleModel.findByDifficulty(difficulty);
    res.json(modules);
  } catch (error) {
    console.error("Error fetching learning modules by difficulty:", error);
    res.status(500).json({ error: "Failed to fetch learning modules" });
  }
});

// Get a specific learning module
router.get("/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const module = await LearningModuleModel.findById(id);
    
    if (!module) {
      return res.status(404).json({ error: "Learning module not found" });
    }
    
    res.json(module);
  } catch (error) {
    console.error("Error fetching learning module:", error);
    res.status(500).json({ error: "Failed to fetch learning module" });
  }
});

// Get a specific learning module with quizzes
router.get("/modules/:id/with-quizzes", async (req, res) => {
  try {
    const { id } = req.params;
    const moduleWithQuizzes = await LearningModuleModel.findByIdWithQuizzes(id);
    
    if (!moduleWithQuizzes) {
      return res.status(404).json({ error: "Learning module not found" });
    }
    
    res.json(moduleWithQuizzes);
  } catch (error) {
    console.error("Error fetching learning module with quizzes:", error);
    res.status(500).json({ error: "Failed to fetch learning module with quizzes" });
  }
});

// Create a new learning module
router.post("/modules", async (req, res) => {
  try {
    const moduleData = insertLearningModuleSchema.parse(req.body);
    const newModule = await LearningModuleModel.create(moduleData);
    res.status(201).json(newModule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating learning module:", error);
    res.status(500).json({ error: "Failed to create learning module" });
  }
});

// Update a learning module
router.patch("/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedModule = await LearningModuleModel.update(id, req.body);
    
    if (!updatedModule) {
      return res.status(404).json({ error: "Learning module not found" });
    }
    
    res.json(updatedModule);
  } catch (error) {
    console.error("Error updating learning module:", error);
    res.status(500).json({ error: "Failed to update learning module" });
  }
});

// Delete a learning module
router.delete("/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LearningModuleModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Learning module not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting learning module:", error);
    res.status(500).json({ error: "Failed to delete learning module" });
  }
});

// Create a quiz for a module
router.post("/modules/:moduleId/quizzes", async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await LearningModuleModel.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: "Learning module not found" });
    }
    
    const quizData = insertLearningQuizSchema.parse({
      ...req.body,
      moduleId
    });
    
    const newQuiz = await LearningModuleModel.createQuiz(quizData);
    res.status(201).json(newQuiz);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating quiz:", error);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

// Update a quiz
router.patch("/quizzes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedQuiz = await LearningModuleModel.updateQuiz(id, req.body);
    
    if (!updatedQuiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    res.json(updatedQuiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ error: "Failed to update quiz" });
  }
});

// Delete a quiz
router.delete("/quizzes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LearningModuleModel.deleteQuiz(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

// Get user progress
router.get("/progress/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await LearningModuleModel.getAllUserProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({ error: "Failed to fetch user progress" });
  }
});

// Get user progress for a specific module
router.get("/progress/:userId/:moduleId", async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const progress = await LearningModuleModel.getUserProgress(userId, moduleId);
    
    if (!progress) {
      return res.json({ status: "not_started" });
    }
    
    res.json(progress);
  } catch (error) {
    console.error("Error fetching module progress:", error);
    res.status(500).json({ error: "Failed to fetch module progress" });
  }
});

// Start a module
router.post("/progress/:userId/:moduleId/start", async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const module = await LearningModuleModel.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: "Learning module not found" });
    }
    
    const progress = await LearningModuleModel.startModule(userId, moduleId);
    res.json(progress);
  } catch (error) {
    console.error("Error starting module:", error);
    res.status(500).json({ error: "Failed to start module" });
  }
});

// Complete a module
router.post("/progress/:userId/:moduleId/complete", async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const { quizScore } = req.body;
    
    const module = await LearningModuleModel.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: "Learning module not found" });
    }
    
    const progress = await LearningModuleModel.completeModule(userId, moduleId, quizScore);
    res.json(progress);
  } catch (error) {
    console.error("Error completing module:", error);
    res.status(500).json({ error: "Failed to complete module" });
  }
});

// Update section progress
router.post("/progress/:userId/:moduleId/section/:sectionNumber", async (req, res) => {
  try {
    const { userId, moduleId, sectionNumber } = req.params;
    const sectionNum = parseInt(sectionNumber);
    
    if (isNaN(sectionNum)) {
      return res.status(400).json({ error: "Invalid section number" });
    }
    
    const module = await LearningModuleModel.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: "Learning module not found" });
    }
    
    const progress = await LearningModuleModel.updateSectionProgress(userId, moduleId, sectionNum);
    res.json(progress);
  } catch (error) {
    console.error("Error updating section progress:", error);
    res.status(500).json({ error: "Failed to update section progress" });
  }
});

// Get user learning stats
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await LearningModuleModel.getUserLearningStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching user learning stats:", error);
    res.status(500).json({ error: "Failed to fetch user learning stats" });
  }
});

// Get next recommended module for user
router.get("/recommend/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const module = await LearningModuleModel.getNextRecommendedModule(userId);
    
    if (!module) {
      return res.json({ message: "No modules available or all modules completed" });
    }
    
    res.json(module);
  } catch (error) {
    console.error("Error fetching recommended module:", error);
    res.status(500).json({ error: "Failed to fetch recommended module" });
  }
});

export default router;