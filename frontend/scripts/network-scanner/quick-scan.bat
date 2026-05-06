<# :
@echo off
title EXAM CENTER - NETWORK AUDIT SCANNER
mode con: cols=95 lines=32
color 0B
cls
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex (Get-Content '%~f0' -Encoding UTF8 -Raw)"
echo.
echo Press any key to exit...
pause >nul
exit /b
#>

# PowerShell Code Starts Here
$Host.UI.RawUI.WindowTitle = "EXAM CENTER - NETWORK AUDIT SCANNER"

# Helper for colorful output
function Write-Color {
    param(
        [string]$Text,
        [ConsoleColor]$Color = "Cyan",
        [bool]$NoNewLine = $false
    )
    Write-Host $Text -ForegroundColor $Color -NoNewline:$NoNewLine
}

# Clear and Banner
Clear-Host
Write-Color "=======================================================================" "Cyan"
Write-Color "          EXAM CENTER AUDIT SYSTEM - STANDALONE NETWORK SCANNER       " "Cyan"
Write-Color "             No Installation Required | Windows Batch v1.0          " "Cyan"
Write-Color "=======================================================================" "Cyan"
Write-Color ""

# 1. Network Detection
Write-Color "[*] Detecting active network adapters..." "Yellow"
$interfaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()
$networks = @()
foreach ($if in $interfaces) {
    if ($if.OperationalStatus -eq "Up" -and $if.NetworkInterfaceType -ne "Loopback") {
        $properties = $if.GetIPProperties()
        foreach ($addr in $properties.UnicastAddresses) {
            if ($addr.Address.AddressFamily -eq "InterNetwork") {
                $ipStr = $addr.Address.IPAddressToString
                $octets = $ipStr.Split('.')
                $isPrivate = $false
                if ($octets[0] -eq "192" -and $octets[1] -eq "168") { $isPrivate = $true }
                elseif ($octets[0] -eq "10") { $isPrivate = $true }
                elseif ($octets[0] -eq "172" -and [int]$octets[1] -ge 16 -and [int]$octets[1] -le 31) { $isPrivate = $true }
                
                if ($isPrivate) {
                    $subnet = "$($octets[0]).$($octets[1]).$($octets[2])"
                    $networks += [PSCustomObject]@{
                        Interface = $if.Name
                        IP = $ipStr
                        Subnet = $subnet
                        Mask = $addr.IPv4Mask.IPAddressToString
                        MAC = $if.GetPhysicalAddress().ToString()
                    }
                }
            }
        }
    }
}

if ($networks.Count -eq 0) {
    Write-Color "[!] Error: No active private network connections found!" "Red"
    Write-Color "Please connect to a network and try again." "Yellow"
    return
}

$selectedNet = $networks[0]
if ($networks.Count -gt 1) {
    Write-Color "`n[?] Multiple network interfaces detected:" "Yellow"
    for ($i = 0; $i -lt $networks.Count; $i++) {
        $net = $networks[$i]
        Write-Color "  [$($i + 1)] $($net.Interface) - IP: $($net.IP) (Subnet: $($net.Subnet).0/24)" "Gray"
    }
    Write-Host ""
    $selection = Read-Host "Select network interface [1-$($networks.Count)] (Default: 1)"
    if ($selection -match "^\d+$" -and [int]$selection -ge 1 -and [int]$selection -le $networks.Count) {
        $selectedNet = $networks[[int]$selection - 1]
    }
}

Write-Color "`nSelected Interface: " -NoNewLine "Gray"
Write-Color "$($selectedNet.Interface)" "Green"
Write-Color "Local IP:           " -NoNewLine "Gray"
Write-Color "$($selectedNet.IP)" "Green"
Write-Color "Scanning Subnet:    " -NoNewLine "Gray"
Write-Color "$($selectedNet.Subnet).0/24`n" "Green"

