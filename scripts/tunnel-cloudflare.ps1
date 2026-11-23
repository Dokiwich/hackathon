<#
.SYNOPSIS
  Expose a local FE or BE dev server over an instant HTTPS Cloudflare Quick Tunnel (*.trycloudflare.com).
.EXAMPLE
  .\scripts\tunnel-cloudflare.ps1 -App de2 -Service fe
  .\scripts\tunnel-cloudflare.ps1 -App de2 -Service be
  .\scripts\tunnel-cloudflare.ps1 -Port 5173
#>
param(
  [ValidateSet('de1', 'de2', 'de3', 'de4')]
  [string]$App = 'de2',

  [ValidateSet('fe', 'be')]
  [string]$Service = 'fe',

  [int]$Port = 0
)

$ErrorActionPreference = 'Stop'

function Get-DefaultPort([string]$Track, [string]$Svc) {
  if ($Svc -eq 'be') {
    switch ($Track) {
      'de1' { return 4001 }
      'de2' { return 4002 }
      'de3' { return 4003 }
      'de4' { return 4004 }
    }
  }
  switch ($Track) {
    'de1' { return 5174 }
    'de2' { return 5173 }
    'de3' { return 5175 }
    'de4' { return 5176 }
  }
}

$targetPort = $Port
if ($targetPort -le 0) {
  $targetPort = Get-DefaultPort $App $Service
}

$targetUrl = "http://127.0.0.1:$targetPort"
Write-Host "Starting Cloudflare Quick Tunnel for $App ($Service) -> $targetUrl" -ForegroundColor Cyan
Write-Host 'Make sure your local server is already running on that port. Press Ctrl+C to stop.' -ForegroundColor Yellow

if (Get-Command 'cloudflared' -ErrorAction SilentlyContinue) {
  & cloudflared tunnel --url $targetUrl
} else {
  if (-not (Get-Command 'npx' -ErrorAction SilentlyContinue)) {
    throw "Neither 'cloudflared' nor 'npx' was found in PATH."
  }
  & npx --yes cloudflared tunnel --url $targetUrl
}
