import { NextRequest, NextResponse } from "next/server"
import { query as mysqlQuery } from "@/lib/mysql"
import { requireAuth } from "@/lib/auth"

const formatToISTResponse = (dateVal: any) => {
  if (!dateVal) return dateVal
  if (dateVal instanceof Date) {
    return dateVal.toISOString().replace('Z', '+05:30')
  }
  if (typeof dateVal === 'string') {
    if (dateVal.endsWith('Z')) {
      return dateVal.replace('Z', '+05:30')
    }
    try {
      const d = new Date(dateVal)
      if (!isNaN(d.getTime())) {
        return d.toISOString().replace('Z', '+05:30')
      }
    } catch {}
  }
  return dateVal
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }
    
    const tableName = process.env.MYSQL_TABLE || 'Audit_Scanner'
    
    console.log("🔎 Searching MySQL for scan details:", id)
    const selectQuery = `SELECT * FROM \`${tableName}\` WHERE id = ? OR scanId = ?`
    const rows = await mysqlQuery(selectQuery, [id, id]) as any[]
    
    if (!rows || rows.length === 0) {
      console.log("❌ Scan not found for ID:", id)
      return NextResponse.json({ success: false, error: "Scan not found" }, { status: 404 })
    }
    
    const scan = rows[0]
    // Map MySQL columns to frontend expectations
    const mappedScan = {
      ...scan,
      auditorName: scan.auditor_name,
      centerCode: scan.center_code?.toString(),
      centerName: scan.center_name,
      systemCount: scan.total_systems,
      scannedAt: formatToISTResponse(scan.scanned_at),
      // Parse JSON fields
      ipList: typeof scan.ipList === 'string' ? JSON.parse(scan.ipList) : (scan.ipList || []),
      devices: typeof scan.devices === 'string' ? JSON.parse(scan.devices) : (scan.devices || []),
      scanDetails: typeof scan.scanDetails === 'string' ? JSON.parse(scan.scanDetails) : (scan.scanDetails || {})
    }
    
    console.log("✅ Scan details found in MySQL:", mappedScan.scanId)
    
    return NextResponse.json({ 
      success: true, 
      data: mappedScan 
    })
    
  } catch (error: any) {
    console.error("❌ Error fetching scan details:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
