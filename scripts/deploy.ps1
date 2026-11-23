<#
.SYNOPSIS
  Unified frontend build and cloud deploy script for Windows (PowerShell 5.1+ / 7+).
.EXAMPLE
  .\scripts\deploy.ps1 -App de2 -Target cloudflare -Prod
  .\scripts\deploy.ps1 -App de1 -Target vercel -Prod
#>
param(
  [ValidateSet(
    'de1', 'de2', 'de3', 'de4',
    'de-1-so-tay-chi-doan', 'de-2-tai-mat-cong-dan', 'de-3-ocop-len-san', 'de-4-chong-lua-101'
  )]
  [string]$App = 'de2',

  [ValidateSet('cloudflare', 'vercel', 'netlify', 'preview')]
  [string]$Target = 'cloudflare',

  [switch]$Prod,

  [string]$ProjectName = '',

  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

function Assert-Tool([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required tool '$Name' was not found in PATH."
  }
}

function Assert-ExitCode([string]$StepName) {
  if ($LASTEXITCODE -ne 0) {
    throw "$StepName failed with exit code $LASTEXITCODE."
  }
}

function Resolve-AppFolder([string]$Alias) {
  switch ($Alias) {
    'de1' { return 'de-1-so-tay-chi-doan' }
    'de2' { return 'de-2-tai-mat-cong-dan' }
    'de3' { return 'de-3-ocop-len-san' }
    'de4' { return 'de-4-chong-lua-101' }
    default { return $Alias }
  }
}

$originalBasePath = $env:VITE_BASE_PATH

try {
  Assert-Tool 'node'
  Assert-Tool 'npm'

  $resolvedApp = Resolve-AppFolder $App
  $appRoot = Join-Path $RepoRoot $resolvedApp
  if (-not (Test-Path $appRoot)) {
    throw "Track folder not found: $appRoot"
  }

  if ($Target -eq 'cloudflare') {
    $cfArgs = @{ App = $resolvedApp }
    if ($ProjectName) { $cfArgs.ProjectName = $ProjectName }
    if (-not $Prod) { $cfArgs.Preview = $true }
    if ($SkipInstall) { $cfArgs.SkipInstall = $true }
    & (Join-Path $PSScriptRoot 'deploy-cloudflare.ps1') @cfArgs
    return
  }

  if (-not $SkipInstall -and -not (Test-Path (Join-Path $appRoot 'node_modules'))) {
    Write-Host "[1/3] Installing dependencies in $resolvedApp..." -ForegroundColor Cyan
    & npm --prefix $resolvedApp install
    Assert-ExitCode "npm install ($resolvedApp)"
  }

  Write-Host "[2/3] Building '$resolvedApp' for target '$Target'..." -ForegroundColor Cyan
  $env:VITE_BASE_PATH = '/'
  & npm --prefix $resolvedApp run build
  Assert-ExitCode "npm run build ($resolvedApp)"
  $deployDir = Join-Path $appRoot 'dist'

  Write-Host "[3/3] Deploying '$deployDir' to '$Target'..." -ForegroundColor Cyan
  switch ($Target) {
    'vercel' {
      $args = @('--yes', 'vercel@latest', 'deploy', $deployDir)
      if ($Prod) { $args += '--prod' }
      & npx @args
      Assert-ExitCode 'Vercel deploy'
    }
    'netlify' {
      $args = @('--yes', 'netlify-cli@latest', 'deploy', "--dir=$deployDir")
      if ($Prod) { $args += '--prod' }
      & npx @args
      Assert-ExitCode 'Netlify deploy'
    }
    'preview' {
      & npm --prefix $resolvedApp run preview
      Assert-ExitCode 'vite preview'
    }
  }

  Write-Host "[DONE] Deployment workflow for '$resolvedApp' -> '$Target' completed." -ForegroundColor Green
}
finally {
  if ($null -eq $originalBasePath) {
    Remove-Item Env:VITE_BASE_PATH -ErrorAction SilentlyContinue
  } else {
    $env:VITE_BASE_PATH = $originalBasePath
  }
  Pop-Location
}
