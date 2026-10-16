param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$folioRoot = $PSScriptRoot
$folioUrl = 'http://127.0.0.1:4174'
$folioNode = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $folioNode) {
    $folioBundled = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (Test-Path -LiteralPath $folioBundled) { $folioNode = $folioBundled }
}
if (-not $folioNode) { throw '没有找到 Node.js。请安装 Node.js 后再次双击启动。' }
function Test-FolioService {
    try {
        $folioHealth = Invoke-RestMethod -Uri "$folioUrl/api/health" -TimeoutSec 2
        return $folioHealth.app -eq 'folio-editor'
    } catch { return $false }
}
if (-not (Test-FolioService)) {
    $folioData = Join-Path $folioRoot 'data'
    New-Item -ItemType Directory -Path $folioData -Force | Out-Null
    $env:PORT = '4174'
    $env:PORTFOLIO_DATA = $folioData
    $folioServer = Join-Path $folioRoot 'server.cjs'
    Start-Process -FilePath $folioNode -ArgumentList @('"' + $folioServer + '"') -WorkingDirectory $folioRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $folioData 'server.log') -RedirectStandardError (Join-Path $folioData 'server-error.log') | Out-Null
    $folioReady = $false
    for ($folioAttempt = 0; $folioAttempt -lt 20; $folioAttempt++) {
        Start-Sleep -Milliseconds 250
        if (Test-FolioService) { $folioReady = $true; break }
    }
    if (-not $folioReady) { throw '编辑器没有成功启动。请查看 data\server-error.log；4174 端口可能被其他程序占用。' }
}
if (-not $NoBrowser) { Start-Process "$folioUrl/editor/" }
