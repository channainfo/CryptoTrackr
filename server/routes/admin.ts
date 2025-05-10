import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { 
  tokens, 
  users, 
  learningModules, 
  alerts, 
  achievements,
  learningQuizzes,
  userLearningProgress 
} from "@shared/schema";
import { eq, and, inArray, desc, count } from "drizzle-orm";
import * as scrypt from "@node-rs/bcrypt";

const router = Router();

// Admin authentication routes are now handled directly in the main routes.ts file

// Get all tokens (admin only) - authorization handled by the parent router
router.get("/tokens", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Getting all tokens");
    const allTokens = await db.select().from(tokens);
    return res.json(allTokens);
  } catch (error: any) {
    console.error("Error fetching tokens:", error);
    return res.status(500).json({ 
      message: "Failed to fetch tokens",
      error: error.message || String(error) 
    });
  }
});

// Create new token (admin only) - authorization handled by the parent router
router.post("/tokens", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Creating token");
    // Validation handled in the route that calls this one
    const tokenData = req.body;

    // Check if token already exists
    const [existingToken] = await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.symbol, tokenData.symbol),
          eq(tokens.chain, tokenData.chain)
        )
      )
      .limit(1);

    if (existingToken) {
      return res.status(400).json({ 
        message: `Token ${tokenData.symbol} already exists on ${tokenData.chain}` 
      });
    }

    // Create the token
    const [newToken] = await db.insert(tokens).values(tokenData).returning();

    return res.status(201).json(newToken);
  } catch (error: any) {
    console.error("Error creating token:", error);
    return res.status(400).json({ 
      message: "Failed to create token",
      error: error.message || String(error) 
    });
  }
});

// Update token (admin only) - authorization handled by the parent router
router.put("/tokens/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Updating token", req.params.id);
    const { id } = req.params;

    // Validation handled in the route that calls this one
    const tokenData = req.body;

    // Check if token exists
    const [existingToken] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.id, id))
      .limit(1);

    if (!existingToken) {
      return res.status(404).json({ message: "Token not found" });
    }

    // Update the token
    const [updatedToken] = await db
      .update(tokens)
      .set(tokenData)
      .where(eq(tokens.id, id))
      .returning();

    return res.json(updatedToken);
  } catch (error: any) {
    console.error("Error updating token:", error);
    return res.status(400).json({
      message: "Failed to update token",
      error: error.message || String(error)
    });
  }
});

// Delete token (admin only) - authorization handled by the parent router
router.delete("/tokens/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Deleting token", req.params.id);
    const { id } = req.params;

    // Check if token exists
    const [existingToken] = await db
      .select()
      .from(tokens)
      .where(eq(tokens.id, id))
      .limit(1);

    if (!existingToken) {
      return res.status(404).json({ message: "Token not found" });
    }

    // Delete the token
    await db.delete(tokens).where(eq(tokens.id, id));

    return res.status(200).json({ message: "Token deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting token:", error);
    return res.status(400).json({
      message: "Failed to delete token",
      error: error.message || String(error)
    });
  }
});

// User Management Routes

// Get all users (admin only)
router.get("/users", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Getting all users");
    // Explicitly select only the columns that exist in the database
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin,
        walletAddress: users.walletAddress,
        wallet_type: users.walletType, // Map database column to consistent field name
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users);
    return res.json(allUsers);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ 
      message: "Failed to fetch users",
      error: error.message || String(error) 
    });
  }
});

// Create new user (admin only)
router.post("/users", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Creating user");
    const userData = req.body;
    
    // Check if user already exists - explicitly select only columns we know exist
    const [existingUser] = await db
      .select({
        id: users.id,
        username: users.username
      })
      .from(users)
      .where(eq(users.username, userData.username))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ 
        message: `User with username ${userData.username} already exists` 
      });
    }

    // Hash password if provided
    // Only include fields that actually exist in the database
    let userToCreate: any = {
      username: userData.username,
      isAdmin: userData.isAdmin || false
    };
    
    // Only add password if provided
    if (userData.password) {
      userToCreate.password = await scrypt.hash(userData.password, 10);
    }
    
    // Only add wallet fields if provided
    if (userData.walletAddress) {
      userToCreate.walletAddress = userData.walletAddress;
    }
    if (userData.wallet_type) {
      userToCreate.walletType = userData.wallet_type;
    }

    // Create the user
    const [newUser] = await db.insert(users).values(userToCreate).returning({
      id: users.id,
      username: users.username,
      isAdmin: users.isAdmin,
      walletAddress: users.walletAddress,
      wallet_type: users.walletType, // Map database column to consistent field name
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    });

    return res.status(201).json(newUser);
  } catch (error: any) {
    console.error("Error creating user:", error);
    return res.status(400).json({ 
      message: "Failed to create user",
      error: error.message || String(error) 
    });
  }
});

