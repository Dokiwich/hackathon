<#
.SYNOPSIS
  Automated build and internet deployment script for Windows (PowerShell 5.1+ / 7+).
.EXAMPLE
  .\scripts\deploy.ps1 -App de2 -Target vercel -Prod
  .\scripts\deploy.ps1 -App all -Target cloudflare -Prod -ProjectName dong-nai-hackathon
  .\scripts\deploy.ps1 -App all -Target gh-pages -Prod
#>
param(
  [ValidateSet(
    'all',
    'de1', 'de2', 'de3', 'de4',
    'de-1-so-tay-chi-doan', 'de-2-tai-mat-cong-dan', 'de-3-ocop-len-san', 'de-4-chong-lua-101'
  )]
  [string]$App = 'all',

  [ValidateSet('vercel', 'cloudflare', 'netlify', 'gh-pages', 'preview')]
  [string]$Target = 'vercel',

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

function Get-RepoSlugName {
  try {
    $remoteUrl = (& git remote get-url origin 2>$null)
    if ($LASTEXITCODE -eq 0 -and $remoteUrl) {
      $trimmed = $remoteUrl.Trim() -replace '\.git$', ''
      $parts = $trimmed -split '[/:]'
      if ($parts.Length -gt 0 -and $parts[-1]) {
        return $parts[-1]
      }
    }
  } catch {
    # Fallback below
  }
  return 'hackathon'
}

$originalBasePath = $env:VITE_BASE_PATH

try {
  Assert-Tool 'node'
  Assert-Tool 'npm'

  if (Get-Command 'git' -ErrorAction SilentlyContinue) {
    $trackedEnv = (& git ls-files '.env*' 2>$null)
    if ($trackedEnv) {
      Write-Warning "Detected tracked .env files in git: $($trackedEnv -join ', '). Remove them from git tracking before publishing."
    }
  }

  $resolvedApp = Resolve-AppFolder $App
  $foldersToInstall = @()
  if ($resolvedApp -eq 'all') {
    $foldersToInstall = @('de-1-so-tay-chi-doan', 'de-2-tai-mat-cong-dan', 'de-3-ocop-len-san', 'de-4-chong-lua-101')
  } else {
    $foldersToInstall = @($resolvedApp)
  }

  if (-not $SkipInstall) {
    foreach ($folder in $foldersToInstall) {
      $nmPath = Join-Path (Join-Path $RepoRoot $folder) 'node_modules'
      if (-not (Test-Path $nmPath)) {
        Write-Host "[1/3] Installing dependencies in $folder..." -ForegroundColor Cyan
        & npm --prefix $folder install
        Assert-ExitCode "npm install ($folder)"
      }
    }
  }

  $deployDir = ''
  $effectiveProject = $ProjectName
  if (-not $effectiveProject) {
    if ($resolvedApp -eq 'all') {
      $effectiveProject = 'dong-nai-hackathon-hub'
    } else {
      $effectiveProject = $resolvedApp
    }
  }

  Write-Host "[2/3] Building '$resolvedApp' for target '$Target'..." -ForegroundColor Cyan
  if ($resolvedApp -eq 'all') {
    if ($Target -eq 'gh-pages') {
      $repoName = Get-RepoSlugName
      $env:VITE_BASE_PATH = "/$repoName/"
    } else {
      $env:VITE_BASE_PATH = '/'
    }
    & node (Join-Path $RepoRoot 'scripts\build-all-pages.mjs')
    Assert-ExitCode 'build-all-pages.mjs'
    $deployDir = Join-Path $RepoRoot 'dist-pages'
  } else {
    $appRoot = Join-Path $RepoRoot $resolvedApp
    if ($Target -eq 'gh-pages') {
      $repoName = Get-RepoSlugName
      $env:VITE_BASE_PATH = "/$repoName/"
      & node (Join-Path $appRoot 'scripts\build-pages.mjs')
      Assert-ExitCode "build-pages.mjs ($resolvedApp)"
    } else {
      $env:VITE_BASE_PATH = '/'
      & npm --prefix $resolvedApp run build
      Assert-ExitCode "npm run build ($resolvedApp)"
    }
    $deployDir = Join-Path $appRoot 'dist'
  }

  Write-Host "[3/3] Deploying '$deployDir' to '$Target'..." -ForegroundColor Cyan
  switch ($Target) {
    'vercel' {
      $args = @('--yes', 'vercel@latest', 'deploy', $deployDir)
      if ($Prod) { $args += '--prod' }
      & npx @args
      Assert-ExitCode 'Vercel deploy'
    }
    'cloudflare' {
      $args = @('--yes', 'wrangler@latest', 'pages', 'deploy', $deployDir, '--project-name', $effectiveProject)
      if ($Prod) {
        $args += @('--branch', 'main')
      } else {
        $args += @('--branch', 'preview')
      }
      & npx @args
      Assert-ExitCode 'Cloudflare Pages deploy'
    }
    'netlify' {
      $args = @('--yes', 'netlify-cli@latest', 'deploy', "--dir=$deployDir")
      if ($Prod) { $args += '--prod' }
      & npx @args
      Assert-ExitCode 'Netlify deploy'
    }
    'gh-pages' {
      & npx --yes gh-pages@latest -d $deployDir
      Assert-ExitCode 'gh-pages deploy'
    }
    'preview' {
      if ($resolvedApp -eq 'all') {
        & npx --yes serve@latest $deployDir
        Assert-ExitCode 'serve dist-pages'
      } else {
        & npm --prefix $resolvedApp run preview
        Assert-ExitCode 'vite preview'
      }
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
