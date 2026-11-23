<#
.SYNOPSIS
  One-command build and deploy to Cloudflare Pages for any track (PowerShell 5.1+ / 7+).
.EXAMPLE
  .\scripts\deploy-cloudflare.ps1 -App de2
  .\scripts\deploy-cloudflare.ps1 -App de1 -ProjectName chi-doan-dong-nai
  .\scripts\deploy-cloudflare.ps1 -App de3 -Preview
#>
param(
  [ValidateSet(
    'de1', 'de2', 'de3', 'de4',
    'de-1-so-tay-chi-doan', 'de-2-tai-mat-cong-dan', 'de-3-ocop-len-san', 'de-4-chong-lua-101'
  )]
  [string]$App = 'de2',

  [string]$ProjectName = '',

  [switch]$Preview,

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

function Resolve-TrackFolder([string]$Alias) {
  switch ($Alias) {
    'de1' { return 'de-1-so-tay-chi-doan' }
    'de2' { return 'de-2-tai-mat-cong-dan' }
    'de3' { return 'de-3-ocop-len-san' }
    'de4' { return 'de-4-chong-lua-101' }
    default { return $Alias }
  }
}

function Invoke-WranglerQuiet([string[]]$WArgs) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & npx @WArgs 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
  }
  finally {
    $ErrorActionPreference = $prev
  }
}

$originalBasePath = $env:VITE_BASE_PATH

try {
  Assert-Tool 'node'
  Assert-Tool 'npm'

  $folder = Resolve-TrackFolder $App
  $appRoot = Join-Path $RepoRoot $folder
  if (-not (Test-Path $appRoot)) {
    throw "Track folder not found: $appRoot"
  }

  if (Get-Command 'git' -ErrorAction SilentlyContinue) {
    $trackedEnv = (& git ls-files "$folder/.env*" 2>$null)
    if ($trackedEnv) {
      Write-Warning "Detected tracked .env files: $($trackedEnv -join ', '). Remove them from git tracking."
    }
  }

  if (-not $SkipInstall -and -not (Test-Path (Join-Path $appRoot 'node_modules'))) {
    Write-Host "[1/4] Installing npm dependencies in $folder..." -ForegroundColor Cyan
    & npm --prefix $folder install
    Assert-ExitCode "npm install ($folder)"
  }

  Write-Host "[2/4] Checking Cloudflare authentication..." -ForegroundColor Cyan
  if (-not $env:CLOUDFLARE_API_TOKEN) {
    $loggedIn = Invoke-WranglerQuiet @('--yes', 'wrangler@latest', 'whoami')
    if (-not $loggedIn) {
      Write-Host 'Opening browser to sign in to Cloudflare Wrangler...' -ForegroundColor Yellow
      & npx --yes wrangler@latest login
      Assert-ExitCode 'wrangler login'
    }
  }

  $effectiveProject = $ProjectName
  if (-not $effectiveProject) {
    $effectiveProject = $folder
  }

  Write-Host "[3/4] Building production bundle ($folder, VITE_BASE_PATH=/)..." -ForegroundColor Cyan
  $env:VITE_BASE_PATH = '/'
  & npm --prefix $folder run build
  Assert-ExitCode "npm run build ($folder)"

  $distDir = Join-Path $appRoot 'dist'
  foreach ($req in @('index.html', '_redirects', '_headers')) {
    if (-not (Test-Path (Join-Path $distDir $req))) {
      throw "Missing required Cloudflare Pages asset: $distDir\$req"
    }
  }

  $branch = 'main'
  if ($Preview) {
    $branch = 'preview'
  }

  Write-Host "[4/4] Publishing '$folder/dist' to Cloudflare Pages project '$effectiveProject' (branch: $branch)..." -ForegroundColor Cyan
  Invoke-WranglerQuiet @('--yes', 'wrangler@latest', 'pages', 'project', 'create', $effectiveProject, '--production-branch=main') | Out-Null

  & npx --yes wrangler@latest pages deploy $distDir --project-name $effectiveProject --branch $branch
  Assert-ExitCode 'wrangler pages deploy'

  Write-Host "[DONE] Cloudflare Pages live URL: https://$effectiveProject.pages.dev" -ForegroundColor Green
}
finally {
  if ($null -eq $originalBasePath) {
    Remove-Item Env:VITE_BASE_PATH -ErrorAction SilentlyContinue
  } else {
    $env:VITE_BASE_PATH = $originalBasePath
  }
  Pop-Location
}
