import { db } from "../db";
import { users, User, InsertUser } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  /**
   * Create a new user
   */
  static async create(userData: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  /**
   * Update a user
   */
  static async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  /**
   * Delete a user
   */
  static async delete(id: string): Promise<boolean> {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    
    return !!deletedUser;
  }

  /**
   * Get all users
   */
  static async findAll(): Promise<User[]> {
    return await db.select().from(users);
  }
}