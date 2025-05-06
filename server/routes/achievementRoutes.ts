import { Router } from "express";
import { db } from "../db";
import { achievements } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { AchievementModel } from "../models/AchievementModel";

const router = Router();

// Get all achievements for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    // Get the authenticated user
    const user = (req as any).user;
    
    // Query achievements that belong to this user
    const userAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, user.id));
    
    // If no achievements found, check if we need to initialize them
    if (userAchievements.length === 0) {
      // Initialize default achievements for this user
      const defaultAchievements = await AchievementModel.initializeAchievements(user.id);
      res.json(defaultAchievements);
    } else {
      res.json(userAchievements);
    }
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ message: "Failed to fetch achievements" });
  }
});

// Calculate and update achievements for current user
router.post("/calculate", requireAuth, async (req, res) => {
  try {
    // Get the authenticated user
    const user = (req as any).user;
    
    // Calculate and update achievements
    const updatedAchievements = await AchievementModel.calculateAchievements(user.id);
    
    res.json(updatedAchievements);
  } catch (error) {
    console.error("Error calculating achievements:", error);
    res.status(500).json({ message: "Failed to calculate achievements" });
  }
});

// Update achievement progress
router.patch("/:id/progress", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    if (progress === undefined) {
      return res.status(400).json({ message: "Missing progress value" });
    }
    
    // Get the authenticated user
    const user = (req as any).user;
    
    const updatedAchievement = await AchievementModel.updateProgress(id, user.id, progress);
    
    if (!updatedAchievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }
    
    res.json(updatedAchievement);
  } catch (error) {
    console.error("Error updating achievement progress:", error);
    res.status(500).json({ message: "Failed to update achievement progress" });
  }
});

// Mark achievement as earned
router.patch("/:id/earn", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the authenticated user
    const user = (req as any).user;
    
    const updatedAchievement = await AchievementModel.markAsEarned(id, user.id);
    
    if (!updatedAchievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }
    
    res.json(updatedAchievement);
  } catch (error) {
    console.error("Error marking achievement as earned:", error);
    res.status(500).json({ message: "Failed to mark achievement as earned" });
  }
});

export default router;