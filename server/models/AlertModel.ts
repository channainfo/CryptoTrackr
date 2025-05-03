import { eq, and, gte, lte, ne, desc } from 'drizzle-orm';
import { db } from '../db';
import { alerts, Alert, InsertAlert, alertStatusEnum, tokens } from '@shared/schema';

export class AlertModel {
  /**
   * Find alert by ID
   */
  static async findById(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  /**
   * Find alerts by user ID
   */
  static async findByUserId(userId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }

  /**
   * Find alerts by token ID
   */
  static async findByTokenId(tokenId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.tokenId, tokenId))
      .orderBy(desc(alerts.createdAt));
  }

  /**
   * Find active alerts by user ID
   */
  static async findActiveByUserId(userId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.userId, userId),
          eq(alerts.status, 'active')
        )
      )
      .orderBy(desc(alerts.createdAt));
  }

  /**
   * Find alerts with token details by user ID
   */
  static async findWithTokenDetailsByUserId(userId: string) {
    const results = await db
      .select({
        alert: alerts,
        token: {
          id: tokens.id,
          symbol: tokens.symbol,
          name: tokens.name,
          imageUrl: tokens.imageUrl
        }
      })
      .from(alerts)
      .innerJoin(tokens, eq(alerts.tokenId, tokens.id))
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));

    return results.map(r => ({
      ...r.alert,
      token: r.token
    }));
  }

  /**
   * Create a new alert
   */
  static async create(alertData: InsertAlert): Promise<Alert> {
    const [alert] = await db
      .insert(alerts)
      .values(alertData)
      .returning();
    return alert;
  }

  /**
   * Update an alert
   */
  static async update(
    id: string, 
    updateData: Partial<Omit<Alert, 'id' | 'userId' | 'tokenId' | 'createdAt'>>
  ): Promise<Alert | undefined> {
    const [alert] = await db
      .update(alerts)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  /**
   * Delete an alert
   */
  static async delete(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(alerts)
      .where(eq(alerts.id, id))
      .returning();
    return !!deleted;
  }

  /**
   * Find alerts that need to be checked based on price conditions
   */
  static async findAlertsForPriceCheck(): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.status, 'active'),
          eq(alerts.notificationSent, false)
        )
      );
  }

  /**
   * Mark alert as triggered
   */
  static async markAsTriggered(id: string): Promise<Alert | undefined> {
    const [alert] = await db
      .update(alerts)
      .set({
        status: 'triggered',
        notificationSent: true,
        lastTriggeredAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }
}