import { db } from "./db";
import { users } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

/**
 * This script creates an admin user for testing purposes
 * It will only create the user if it doesn't already exist
 */

// Password hashing function (copied from auth.ts to maintain compatibility)
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createAdminUserIfNeeded() {
  console.log("Creating admin user if needed...");
  try {
    // Define admin credentials
    const adminUsername = 'admin';
    const adminPassword = 'admin123'; // This would be a secure password in production

    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, adminUsername)
    });

    console.log('Checking for existing admin user...', existingAdmin);

    if (existingAdmin) {
      // If admin exists but isn't an admin, make them an admin
      if (!existingAdmin.isAdmin) {
        console.log('Admin user exists but is not an admin, updating...');
        await db
          .update(users)
          .set({ isAdmin: true })
          .where(eq(users.id, existingAdmin.id));
        console.log('Updated user to admin');
      } else {
        console.log('Admin user already exists, skipping creation');
      }
      return;
    }

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await hashPassword(adminPassword);

    // Only use fields that actually exist in the database (based on querying the schema)
    const [newAdmin] = await db
      .insert(users)
      .values({
        id: uuidv4(),
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true,
        // provider field doesn't exist in actual table
        // wallet_type and wallet_address are null
      })
      .returning();

    console.log('Admin user created with ID:', newAdmin.id);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}