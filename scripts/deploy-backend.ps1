<#
.SYNOPSIS
  Pre-flight check (lint + test) and deployment helper for any track's backend API (PowerShell 5.1+ / 7+).
.EXAMPLE
  .\scripts\deploy-backend.ps1 -App de2 -Target cloudrun -Region asia-southeast1
  .\scripts\deploy-backend.ps1 -App de1 -Target docker
#>
param(
  [ValidateSet(
    'de1', 'de2', 'de3', 'de4',
    'de-1-so-tay-chi-doan', 'de-2-tai-mat-cong-dan', 'de-3-ocop-len-san', 'de-4-chong-lua-101'
  )]
  [string]$App = 'de2',

  [ValidateSet('cloudrun', 'fly', 'docker')]
  [string]$Target = 'cloudrun',

  [string]$Region = 'asia-southeast1',

  [string]$ProjectId = ''
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

function Resolve-TrackInfo([string]$Alias) {
  switch ($Alias) {
    'de1' { return @{ folder = 'de-1-so-tay-chi-doan'; service = 'so-tay-chi-doan-api' } }
    'de-1-so-tay-chi-doan' { return @{ folder = 'de-1-so-tay-chi-doan'; service = 'so-tay-chi-doan-api' } }
    'de2' { return @{ folder = 'de-2-tai-mat-cong-dan'; service = 'tai-mat-cong-dan-api' } }
    'de-2-tai-mat-cong-dan' { return @{ folder = 'de-2-tai-mat-cong-dan'; service = 'tai-mat-cong-dan-api' } }
    'de3' { return @{ folder = 'de-3-ocop-len-san'; service = 'ocop-dong-nai-api' } }
    'de-3-ocop-len-san' { return @{ folder = 'de-3-ocop-len-san'; service = 'ocop-dong-nai-api' } }
    'de4' { return @{ folder = 'de-4-chong-lua-101'; service = 'chong-lua-101-api' } }
    'de-4-chong-lua-101' { return @{ folder = 'de-4-chong-lua-101'; service = 'chong-lua-101-api' } }
    default { throw "Unknown track '$Alias'." }
  }
}

try {
  Assert-Tool 'node'
  Assert-Tool 'npm'

  $info = Resolve-TrackInfo $App
  $backendDir = Join-Path (Join-Path $RepoRoot $info.folder) 'backend'
  if (-not (Test-Path $backendDir)) {
    throw "Backend folder not found: $backendDir"
  }

  if (Get-Command 'git' -ErrorAction SilentlyContinue) {
    $trackedEnv = (& git ls-files "$($info.folder)/backend/.env*" 2>$null)
    if ($trackedEnv) {
      Write-Warning "Detected tracked .env files: $($trackedEnv -join ', '). Remove from git before deploying."
    }
  }

  $nmDir = Join-Path $backendDir 'node_modules'
  if (-not (Test-Path $nmDir)) {
    Write-Host "[1/3] Installing backend dependencies for $($info.folder)..." -ForegroundColor Cyan
    & npm --prefix $backendDir install
    Assert-ExitCode 'npm install backend'
  }

  Write-Host "[2/3] Running backend lint & tests ($($info.service))..." -ForegroundColor Cyan
  & npm --prefix $backendDir run lint
  Assert-ExitCode 'backend lint'
  & npm --prefix $backendDir run test
  Assert-ExitCode 'backend test'

  Write-Host "[3/3] Deploying '$($info.service)' via '$Target'..." -ForegroundColor Cyan
  switch ($Target) {
    'cloudrun' {
      Assert-Tool 'gcloud'
      $gArgs = @('run', 'deploy', $info.service, '--source', $backendDir, '--region', $Region, '--allow-unauthenticated')
      if ($ProjectId) {
        $gArgs += @('--project', $ProjectId)
      }
      & gcloud @gArgs
      Assert-ExitCode 'gcloud run deploy'
    }
    'fly' {
      Assert-Tool 'flyctl'
      Push-Location $backendDir
      try {
        & flyctl deploy
        Assert-ExitCode 'flyctl deploy'
      }
      finally {
        Pop-Location
      }
    }
    'docker' {
      Assert-Tool 'docker'
      & docker build -t "$($info.service):latest" $backendDir
      Assert-ExitCode 'docker build'
    }
  }

  Write-Host "[DONE] Backend workflow for '$($info.service)' -> '$Target' completed." -ForegroundColor Green
}
finally {
  Pop-Location
}