$defaultToken = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJzY2FubmVyIiwidXNlcm5hbWUiOiJzY2FubmVyLWRldmljZSIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiJTY2FubmVyIERldmljZSIsImlhdCI6MTc3Nzk2MTk0NywiZXhwIjoyMDkzNTM3OTQ3fQ.zWV0e4zWMGkPdO4kpRdmwOozAHs6Wsey-h_NnwG0Dt0"

# Check for offline pending scans
$offlineDir = "$env:USERPROFILE\.exam-scanner"
$offlineFile = Join-Path $offlineDir "pending-scans.json"
if (Test-Path $offlineFile) {
    $pendingRaw = Get-Content $offlineFile -Raw
    if ($pendingRaw) {
        $pending = @(ConvertFrom-Json $pendingRaw)
        if ($pending.Count -gt 0) {
            Write-Color "[*] Found $($pending.Count) pending offline scan(s)!" "Yellow"
            $syncAns = Read-Host "Do you want to sync these offline scans to the server now? (y/n)"
            if ($syncAns -eq "y" -or $syncAns -eq "Y") {
                Write-Color "`n[*] Syncing offline scans..." "Yellow"
                $synced = 0
                $failed = 0
                $updatedPending = @()
                
                $apiUrl = "https://network-scan.vercel.app"
                $token = $defaultToken
                
                $headers = @{
                    "Content-Type" = "application/json"
                    "Authorization" = "Bearer $token"
                }
                
                foreach ($scan in $pending) {
                    try {
                        $jsonScan = ConvertTo-Json $scan -Depth 5
                        $response = Invoke-RestMethod -Uri "$apiUrl/api/network-scan" -Method Post -Body $jsonScan -Headers $headers -TimeoutSec 10
                        if ($response.success) {
                            $synced++
                            Write-Color "  [+] Synced scan for center $($scan.centerCode)" "Green"
                        } else {
                            $failed++
                            $updatedPending += $scan
                            Write-Color "  [-] Failed center $($scan.centerCode): $($response.error)" "Red"
                        }
                    } catch {
                        $failed++
                        $updatedPending += $scan
                        Write-Color "  [-] Connection failed for center $($scan.centerCode)" "Red"
                    }
                }
                
                if ($updatedPending.Count -gt 0) {
                    $updatedPending | ConvertTo-Json -Depth 5 | Out-File $offlineFile
                } else {
                    Remove-Item $offlineFile -ErrorAction SilentlyContinue
                }
                Write-Color "`nSync completed: $synced synced, $failed failed.`n" "Green"
            }
        }
    }
}

# 2. Let's ask for Center details
Write-Color "[*] Enter Center Details for the New Scan (Press Enter for Defaults):" "Yellow"

$apiUrl = "https://network-scan.vercel.app"
$token = $defaultToken

$centerCode = Read-Host "Enter Center Code (e.g. 101)"
if (-not $centerCode) { $centerCode = "101" }

$centerName = Read-Host "Enter Center Name"
if (-not $centerName) { $centerName = "Test Exam Center" }

$city = Read-Host "Enter City"
if (-not $city) { $city = "Local City" }

$auditorName = Read-Host "Enter Auditor Name"
if (-not $auditorName) { $auditorName = "System Auditor" }

$contact = Read-Host "Enter Contact Number"
if (-not $contact) { $contact = "9876543210" }

# 3. High-Speed Parallel Ping Scan
Write-Color "`n[*] Phase 1: High-Speed Parallel Host Discovery (Ping Sweep)..." "Yellow"

$pingTasks = @()
$subnet = $selectedNet.Subnet

$startTime = Get-Date

foreach ($i in 1..254) {
    $ip = "$subnet.$i"
    $pingObj = New-Object System.Net.NetworkInformation.Ping
    $task = $pingObj.SendPingAsync($ip, 400)
    $pingTasks += [PSCustomObject]@{
        IP = $ip
        Task = $task
        PingObj = $pingObj
    }
}

# Wait for all tasks in parallel
[System.Threading.Tasks.Task]::WaitAll($pingTasks.Task)

