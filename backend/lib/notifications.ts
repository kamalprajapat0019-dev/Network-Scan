import { getDb } from "./mongodb"

export interface Notification {
  _id?: any;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link?: string;
  readBy: string[]; // List of userIds who have read this
  createdAt: Date;
}

export async function createNotification(data: {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link?: string;
}) {
  try {
    const db = await getDb()
    const collection = db.collection("notifications")
    const notification: Notification = {
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      readBy: [],
      createdAt: new Date(),
    }
    await collection.insertOne(notification)
    console.log("🔔 Notification created successfully:", data.title)
    return true
  } catch (error) {
    console.error("❌ Error creating notification:", error)
    return false
  }
}
