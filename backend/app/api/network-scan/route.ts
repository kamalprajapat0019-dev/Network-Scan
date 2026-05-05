import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { query as mysqlQuery, initializeDatabase } from "@/lib/mysql"
import { requireApiAuth, requireAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Interface for network scan data
interface NetworkScanData {
  centerCode: string
  centerName: string
  city: string
  auditorName: string
  contact: string
  systemCount: number
  ipList: string[]
  devices?: any[]
  scanDetails?: {
    totalDevices: number
    localIP: string
    subnet: string
    scanDuration?: number
    deviceBreakdown?: {
      pcs: number
      printers: number
      cameras?: number
      networkDevices?: number
      unknown: number
    }
    devices?: any[]
  }
}

interface NetworkScanRecord extends NetworkScanData {
  _id?: ObjectId
  scanId: string
  scannedBy: string
  scannedAt: Date
  status: "pending" | "verified" | "rejected"
}

// POST - Receive scan data from network scanner
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Network scan API called")
    
    let user
    try {
      user = await requireApiAuth(request)
      console.log("✅ Authenticated user:", user.username)
    } catch (authError: any) {
      console.error("❌ Auth error:", authError?.message || "Unauthorized")
      return NextResponse.json(
        { success: false, error: authError?.message || "Unauthorized" },
        { status: 401 }
      )
    }
    
    let body: NetworkScanData
    try {
      body = await request.json()
      console.log("📦 Request body:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!body.centerCode || !body.centerName) {
      return NextResponse.json(
        { success: false, error: "Center code and name are required" },
        { status: 400 }
      )
    }
    
    if (typeof body.systemCount !== "number" || body.systemCount < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid system count" },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(body.ipList)) {
      return NextResponse.json(
        { success: false, error: "IP list must be an array" },
        { status: 400 }
      )
    }
    
    // Initialize MySQL table if not exists
    await initializeDatabase()
    
    // Generate scan ID
    const scanId = `SCAN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    const scannedAt = new Date()
    
    // Create MySQL query
    const tableName = process.env.MYSQL_TABLE || 'Audit_Scanner'
    const insertQuery = `
      INSERT INTO \`${tableName}\` 
      (scanId, auditor_name, center_code, center_name, city, contact, total_systems, pcs, printers, lan_subnet, local_ip, ipList, devices, scanDetails, scannedBy, scanned_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const params = [
      scanId,
      body.auditorName || user.name,
      parseInt(body.centerCode),
      body.centerName,
      body.city || "",
      body.contact || "",
      body.systemCount,
      body.scanDetails?.deviceBreakdown?.pcs || 0,
      body.scanDetails?.deviceBreakdown?.printers || 0,
      body.scanDetails?.subnet || "",
      body.scanDetails?.localIP || "",
      JSON.stringify(body.ipList),
      JSON.stringify(body.devices || []),
      JSON.stringify(body.scanDetails || {}),
      user.userId,
      scannedAt,
      "pending"
    ]
    
    await mysqlQuery(insertQuery, params)
    
    // Optional: Still save to MongoDB for backup or if other systems rely on it
    try {
      const db = await getDb()
      const scansCollection = db.collection<NetworkScanRecord>("network_scans")
      await scansCollection.insertOne({
        scanId,
        centerCode: body.centerCode,
        centerName: body.centerName,
        city: body.city || "",
        auditorName: body.auditorName || user.name,
        contact: body.contact || "",
        systemCount: body.systemCount,
        ipList: body.ipList,
        devices: body.devices,
        scanDetails: body.scanDetails,
        scannedBy: user.userId,
        scannedAt,
        status: "pending",
      })
      
      // Update center with latest scan data
      const centersCollection = db.collection("centers")
      await centersCollection.updateOne(
        { centerId: body.centerCode },
        {
          $set: {
            lastNetworkScan: {
              scanId,
              systemCount: body.systemCount,
              scannedAt,
              scannedBy: user.name,
            },
          },
        }
      )
    } catch (dbError) {
      console.warn("⚠️ Secondary MongoDB update failed:", dbError)
    }
    
    console.log("✅ Scan data saved successfully to MySQL:", { scanId, systemCount: body.systemCount })
    
    return NextResponse.json({
      success: true,
      data: {
        scanId,
        systemCount: body.systemCount,
        ipCount: body.ipList.length,
        message: "Network scan data received successfully",
      },
    })
  } catch (error) {
    console.error("❌ Network scan error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// GET - Retrieve scan history for a center
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET Network Scans API called | URL:", request.url)
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    console.log("📝 Query ID:", id)
    const centerCode = searchParams.get("centerCode")
    const limit = parseInt(searchParams.get("limit") || "10")
    
    const tableName = process.env.MYSQL_TABLE || 'Audit_Scanner'
    
    if (id) {
      console.log("🔎 Searching MySQL by ID or scanId:", id)
      const selectQuery = `SELECT * FROM \`${tableName}\` WHERE id = ? OR scanId = ?`
      const rows = await mysqlQuery(selectQuery, [id, id]) as any[]
      
      if (!rows || rows.length === 0) {
        console.log("❌ Scan not found for ID:", id)
        return NextResponse.json({ success: false, error: "Scan not found" }, { status: 404 })
      }
      
      const scan = rows[0]
      // Map MySQL columns to frontend expectations if needed
      const mappedScan = {
        ...scan,
        auditorName: scan.auditor_name,
        centerCode: scan.center_code?.toString(),
        centerName: scan.center_name,
        systemCount: scan.total_systems,
        scannedAt: scan.scanned_at,
        // Parse JSON fields
        ipList: typeof scan.ipList === 'string' ? JSON.parse(scan.ipList) : (scan.ipList || []),
        devices: typeof scan.devices === 'string' ? JSON.parse(scan.devices) : (scan.devices || []),
        scanDetails: typeof scan.scanDetails === 'string' ? JSON.parse(scan.scanDetails) : (scan.scanDetails || {})
      }
      
      console.log("✅ Scan found in MySQL:", mappedScan.scanId)
      return NextResponse.json({ success: true, data: mappedScan })
    }
    
    let selectAllQuery = `SELECT * FROM \`${tableName}\``
    const queryParams: any[] = []
    
    if (centerCode) {
      selectAllQuery += ` WHERE center_code = ?`
      queryParams.push(centerCode)
    }
    
    selectAllQuery += ` ORDER BY scanned_at DESC LIMIT ?`
    queryParams.push(limit)
    
    const rows = await mysqlQuery(selectAllQuery, queryParams) as any[]
    
    const scans = rows.map(scan => ({
      ...scan,
      auditorName: scan.auditor_name,
      centerCode: scan.center_code?.toString(),
      centerName: scan.center_name,
      systemCount: scan.total_systems,
      scannedAt: scan.scanned_at,
      ipList: typeof scan.ipList === 'string' ? JSON.parse(scan.ipList) : (scan.ipList || []),
      devices: typeof scan.devices === 'string' ? JSON.parse(scan.devices) : (scan.devices || []),
      scanDetails: typeof scan.scanDetails === 'string' ? JSON.parse(scan.scanDetails) : (scan.scanDetails || {})
    }))
    
    return NextResponse.json({
      success: true,
      data: scans,
    })
  } catch (error) {
    console.error("Get scans error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