# Extract alive hosts
$activeHosts = @()
foreach ($pt in $pingTasks) {
    $res = $pt.Task.Result
    if ($res.Status -eq "Success") {
        $activeHosts += $pt.IP
    }
    $pt.PingObj.Dispose()
}

$discoveryDuration = [Math]::Round(((Get-Date) - $startTime).TotalSeconds, 2)
Write-Color "[+] Discovered $($activeHosts.Count) active hosts in $discoveryDuration seconds!`n" "Green"

# 4. Device Identification (Ports, MAC, and Hostnames)
Write-Color "[*] Phase 2: Device Classification (Port Scanning and Name Resolution)..." "Yellow"

# Load ARP table to map MAC addresses
$arpTable = @{}
$arpOutput = arp -a
foreach ($line in $arpOutput) {
    if ($line -match "^\s*([0-9.]+)\s+([0-9a-f-]+)\s") {
        $ip = $Matches[1]
        $mac = $Matches[2].Replace("-", ":").ToUpper()
        $arpTable[$ip] = $mac
    }
}

# Fast TCP Port Checker Function
function Test-Port {
    param([string]$IP, [int]$Port, [int]$Timeout = 150)
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $connect = $tcp.BeginConnect($IP, $Port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne($Timeout, $true)
        if ($wait -and $tcp.Connected) {
            $tcp.EndConnect($connect)
            $tcp.Close()
            return $true
        }
    } catch {}
    $tcp.Close()
    return $false
}

$devices = @()
$pcs = @()
$printers = @()
$cameras = @()
$networkDevices = @()
$unknown = @()

