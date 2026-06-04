# Публикация проекта на GitHub (один раз нужен вход в аккаунт в браузере).
# Запуск из корня репозитория:
#   powershell -ExecutionPolicy Bypass -File .\scripts\github-push.ps1

param(
  [string]$RepoName = "hozyain-onlain-store",
  [ValidateSet("public", "private")]
  [string]$Visibility = "public"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Get-GhExe {
  $cmd = Get-Command gh -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $zip = "$env:TEMP\gh.zip"
  $dest = "$env:TEMP\gh-cli"
  $bin = Get-ChildItem -Path $dest -Recurse -Filter "gh.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($bin) { return $bin.FullName }
  Write-Host "Скачиваю GitHub CLI..."
  Invoke-WebRequest -Uri "https://github.com/cli/cli/releases/download/v2.63.2/gh_2.63.2_windows_amd64.zip" -OutFile $zip -UseBasicParsing
  Expand-Archive -Path $zip -DestinationPath $dest -Force
  return (Get-ChildItem -Path $dest -Recurse -Filter "gh.exe" | Select-Object -First 1).FullName
}

$gh = Get-GhExe
Write-Host "GitHub CLI: $gh"

$auth = & $gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Нужен вход в GitHub. Откроется браузер — подтвердите доступ."
  Write-Host ""
  & $gh auth login -h github.com -p https -w --git-protocol https
}

if (git remote get-url origin 2>$null) {
  git remote remove origin
}

Write-Host "Создаю репозиторий $RepoName и отправляю код..."
& $gh repo create $RepoName --$Visibility --source=. --remote=origin --push

Write-Host ""
Write-Host "Готово. Репозиторий:"
& $gh repo view --web 2>$null
& $gh repo view --json url -q .url
