"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Network,
  Monitor,
  Printer,
  Camera,
  Shield,
  Search,
  Globe,
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { DeviceInfo, NetworkScan } from "@/lib/types"

export default function ScanDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [scan, setScan] = useState<NetworkScan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) {
      fetchScanDetails()
    }
  }, [id])

  const fetchScanDetails = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/network-scan-details?id=${id}`)
      console.log("📡 API Response status:", res.status)
      
      const data = await res.json()
      console.log("📦 API Data received:", data)

      if (data.success) {
        console.log("✅ Data fetch successful")
        setScan(data.data)
      } else {
        setError(data.error || "Failed to fetch scan details")
      }
    } catch (err) {
      console.error("❌ Fetch error:", err)
      setError("Failed to fetch scan details. Please check if the backend server is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "pc":
        return <Monitor className="h-4 w-4 text-blue-500" />
      case "printer":
        return <Printer className="h-4 w-4 text-orange-500" />
      case "camera":
        return <Camera className="h-4 w-4 text-purple-500" />
      case "network":
        return <Network className="h-4 w-4 text-green-500" />
      default:
        return <Cpu className="h-4 w-4 text-slate-500" />
    }
  }

  const getDevices = () => {
    if (scan?.devices && scan.devices.length > 0) return scan.devices;
    if (scan?.scanDetails?.devices && Array.isArray(scan.scanDetails.devices)) return scan.scanDetails.devices;
    return [];
  };

  const devicesList = getDevices();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-destructive font-medium">{error || "Scan not found"}</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scan Details</h1>
            <p className="text-sm text-slate-500">
              Scan ID: {scan?.scanId || id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white/50">
            {scan?.scannedAt ? new Date(scan.scannedAt).toLocaleString() : "Date N/A"}
          </Badge>
          <Badge className={scan?.status === "verified" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
            {scan.status || "Unknown"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-t-4 border-t-blue-600">
          <CardHeader>
            <CardTitle className="text-lg">Center Info</CardTitle>
            <CardDescription>Location and Auditor details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Auditor</p>
              <p className="font-medium text-lg">{scan.auditorName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Center Code & Name</p>
              <p className="font-medium">{scan.centerCode} - {scan.centerName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">City</p>
              <p className="font-medium">{scan.city}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Contact</p>
              <p className="font-medium">{scan.contact}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 border-t-4 border-t-green-600">
          <CardHeader>
            <CardTitle className="text-lg">Network Info</CardTitle>
            <CardDescription>Subnet and Interface details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-blue-500" />
                <span>Local IP</span>
              </div>
              <span className="font-mono font-bold">{scan.scanDetails?.localIP || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Network className="h-4 w-4 text-green-500" />
                <span>Subnet</span>
              </div>
              <span className="font-mono font-bold">{scan.scanDetails?.subnet || "N/A"}.0/24</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>Duration</span>
              </div>
              <span className="font-bold">
                {scan.scanDetails?.scanDuration ? `${Number(scan.scanDetails.scanDuration).toFixed(2)}s` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-purple-500" />
                <span>Total Devices</span>
              </div>
              <span className="text-xl font-bold">{scan.scanDetails?.totalDevices || scan.systemCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 border-t-4 border-t-purple-600">
          <CardHeader>
            <CardTitle className="text-lg">Breakdown</CardTitle>
            <CardDescription>Device types detected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <Monitor className="h-4 w-4" />
                <span>PCs</span>
              </div>
              <span className="font-bold text-blue-800">{scan.scanDetails?.deviceBreakdown?.pcs || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                <Printer className="h-4 w-4" />
                <span>Printers</span>
              </div>
              <span className="font-bold text-orange-800">{scan.scanDetails?.deviceBreakdown?.printers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                <Camera className="h-4 w-4" />
                <span>Cameras</span>
              </div>
              <span className="font-bold text-purple-800">{scan.scanDetails?.deviceBreakdown?.cameras || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Search className="h-4 w-4" />
                <span>Unknown</span>
              </div>
              <span className="font-bold text-slate-800">{scan.scanDetails?.deviceBreakdown?.unknown || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Discovered Devices</CardTitle>
              <CardDescription>Full inventory of all active hosts on the network</CardDescription>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {devicesList.length} Active Devices
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[100px] text-center">Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>Hostname / Name</TableHead>
                <TableHead>Manufacturer / Vendor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devicesList.length > 0 ? (
                devicesList.map((device: any, idx: number) => (
                  <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {getDeviceIcon(device.type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-blue-600">
                      {device.ip}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">
                      {device.mac === "Unknown" ? (
                        <span className="text-slate-400 italic">Not detected</span>
                      ) : (
                        device.mac
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.hostname || "---"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {device.vendor === "Unknown" ? (
                        <span className="text-slate-400 italic">Unknown Vendor</span>
                      ) : (
                        <Badge variant="outline" className="font-normal border-slate-200">
                          {device.vendor}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Network className="h-10 w-10 text-slate-300" />
                      <p className="text-slate-500 font-medium">No detailed device data available for this scan</p>
                      <p className="text-xs text-slate-400">Detailed data is only available for scans performed after the system update.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