$processed = 0
foreach ($ip in $activeHosts) {
    $processed++
    Write-Progress -Activity "Identifying Devices" -Status "Processing $ip ($processed/$($activeHosts.Count))" -PercentComplete (($processed / $activeHosts.Count) * 100)
    
    $mac = "Unknown"
    if ($arpTable.ContainsKey($ip)) {
        $mac = $arpTable[$ip]
    }
    
    # Simple Vendor Detection based on MAC OUI if available
    $vendor = "Unknown"
    $isCameraOUI = $false
    if ($mac -ne "Unknown" -and $mac.Length -ge 8) {
        $oui = $mac.Substring(0, 8).ToUpper()
        if ($oui -match "^(00:14:22|00:1E:C9|00:21:9B|00:22:19|14:FE:B5|28:F1:0E)$") { $vendor = "Dell" }
        elseif ($oui -match "^(00:0A:57|00:0B:CD|00:11:0A|30:8D:99|3C:A8:2A)$") { $vendor = "HP" }
        elseif ($oui -match "^(00:06:1B|00:12:FE|08:D4:0C|54:EE:75|B4:6D:83)$") { $vendor = "Lenovo" }
        elseif ($oui -match "^(00:15:00|00:1F:16|60:F8:1D)$") { $vendor = "Acer" }
        elseif ($oui -match "^(00:0C:6E|00:15:F2|10:BF:48)$") { $vendor = "ASUS" }
        elseif ($oui -match "^(00:18:0A|14:CC:20|20:DC:E6|50:C7:BF|74:EA:3A)$") { $vendor = "TP-Link" }
        elseif ($oui -match "^(00:0F:7C|00:1A:FA|00:3C:1F|18:68:CB|24:0F:9B|28:57:BE|2C:51:9B|2C:D1:41|38:D5:47|40:1E:17|44:19:B6|4C:BD:8F|54:C4:15|58:03:FB|5C:F9:6A|64:00:F1|68:6B:29|68:CB:6A|70:AF:25|74:E1:82|78:6B:28|7C:08:D9|80:08:B0|84:95:6F|84:B8:B8|8C:E1:17|A4:14:37|A4:16:E7|A8:03:2A|B4:A3:82|BC:AD:28|C0:56:27|C4:2F:90|D4:28:B2|DC:02:8E|E0:50:8B|EC:8E:B5|F0:11:43|F0:2F:4B|F8:24:41|F8:A0:97)$") { 
            $vendor = "Hikvision"
            $isCameraOUI = $true
        }
        elseif ($oui -match "^(00:19:4D|3C:EF:8C|48:2A:E3|4C:11:BF|54:2A:9C|90:02:A9|B8:A3:86|C8:42:05|D0:E4:43|D4:43:0E)$") {
            $vendor = "Dahua"
            $isCameraOUI = $true
        }
        elseif ($oui -match "^(24:52:6A|34:A3:95|54:A1:73|B4:B5:2F|A4:BA:DB)$") {
            $vendor = "CP PLUS"
            $isCameraOUI = $true
        }
    }
    
    # Hostname via DNS reverse lookup (fast local timeout)
    $hostname = $ip
    try {
        $hostEntry = [System.Net.Dns]::GetHostEntry($ip)
        if ($hostEntry.HostName) { $hostname = $hostEntry.HostName }
    } catch {}

    # Check device type using port checks and vendor OUI
    $deviceType = "unknown"
    
    # 1. Check if it's a camera based on OUI
    if ($isCameraOUI) {
        $deviceType = "camera"
    } else {
        # 2. Check camera specific ports (554 RTSP, 8000 Hikvision, 37777 Dahua)
        $isCameraPort = $false
        foreach ($p in @(554, 8000, 37777)) {
            if (Test-Port -IP $ip -Port $p) {
                $isCameraPort = $true
                break
            }
        }
        
        # 3. Check hostname for camera cues
        $isCameraHost = $false
        if ($hostname -match "camera|cctv|ipcam|cam_") {
            $isCameraHost = $true
        }
        
        if ($isCameraPort -or $isCameraHost) {
            $deviceType = "camera"
            if ($vendor -eq "Unknown") {
                $vendor = "IP Camera"
            }
        } else {
            # 4. Check if it's a PC (135, 445, 3389, 22)
            $isPC = $false
            foreach ($p in @(135, 445, 3389, 22)) {
                if (Test-Port -IP $ip -Port $p) {
                    $isPC = $true
                    break
                }
            }
            
            if ($isPC) {
                $deviceType = "pc"
            } else {
                # 5. Check if it's a printer (9100, 515)
                if (Test-Port -IP $ip -Port 9100 -or Test-Port -IP $ip -Port 515) {
                    $deviceType = "printer"
                } # 6. Check if it's a router/network-device (80, 443)
                elseif (Test-Port -IP $ip -Port 80 -or Test-Port -IP $ip -Port 443) {
                    $deviceType = "network-device"
                }
            }
        }
    }
    
    $devObj = [PSCustomObject]@{
        ip = $ip
        mac = $mac
        hostname = $hostname
        vendor = $vendor
        type = $deviceType
    }
    
    $devices += $devObj
    
    if ($deviceType -eq "pc") { $pcs += $devObj }
    elseif ($deviceType -eq "printer") { $printers += $devObj }
    elseif ($deviceType -eq "camera") { $cameras += $devObj }
    elseif ($deviceType -eq "network-device") { $networkDevices += $devObj }
    else { $unknown += $devObj }
}
Write-Progress -Activity "Identifying Devices" -Completed

# Print scan statistics
Write-Color "`n=======================================================================" "Cyan"
Write-Color "                             SCAN RESULTS                            " "Cyan"
Write-Color "=======================================================================" "Cyan"
Write-Color "  Total Active Devices: $($devices.Count)" "Green"
Write-Color "  Detected PCs:         $($pcs.Count)" "Green"
Write-Color "  Cameras (Excluded):   $($cameras.Count)" "Yellow"
Write-Color "  Printers (Excluded):  $($printers.Count)" "Gray"
Write-Color "  Network Devices:      $($networkDevices.Count)" "Gray"
Write-Color "  Unknown Devices:      $($unknown.Count)" "Gray"
Write-Color ""

