import { NextRequest, NextResponse } from "next/server"
import { requireAuth, hashPassword, verifyPassword } from "@/lib/auth"
import { query as mysqlQuery } from "@/lib/mysql"
import type { User } from "@/lib/types"

// GET - Get logged in user profile details
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const userIdNum = parseInt(user.userId)
    
    if (isNaN(userIdNum)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }
    
    const rows = await mysqlQuery(
      `SELECT id, username, role, name, created_at as createdAt, updated_at as updatedAt FROM \`users\` WHERE id = ? LIMIT 1`,
      [userIdNum]
    ) as any[]
    
    const userDetails = rows?.[0]
    
    if (!userDetails) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    // Set _id for frontend compatibility
    userDetails._id = userDetails.id?.toString()
    
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
    const userIdNum = parseInt(user.userId)
    
    if (isNaN(userIdNum)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }
    
    const body = await request.json()
    const { name, currentPassword, newPassword } = body
    
    // Find complete user details including hashed password
    const rows = await mysqlQuery(`SELECT * FROM \`users\` WHERE id = ? LIMIT 1`, [userIdNum]) as any[]
    const userDb = rows?.[0]
    
    if (!userDb) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    
    let updatedName = userDb.name
    let updatedPassword = userDb.password
    
    if (name && name.trim()) {
      updatedName = name.trim()
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
      
      updatedPassword = await hashPassword(newPassword)
    } else if (newPassword || currentPassword) {
      return NextResponse.json(
        { success: false, error: "Both current and new passwords are required to change password" },
        { status: 400 }
      )
    }
    
    // Save to DB
    await mysqlQuery(
      `UPDATE \`users\` SET name = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [updatedName, updatedPassword, userIdNum]
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