// Update user (admin only)
router.put("/users/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Updating user", req.params.id);
    const { id } = req.params;
    const userData = req.body;

    // Check if user exists - manually select only fields we know exist
    const [existingUser] = await db
      .select({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin,
        walletAddress: users.walletAddress,
        walletType: users.walletType,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build update data, conditionally including password if it's provided
    const updateData: Record<string, any> = {};
    
    // Only include fields that exist in the database
    if (userData.username) updateData.username = userData.username;
    if (userData.isAdmin !== undefined) updateData.isAdmin = userData.isAdmin;
    if (userData.walletAddress) updateData.walletAddress = userData.walletAddress;
    
    // Handle wallet_type field from request and map to walletType column
    if (userData.wallet_type) updateData.walletType = userData.wallet_type;
    
    // If password is provided, hash it
    if (userData.password) {
      updateData.password = await scrypt.hash(userData.password, 10);
    }

    // Update the user - Only update fields that were explicitly set in updateData
    // IMPORTANT: Never spread the updateData here as it might contain fields that don't exist
    // Instead, only set the fields that we know exist in the database
    const actualUpdateData: any = {};
    if (updateData.username) actualUpdateData.username = updateData.username;
    if (updateData.isAdmin !== undefined) actualUpdateData.isAdmin = updateData.isAdmin;
    // Only include password if explicitly provided
    if (updateData.password) actualUpdateData.password = updateData.password;
    
    // Set the updated timestamp
    actualUpdateData.updatedAt = new Date();
    
    // Now perform the update with only the fields we know exist
    const [updatedUser] = await db
      .update(users)
      .set(actualUpdateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin,
        walletAddress: users.walletAddress,
        wallet_type: users.walletType, // Use the column name from the database
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return res.status(400).json({
      message: "Failed to update user",
      error: error.message || String(error)
    });
  }
});

// Delete user (admin only)
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Deleting user", req.params.id);
    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user
    await db.delete(users).where(eq(users.id, id));

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return res.status(400).json({
      message: "Failed to delete user",
      error: error.message || String(error)
    });
  }
});

// Batch delete users (admin only)
router.delete("/users/batch", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Batch deleting users");
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs provided" });
    }
    
    // Delete multiple users
    await db.delete(users).where(inArray(users.id, ids));
    
    return res.status(200).json({ message: `${ids.length} users deleted successfully` });
  } catch (error: any) {
    console.error("Error batch deleting users:", error);
    return res.status(400).json({
      message: "Failed to delete users",
      error: error.message || String(error)
    });
  }
});

// Learning Modules Routes

// Get all learning modules (admin only)
router.get("/learning-modules", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Getting all learning modules");
    const modules = await db
      .select()
      .from(learningModules)
      .orderBy(learningModules.order);
    
    return res.json(modules);
  } catch (error: any) {
    console.error("Error fetching learning modules:", error);
    return res.status(500).json({ 
      message: "Failed to fetch learning modules",
      error: error.message || String(error) 
    });
  }
});

// Create new learning module (admin only)
router.post("/learning-modules", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Creating learning module");
    const moduleData = req.body;
    
    // Create the module
    const [newModule] = await db
      .insert(learningModules)
      .values({
        ...moduleData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return res.status(201).json(newModule);
  } catch (error: any) {
    console.error("Error creating learning module:", error);
    return res.status(400).json({ 
      message: "Failed to create learning module",
      error: error.message || String(error) 
    });
  }
});

// Update learning module (admin only)
router.put("/learning-modules/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Updating learning module", req.params.id);
    const { id } = req.params;
    const moduleData = req.body;
    
    // Check if module exists
    const existingModule = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, id))
      .limit(1);
    
    if (!existingModule.length) {
      return res.status(404).json({ message: "Learning module not found" });
    }
    
    // Update the module
    const [updatedModule] = await db
      .update(learningModules)
      .set({
        ...moduleData,
        updatedAt: new Date()
      })
      .where(eq(learningModules.id, id))
      .returning();
    
    return res.json(updatedModule);
  } catch (error: any) {
    console.error("Error updating learning module:", error);
    return res.status(400).json({
      message: "Failed to update learning module",
      error: error.message || String(error)
    });
  }
});

// Delete learning module (admin only)
router.delete("/learning-modules/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Deleting learning module", req.params.id);
    const { id } = req.params;
    
    // Check if module exists
    const existingModule = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, id))
      .limit(1);
    
    if (!existingModule.length) {
      return res.status(404).json({ message: "Learning module not found" });
    }
    
    // Delete all associated quizzes first
    await db
      .delete(learningQuizzes)
      .where(eq(learningQuizzes.moduleId, id));
      
    // Delete user progress for this module
    await db
      .delete(userLearningProgress)
      .where(eq(userLearningProgress.moduleId, id));
    
    // Delete the module
    await db
      .delete(learningModules)
      .where(eq(learningModules.id, id));
    
    return res.status(200).json({ message: "Learning module deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting learning module:", error);
    return res.status(400).json({
      message: "Failed to delete learning module",
      error: error.message || String(error)
    });
  }
});

// Alerts Routes