if ($pcs.Count -gt 0) {
    Write-Color "--- Detected PCs ---" "Yellow"
    foreach ($pc in $pcs) {
        Write-Color "  $($pc.ip.PadRight(15)) | $($pc.mac.PadRight(17)) | $($pc.vendor.PadRight(12)) | $($pc.hostname)" "Green"
    }
}

if ($cameras.Count -gt 0) {
    Write-Color "`n--- Detected Cameras (Excluded) ---" "Yellow"
    foreach ($cam in $cameras) {
        Write-Color "  $($cam.ip.PadRight(15)) | $($cam.mac.PadRight(17)) | $($cam.vendor.PadRight(12)) | $($cam.hostname)" "Yellow"
    }
}

# 5. Prepare Payload & Send to API
$totalDuration = [Math]::Round(((Get-Date) - $startTime).TotalMilliseconds)

$payload = @{
    centerCode = $centerCode
    centerName = $centerName
    city = $city
    auditorName = $auditorName
    contact = $contact
    systemCount = [int]$pcs.Count
    ipList = $pcs.ip
    devices = $devices
    scanDetails = @{
        totalDevices = $devices.Count
        localIP = $selectedNet.IP
        subnet = $selectedNet.Subnet
        scannedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        scanDuration = $totalDuration
        deviceBreakdown = @{
            pcs = $pcs.Count
            printers = $printers.Count
            cameras = $cameras.Count
            networkDevices = $networkDevices.Count
            unknown = $unknown.Count
        }
    }
}

$jsonPayload = ConvertTo-Json $payload -Depth 5

Write-Color "`n[+] Sending scan data to backend server..." "Yellow"
Write-Color "API URL: $apiUrl/api/network-scan" "Gray"

try {
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    # Send request using Invoke-RestMethod
    $response = Invoke-RestMethod -Uri "$apiUrl/api/network-scan" -Method Post -Body $jsonPayload -Headers $headers -TimeoutSec 15
    
    if ($response.success) {
        Write-Color "`n[+] SUCCESS: Network scan data successfully saved to server!" "Green"
        Write-Color "Scan ID: $($response.data.scanId)" "Green"
        Write-Color "Message: $($response.data.message)" "Green"
    } else {
        Write-Color "`n[-] API ERROR: $($response.error)" "Red"
        # Save offline
        $offlineDir = "$env:USERPROFILE\.exam-scanner"
        if (-not (Test-Path $offlineDir)) { New-Item -ItemType Directory -Path $offlineDir -Force >$null }
        $offlineFile = Join-Path $offlineDir "pending-scans.json"
        
        $pending = @()
        if (Test-Path $offlineFile) {
            $pendingRaw = Get-Content $offlineFile -Raw
            if ($pendingRaw) {
                $pending = @(ConvertFrom-Json $pendingRaw)
            }
        }
        $pending += $payload
        $pending | ConvertTo-Json -Depth 5 | Out-File $offlineFile
        Write-Color "[*] Saved scan data offline to $offlineFile. You can sync it later." "Yellow"
    }
} catch {
    Write-Color "`n[-] CONNECTION ERROR: Failed to connect to server at $apiUrl" "Red"
    Write-Color "Error Details: $($_.Exception.Message)" "Red"
    
    # Save offline
    $offlineDir = "$env:USERPROFILE\.exam-scanner"
    if (-not (Test-Path $offlineDir)) { New-Item -ItemType Directory -Path $offlineDir -Force >$null }
    $offlineFile = Join-Path $offlineDir "pending-scans.json"
    
    $pending = @()
    if (Test-Path $offlineFile) {
        $pendingRaw = Get-Content $offlineFile -Raw
        if ($pendingRaw) {
            $pending = @(ConvertFrom-Json $pendingRaw)
        }
    }
    $pending += $payload
    $pending | ConvertTo-Json -Depth 5 | Out-File $offlineFile
    Write-Color "[*] Saved scan data offline to $offlineFile. You can sync it later." "Yellow"
}

Write-Color "`n=== Quick Scan Execution Complete ===" "Cyan"
