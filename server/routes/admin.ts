import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { tokens } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Admin authentication routes are now handled directly in the main routes.ts file

// Get all tokens (admin only) - authorization handled by the parent router
router.get("/tokens", async (req: Request, res: Response) => {
  try {
    console.log("Admin API: Getting all tokens");
    const allTokens = await db.query.tokens.findMany({
      orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
    });

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
    const existingToken = await db.query.tokens.findFirst({
      where: (tokens, { eq }) => eq(tokens.id, id),
    });

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

export default router;