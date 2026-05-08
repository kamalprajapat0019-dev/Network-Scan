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
  Download,
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

  const exportToCSV = () => {
    if (!devicesList || devicesList.length === 0) return;
    
    // Header row
    const headers = ["Type", "IP Address", "MAC Address", "Hostname / Name", "Manufacturer"]
    
    // Convert devices to rows, escaping CSV values to prevent formula injection
    const escapeCSV = (val: string) => {
      if (val === undefined || val === null) return "";
      let escaped = val.toString().replace(/"/g, '""');
      if (escaped.startsWith("=") || escaped.startsWith("+") || escaped.startsWith("-") || escaped.startsWith("@")) {
        escaped = `'${escaped}`;
      }
      return `"${escaped}"`;
    };

    const rows = devicesList.map((device: any) => [
      escapeCSV(device.type || "unknown"),
      escapeCSV(device.ip || ""),
      escapeCSV(device.mac || "Unknown"),
      escapeCSV(device.hostname || "---"),
      escapeCSV(device.vendor || "Unknown")
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `network_devices_${scan?.scanId || id}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
    <div className="space-y-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Network Scan Details</h1>
            <p className="text-sm text-slate-500 mt-1">
              Scan ID: <span className="font-mono font-medium">{scan?.scanId || id}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>{scan?.scannedAt ? new Date(scan.scannedAt).toLocaleString() : "Date N/A"}</span>
          </div>
          {getStatusBadge(scan?.status || "unknown")}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
        <Card className="border-t-4 border-t-blue-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Venue Info
            </CardTitle>
            <CardDescription>Location and Venue details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Venue Person</p>
                <p className="font-medium text-sm">{scan.auditorName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Venue Code</p>
                <p className="font-medium font-mono text-sm">{scan.centerCode}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Venue Name</p>
              <p className="font-medium text-sm">{scan.centerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">City</p>
                <p className="font-medium text-sm">{scan.city}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">State</p>
                <p className="font-medium text-sm">{scan.scanDetails?.state || "N/A"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Lan No.</p>
                <p className="font-medium font-mono text-sm">{scan.scanDetails?.lanNo || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Contact</p>
                <p className="font-medium text-sm">{scan.contact}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="h-5 w-5 text-green-600" />
              Network Info
            </CardTitle>
            <CardDescription>Subnet and Interface details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Local IP</span>
              </div>
              <span className="font-mono font-semibold text-blue-700">{scan.scanDetails?.localIP || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Subnet</span>
              </div>
              <span className="font-mono font-semibold text-green-700">{scan.scanDetails?.subnet || "N/A"}.0/24</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <span className="font-semibold text-orange-700">
                {scan.scanDetails?.scanDuration ? `${Number(scan.scanDetails.scanDuration).toFixed(2)}s` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Total Devices</span>
              </div>
              <span className="text-lg font-bold text-purple-700">{scan.scanDetails?.totalDevices || scan.systemCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-600 lg:col-span-1 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Device Breakdown
            </CardTitle>
            <CardDescription>Device types detected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">PCs</span>
                </div>
                <span className="font-bold text-blue-800">{scan.scanDetails?.deviceBreakdown?.pcs || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Printers</span>
                </div>
                <span className="font-bold text-orange-800">{scan.scanDetails?.deviceBreakdown?.printers || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Cameras</span>
                </div>
                <span className="font-bold text-purple-800">{scan.scanDetails?.deviceBreakdown?.cameras || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Unknown</span>
                </div>
                <span className="font-bold text-slate-800">{scan.scanDetails?.deviceBreakdown?.unknown || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-slate-600" />
                Discovered Devices
              </CardTitle>
              <CardDescription>Full inventory of all active hosts on the network</CardDescription>
            </div>
            <div className="flex items-center gap-3 self-start">
              {devicesList.length > 0 && (
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-slate-200 hover:bg-slate-100 text-xs font-semibold h-9 px-3"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              )}
              <Badge variant="secondary" className="px-3 py-1 h-9 flex items-center justify-center font-semibold text-xs">
                {devicesList.length} Active Devices
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[80px] text-center font-semibold">Type</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">IP Address</TableHead>
                  <TableHead className="font-semibold min-w-[140px]">MAC Address</TableHead>
                  <TableHead className="font-semibold min-w-[150px]">Hostname / Name</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Manufacturer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devicesList.length > 0 ? (
                  devicesList.map((device: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getDeviceIcon(device.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-blue-600">
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
                      <TableCell>
                        {device.vendor === "Unknown" ? (
                          <span className="text-slate-400 italic">Unknown Vendor</span>
                        ) : (
                          <Badge variant="outline" className="font-normal border-slate-200 bg-slate-50">
                            {device.vendor}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 py-8">
                        <Network className="h-12 w-12 text-slate-300" />
                        <div className="text-center">
                          <p className="text-slate-500 font-medium mb-1">No detailed device data available</p>
                          <p className="text-xs text-slate-400">Detailed data is only available for scans performed after the system update.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
