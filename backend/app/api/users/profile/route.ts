import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { requireAuth, hashPassword, verifyPassword } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/types"

// GET - Get logged in user profile details
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const db = await getDb()
    const usersCollection = db.collection<User>("users")
    
    const userDetails = await usersCollection.findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { password: 0 } }
    )
    
    if (!userDetails) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: userDetails,
    })
  } catch (error) {
    console.error("❌ Get user profile error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update logged in user profile / password
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { name, currentPassword, newPassword } = body
    
    const db = await getDb()
    const usersCollection = db.collection<User>("users")
    
    // Find complete user details including hashed password
    const userDb = await usersCollection.findOne({ _id: new ObjectId(user.userId) })
    if (!userDb) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    const updateData: Partial<User> = {
      updatedAt: new Date(),
    }
    
    if (name && name.trim()) {
      updateData.name = name.trim()
    }
    
    // Handle password change if requested
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters" },
          { status: 400 }
        )
      }
      
      const isPasswordValid = await verifyPassword(currentPassword, userDb.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Incorrect current password" },
          { status: 400 }
        )
      }
      
      updateData.password = await hashPassword(newPassword)
    } else if (newPassword || currentPassword) {
      return NextResponse.json(
        { success: false, error: "Both current and new passwords are required to change password" },
        { status: 400 }
      )
    }
    
    // Save to DB
    await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: updateData }
    )
    
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("❌ Update user profile error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
