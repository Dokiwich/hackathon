<#
.SYNOPSIS
  Initialize isolated .codegraph/ indexes per standalone track folder (PowerShell 5.1+ / 7+).
.EXAMPLE
  .\scripts\init-codegraph.ps1 -App all
  .\scripts\init-codegraph.ps1 -App de2
#>
param(
  [ValidateSet(
    'all',
    'de1', 'de2', 'de3', 'de4',
    'de-1-so-tay-chi-doan', 'de-2-tai-mat-cong-dan', 'de-3-ocop-len-san', 'de-4-chong-lua-101'
  )]
  [string]$App = 'all'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command 'codegraph' -ErrorAction SilentlyContinue)) {
  throw "CLI 'codegraph' was not found in PATH. Install or upgrade it before running this script."
}

function Resolve-TrackList([string]$Target) {
  switch ($Target) {
    'all' { return @('de-1-so-tay-chi-doan', 'de-2-tai-mat-cong-dan', 'de-3-ocop-len-san', 'de-4-chong-lua-101') }
    'de1' { return @('de-1-so-tay-chi-doan') }
    'de2' { return @('de-2-tai-mat-cong-dan') }
    'de3' { return @('de-3-ocop-len-san') }
    'de4' { return @('de-4-chong-lua-101') }
    default { return @($Target) }
  }
}

$tracks = Resolve-TrackList $App

foreach ($folder in $tracks) {
  $trackPath = Join-Path $RepoRoot $folder
  if (-not (Test-Path $trackPath)) {
    throw "Track folder not found: $trackPath"
  }
  Write-Host "[codegraph] Initializing index in $folder..." -ForegroundColor Cyan
  Push-Location $trackPath
  try {
    & codegraph init
    if ($LASTEXITCODE -ne 0) {
      throw "codegraph init failed in $folder with exit code $LASTEXITCODE."
    }
  }
  finally {
    Pop-Location
  }
}

Write-Host '[DONE] CodeGraph initialization completed.' -ForegroundColor Green
