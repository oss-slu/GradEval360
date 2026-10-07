import { Router } from "express";
import { and, count, desc, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/unread-count", requireAuth, async (req: any, res) => {
  try {
    const user = req.user;

    const [result] = await db
      .select({
        unreadCount: count(),
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.read, false),
        ),
      );

    return res.json({
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const user = req.user;

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt));

    return res.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/read", requireAuth, async (req: any, res) => {
  try {
    const user = req.user;
    const notificationId = req.params.id;

    const [notification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.id),
        ),
      );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.id),
        ),
      )
      .returning();

    return res.json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/read-all", requireAuth, async (req: any, res) => {
  try {
    const user = req.user;

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, user.id));

    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;