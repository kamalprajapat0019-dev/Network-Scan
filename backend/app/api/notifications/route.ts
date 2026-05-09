import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

// GET - Retrieve recent notifications for the logged in user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const db = await getDb()
    const collection = db.collection("notifications")
    
    // Fetch top 50 recent notifications
    const rawNotifications = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()
    
    // Calculate unread count specifically for this user
    // Unread means the user's ID is NOT in the readBy array
    const unreadCount = await collection.countDocuments({
      readBy: { $ne: user.userId }
    })
    
    const notifications = rawNotifications.map(notification => ({
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link || "",
      isRead: Array.isArray(notification.readBy) && notification.readBy.includes(user.userId),
      createdAt: notification.createdAt,
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      }
    })
  } catch (error) {
    console.error("❌ Get notifications error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { id, action } = body
    
    const db = await getDb()
    const collection = db.collection("notifications")
    
    if (action === "markAllAsRead") {
      // Mark all notifications as read by adding current user to readBy list
      await collection.updateMany(
        { readBy: { $ne: user.userId } },
        { $addToSet: { readBy: user.userId } }
      )
      
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      })
    }
    
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: "Invalid notification ID" }, { status: 400 })
      }
      
      // Mark specific notification as read
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { readBy: user.userId } }
      )
      
      return NextResponse.json({
        success: true,
        message: "Notification marked as read"
      })
    }
    
    return NextResponse.json({ success: false, error: "Missing notification ID or action" }, { status: 400 })
  } catch (error) {
    console.error("❌ Mark notification error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
