import { NextRequest, NextResponse } from "next/server"
import { requireAuth, hashPassword } from "@/lib/auth"
import { query as mysqlQuery, initializeDatabase } from "@/lib/mysql"
import type { User } from "@/lib/types"
import { createNotification } from "@/lib/notifications"

export async function GET() {
  try {
    await requireAuth(["admin"])
    
    // Ensure users table exists
    await initializeDatabase()
    
    const users = await mysqlQuery(
      `SELECT id, username, role, name, created_at as createdAt, updated_at as updatedAt FROM \`users\` ORDER BY created_at DESC`
    ) as any[]
    
    // Map id to _id for frontend compatibility if needed
    const mappedUsers = users.map(u => ({
      ...u,
      _id: u.id?.toString()
    }))
    
    return NextResponse.json({
      success: true,
      data: mappedUsers,
    })
  } catch (error) {
    console.error("Get users error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"])
    
    // Ensure users table exists
    await initializeDatabase()
    
    const body = await request.json()
    
    if (!body.username || !body.password || !body.name || !body.role) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }
    
    // Check if username already exists
    const existing = await mysqlQuery(
      `SELECT id FROM \`users\` WHERE username = ? LIMIT 1`,
      [body.username]
    ) as any[]
    
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 400 }
      )
    }
    
    const hashedPassword = await hashPassword(body.password)
    
    const result = await mysqlQuery(
      `INSERT INTO \`users\` (username, password, role, name) VALUES (?, ?, ?, ?)`,
      [body.username, hashedPassword, body.role, body.name]
    ) as any
    
    const insertId = result.insertId
    
    // Trigger notification
    try {
      await createNotification({
        title: "New User Registered",
        message: `A new user ${body.name} (${body.username}) was registered as ${body.role.toUpperCase()}.`,
        type: "info",
        link: "/users",
      })
    } catch (notifError) {
      console.error("⚠️ Failed to trigger user registration notification:", notifError)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: insertId,
        _id: insertId?.toString(),
        username: body.username,
        role: body.role,
        name: body.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Create user error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
