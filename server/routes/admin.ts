import { Router, Request, Response, NextFunction } from "express";
import { adminLogin, adminLogout, requireAdmin } from "../middleware/admin-auth";
import { db } from "../db";
import { tokens } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Admin authentication
router.post("/login", adminLogin);
router.post("/logout", adminLogout);

// Get all tokens (admin only)
router.get("/tokens", requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Getting all tokens");
    const allTokens = await db.query.tokens.findMany({
      orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
    });

    return res.json(allTokens);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return res.status(500).json({ message: "Failed to fetch tokens" });
  }
});

// Create new token (admin only)
router.post("/tokens", requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Creating token");
    // Validation handled in the route that calls this one
    const tokenData = req.body;

    // Check if token already exists
    const existingToken = await db.query.tokens.findFirst({
      where: (tokens, { eq, and }) => 
        and(
          eq(tokens.symbol, tokenData.symbol),
          eq(tokens.chain, tokenData.chain)
        ),
    });

    if (existingToken) {
      return res.status(400).json({ 
        message: `Token ${tokenData.symbol} already exists on ${tokenData.chain}` 
      });
    }

    // Create the token
    const [newToken] = await db.insert(tokens).values(tokenData).returning();

    return res.status(201).json(newToken);
  } catch (error) {
    console.error("Error creating token:", error);
    return res.status(400).json({ 
      message: "Failed to create token",
      error: error.message 
    });
  }
});

// Update token (admin only)
router.put("/tokens/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Updating token", req.params.id);
    const { id } = req.params;

    // Validation handled in the route that calls this one
    const tokenData = req.body;

    // Check if token exists
    const existingToken = await db.query.tokens.findFirst({
      where: (tokens, { eq }) => eq(tokens.id, id),
    });

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
  } catch (error) {
    console.error("Error updating token:", error);
    return res.status(400).json({
      message: "Failed to update token",
      error: error.message
    });
  }
});

// Delete token (admin only)
router.delete("/tokens/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Deleting token", req.params.id);
    const { id } = req.params;

    // Check if token exists
    const existingToken = await db.query.tokens.findFirst({
      where: (tokens, { eq }) => eq(tokens.id, id),
    });

    if (!existingToken) {
      return res.status(404).json({ message: "Token not found" });
    }

    // Delete the token
    await db.delete(tokens).where(eq(tokens.id, id));

    return res.status(200).json({ message: "Token deleted successfully" });
  } catch (error) {
    console.error("Error deleting token:", error);
    return res.status(400).json({
      message: "Failed to delete token",
      error: error.message
    });
  }
});

export default router;