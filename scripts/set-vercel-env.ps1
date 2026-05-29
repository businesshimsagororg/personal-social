# Run from repo root after: npx vercel link --yes --project personal-social
# Sets required env vars on Vercel (production + preview) from your local .env

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot + "\.."

if (-not (Test-Path ".env")) {
  Write-Error ".env not found. Create it from .env.example first."
}

Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $eq = $line.IndexOf("=")
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $val = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
  Set-Variable -Name "env_$key" -Value $val -Scope Script
}

$productionUrl = "https://personal-social.vercel.app"
$vars = @{
  DATABASE_URL          = $env_DATABASE_URL
  DIRECT_URL            = $env_DIRECT_URL
  JWT_SECRET            = $env_JWT_SECRET
  NEXTAUTH_SECRET       = $env_NEXTAUTH_SECRET
  NEXTAUTH_URL          = $productionUrl
  NEXT_PUBLIC_APP_URL   = $productionUrl
  USE_MOCK_EMAIL        = $env_USE_MOCK_EMAIL
  REQUIRE_ADMIN_APPROVAL = $env_REQUIRE_ADMIN_APPROVAL
}

foreach ($name in $vars.Keys) {
  $value = $vars[$name]
  if (-not $value) { Write-Warning "Skipping $name (empty)"; continue }
  foreach ($target in @("production", "preview")) {
    npx vercel env rm $name $target --yes 2>$null | Out-Null
    npx vercel env add $name $target --value $value --yes --force
    Write-Host "Set $name ($target)"
  }
}

Write-Host "Done. Redeploy: npx vercel --prod"