// Get all alerts (admin only)
router.get("/alerts", async (req: Request, res: Response) => {
  try {
    const allAlerts = await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt));
    
    return res.json(allAlerts);
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return res.status(500).json({ 
      message: "Failed to fetch alerts",
      error: error.message || String(error) 
    });
  }
});

// Create new alert (admin only)
router.post("/alerts", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Creating alert");
    const alertData = req.body;
    
    // Create the alert
    const [newAlert] = await db
      .insert(alerts)
      .values({
        ...alertData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return res.status(201).json(newAlert);
  } catch (error: any) {
    console.error("Error creating alert:", error);
    return res.status(400).json({ 
      message: "Failed to create alert",
      error: error.message || String(error) 
    });
  }
});

// Update alert (admin only)
router.put("/alerts/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Updating alert", req.params.id);
    const { id } = req.params;
    const alertData = req.body;
    
    // Check if alert exists
    const existingAlert = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id))
      .limit(1);
    
    if (!existingAlert.length) {
      return res.status(404).json({ message: "Alert not found" });
    }
    
    // Update the alert
    const [updatedAlert] = await db
      .update(alerts)
      .set({
        ...alertData,
        updatedAt: new Date()
      })
      .where(eq(alerts.id, id))
      .returning();
    
    return res.json(updatedAlert);
  } catch (error: any) {
    console.error("Error updating alert:", error);
    return res.status(400).json({
      message: "Failed to update alert",
      error: error.message || String(error)
    });
  }
});

// Delete alert (admin only)
router.delete("/alerts/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Deleting alert", req.params.id);
    const { id } = req.params;
    
    // Check if alert exists
    const existingAlert = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id))
      .limit(1);
    
    if (!existingAlert.length) {
      return res.status(404).json({ message: "Alert not found" });
    }
    
    // Delete the alert
    await db
      .delete(alerts)
      .where(eq(alerts.id, id));
    
    return res.status(200).json({ message: "Alert deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting alert:", error);
    return res.status(400).json({
      message: "Failed to delete alert",
      error: error.message || String(error)
    });
  }
});

// Achievements Routes

// Get all achievements (admin only)
router.get("/achievements", async (req: Request, res: Response) => {
  try {
    const allAchievements = await db
      .select()
      .from(achievements);
    
    return res.json(allAchievements);
  } catch (error: any) {
    console.error("Error fetching achievements:", error);
    return res.status(500).json({ 
      message: "Failed to fetch achievements",
      error: error.message || String(error) 
    });
  }
});

// Create new achievement (admin only)
router.post("/achievements", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Creating achievement");
    const achievementData = req.body;
    
    // Create the achievement
    const [newAchievement] = await db
      .insert(achievements)
      .values({
        ...achievementData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return res.status(201).json(newAchievement);
  } catch (error: any) {
    console.error("Error creating achievement:", error);
    return res.status(400).json({ 
      message: "Failed to create achievement",
      error: error.message || String(error) 
    });
  }
});

// Update achievement (admin only)
router.put("/achievements/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Updating achievement", req.params.id);
    const { id } = req.params;
    const achievementData = req.body;
    
    // Check if achievement exists
    const existingAchievement = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id))
      .limit(1);
    
    if (!existingAchievement.length) {
      return res.status(404).json({ message: "Achievement not found" });
    }
    
    // Update the achievement
    const [updatedAchievement] = await db
      .update(achievements)
      .set({
        ...achievementData,
        updatedAt: new Date()
      })
      .where(eq(achievements.id, id))
      .returning();
    
    return res.json(updatedAchievement);
  } catch (error: any) {
    console.error("Error updating achievement:", error);
    return res.status(400).json({
      message: "Failed to update achievement",
      error: error.message || String(error)
    });
  }
});

// Delete achievement (admin only)
router.delete("/achievements/:id", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Deleting achievement", req.params.id);
    const { id } = req.params;
    
    // Check if achievement exists
    const existingAchievement = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id))
      .limit(1);
    
    if (!existingAchievement.length) {
      return res.status(404).json({ message: "Achievement not found" });
    }
    
    // Delete the achievement
    await db
      .delete(achievements)
      .where(eq(achievements.id, id));
    
    return res.status(200).json({ message: "Achievement deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting achievement:", error);
    return res.status(400).json({
      message: "Failed to delete achievement",
      error: error.message || String(error)
    });
  }
});

// Analytics Routes

// Get analytics overview (admin only)
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    // Get all data
    const allUsers = await db.select().from(users);
    const allTokens = await db.select().from(tokens);
    const allAlerts = await db.select().from(alerts);
    const allModules = await db.select().from(learningModules);
    const allAchievements = await db.select().from(achievements);
    
    // Return analytics data
    return res.json({
      overview: {
        users: allUsers.length,
        tokens: allTokens.length,
        alerts: allAlerts.length,
        learningModules: allModules.length,
        achievements: allAchievements.length,
      },
      // Add any additional analytics data as needed
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ 
      message: "Failed to fetch analytics",
      error: error.message || String(error) 
    });
  }
});

export default router;