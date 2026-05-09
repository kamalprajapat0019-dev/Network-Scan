import { NextRequest, NextResponse } from "next/server"
import { verifyPassword, createToken, initializeDefaultAdmin } from "@/lib/auth"
import { query as mysqlQuery } from "@/lib/mysql"
import type { User } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      )
    }
    
    try {
      // Initialize default admin if not exists
      await initializeDefaultAdmin()
    } catch (initError) {
      console.error("Admin initialization error:", initError)
      // Continue even if initialization fails - user might exist
    }
    
    const rows = await mysqlQuery(`SELECT * FROM \`users\` WHERE username = ? LIMIT 1`, [username]) as any[]
    const user = rows?.[0]
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }
    
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }
    
    const { password: _, ...userWithoutPassword } = user
    const token = await createToken(userWithoutPassword)
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    })
    
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    console.error("❌ Login error:", errorMessage)
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
