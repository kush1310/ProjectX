<#
.SYNOPSIS
    Verifies and provisions CharusatNeeds ImageKit CDN directory hierarchy.
.DESCRIPTION
    Ensures idempotent creation across base directories and vendor-specific paths.
    Safe to execute repeatedly. Does NOT log API keys or secrets.
.PARAMETER PrivateKey
    Optional ImageKit private key override.
#>
param (
    [string]$PrivateKey = $env:IMAGEKIT_PRIVATE_KEY,
    [string]$UrlEndpoint = $env:IMAGEKIT_URL_ENDPOINT
)

if (-not $UrlEndpoint) {
    $UrlEndpoint = "https://ik.imagekit.io/cyseckush/"
}

if (-not $PrivateKey) {
    Write-Host "[ERROR] IMAGEKIT_PRIVATE_KEY environment variable is not set." -ForegroundColor Red
    Write-Host "Please pass -PrivateKey <key> or set `$env:IMAGEKIT_PRIVATE_KEY."
    exit 1
}

$BaseFolders = @(
    @{ Name = "charusatneeds"; Parent = "/" },
    @{ Name = "canteens";     Parent = "/charusatneeds" },
    @{ Name = "menu-items";   Parent = "/charusatneeds" },
    @{ Name = "offers";       Parent = "/charusatneeds" },
    @{ Name = "banners";      Parent = "/charusatneeds" },
    @{ Name = "videos";       Parent = "/charusatneeds" }
)

$VendorTestFolders = @(
    @{ Name = "campus-bites"; Parent = "/charusatneeds/menu-items" },
    @{ Name = "campus-bites"; Parent = "/charusatneeds/canteens" },
    @{ Name = "campus-bites"; Parent = "/charusatneeds/offers" }
)

$AuthBytes = [System.Text.Encoding]::UTF8.GetBytes("${PrivateKey}:")
$AuthBase64 = [Convert]::ToBase64String($AuthBytes)
$Headers = @{
    "Authorization" = "Basic $AuthBase64"
    "Content-Type"  = "application/json"
    "Accept"        = "application/json"
    "User-Agent"    = "CharusatNeeds-FolderVerifier/1.0"
}

function Ensure-ImageKitFolder {
    param (
        [string]$FolderName,
        [string]$ParentPath
    )

    $Body = @{
        folderName       = $FolderName
        parentFolderPath = $ParentPath
    } | ConvertTo-Json

    try {
        $Response = Invoke-RestMethod -Uri "https://api.imagekit.io/v1/folder/" -Method Post -Headers $Headers -Body $Body -TimeoutSec 10 -ErrorAction Stop
        return $true
    } catch {
        $ErrorMsg = $_.Exception.Message
        if ($ErrorMsg -like "*already exists*") {
            return $true
        }
        return $false
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  CharusatNeeds ImageKit CDN - Folder Hierarchy Verification" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  CDN Endpoint: $UrlEndpoint"
Write-Host "  Private Key:  [PROTECTED - length $($PrivateKey.Length) chars]"
Write-Host "-----------------------------------------------------------------"

$AllPassed = $true

foreach ($f in $BaseFolders) {
    $FullPath = ($f.Parent.TrimEnd('/') + '/' + $f.Name).TrimStart('/')
    $Result = Ensure-ImageKitFolder -FolderName $f.Name -ParentPath $f.Parent
    if ($Result) {
        Write-Host "  -> Path: $($FullPath.PadRight(35)) Status: VERIFIED [OK]" -ForegroundColor Green
    } else {
        Write-Host "  -> Path: $($FullPath.PadRight(35)) Status: FAILED [X]" -ForegroundColor Red
        $AllPassed = $false
    }
}

Write-Host "-----------------------------------------------------------------"
Write-Host "Testing dynamic vendor folder provisioning:"

foreach ($v in $VendorTestFolders) {
    $FullPath = ($v.Parent.TrimEnd('/') + '/' + $v.Name).TrimStart('/')
    $Result = Ensure-ImageKitFolder -FolderName $v.Name -ParentPath $v.Parent
    if ($Result) {
        Write-Host "  -> Vendor Path: $($FullPath.PadRight(30)) Status: VERIFIED [OK]" -ForegroundColor Green
    } else {
        Write-Host "  -> Vendor Path: $($FullPath.PadRight(30)) Status: FAILED [X]" -ForegroundColor Red
        $AllPassed = $false
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
if ($AllPassed) {
    Write-Host "RESULT: All ImageKit folders successfully verified and provisioned." -ForegroundColor Green
    exit 0
} else {
    Write-Host "RESULT: Some folders failed to provision." -ForegroundColor Red
    exit 1
}
