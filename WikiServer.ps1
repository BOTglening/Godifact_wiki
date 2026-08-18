# ============================================================
#  神造物 Wiki 服务器控制台
#  用法：Wiki服务器.bat [start|preview|build|stop|status|help]
#  双击（不带参数）进入交互菜单；启动时自动检测 Node.js，
#  缺失时提供一键自动安装（winget → 国内镜像 → 官方源）。
# ============================================================

$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

$devPort = 5173
$previewPort = 4173

function Get-NodeMajor {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $null }
  try {
    $v = (& node --version 2>$null)
    if ($v -and $v -match '^v?(\d+)') { return [int]$Matches[1] }
  } catch { }
  return $null
}

function Test-Node {
  $major = Get-NodeMajor
  if ($null -eq $major) {
    Write-Host '[错误] 未检测到 Node.js（运行本 wiki 所需的前置环境）。' -ForegroundColor Red
    Write-Host '       可在菜单按 [7] 自动安装，或手动安装：https://nodejs.org/zh-cn' -ForegroundColor Red
    return $false
  }
  if ($major -lt 18) {
    Write-Host "[警告] 当前 Node.js 版本过低（v$major），本 wiki 需要 18 及以上版本。" -ForegroundColor Yellow
    Write-Host '       可在菜单按 [7] 自动升级安装。' -ForegroundColor Yellow
    return $false
  }
  return $true
}

function Install-Node {
  Write-Host ''
  Write-Host '================ 自动安装 Node.js ================' -ForegroundColor Cyan
  Write-Host '需要联网。将依次尝试：winget 包管理器 → 国内镜像 → 官方源。'
  Write-Host ''
  $done = $false

  # 方式 1：winget（Win10 1809+ / Win11 自带）
  if (-not $done -and (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host '[方式 1/2] 正在通过 winget 安装 OpenJS.NodeJS.LTS ...' -ForegroundColor Yellow
    Write-Host '            （如弹出“用户账户控制”窗口，请点“是”）'
    & winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Host
    & winget list --id OpenJS.NodeJS.LTS | Out-Host
    if ($LASTEXITCODE -eq 0) { $done = $true }
  }

  # 方式 2：下载官方 MSI 静默安装
  if (-not $done) {
    $urls = @(
      'https://npmmirror.com/mirrors/node/v20.18.0/node-v20.18.0-x64.msi',
      'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi'
    )
    $msi = Join-Path $env:TEMP 'node-v20.18.0-x64.msi'
    $downloaded = $false
    foreach ($u in $urls) {
      if ($downloaded) { break }
      Write-Host "[方式 2/2] 下载安装包：$u" -ForegroundColor Yellow
      try {
        Invoke-WebRequest -Uri $u -OutFile $msi -UseBasicParsing -TimeoutSec 300 -ErrorAction Stop
        $downloaded = $true
      } catch {
        Write-Host '   该地址下载失败，尝试下一个 ...' -ForegroundColor DarkYellow
      }
    }
    if ($downloaded) {
      Write-Host '[方式 2/2] 开始静默安装（弹出 UAC 窗口请点“是”），约 1 分钟 ...' -ForegroundColor Yellow
      Start-Process msiexec.exe -ArgumentList '/i', "`"$msi`"", '/qn', '/norestart' -Verb RunAs -Wait
      $done = $true
    }
  }

  Write-Host ''
  if ($done) {
    Write-Host '[完成] Node.js 安装流程已执行。' -ForegroundColor Green
    Write-Host '       请【关闭本窗口】，重新双击 Wiki服务器.bat —— 新的环境变量需要新窗口才生效。' -ForegroundColor Green
  } else {
    Write-Host '[失败] 自动安装未成功，请手动安装。' -ForegroundColor Red
    Write-Host '       打开 https://nodejs.org/zh-cn 下载 LTS 版安装，装完重新双击 Wiki服务器.bat。' -ForegroundColor Red
  }
  Read-Host '按回车返回菜单'
}

function Ensure-Modules {
  if (Test-Path 'node_modules\vitepress') { return $true }
  Write-Host '[提示] 首次运行，正在安装依赖（需要网络，约 1-2 分钟）...' -ForegroundColor Yellow
  & npm.cmd install --no-fund --no-audit
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[提示] 默认源安装失败，改用国内镜像重试 ...' -ForegroundColor Yellow
    & npm.cmd install --no-fund --no-audit --registry=https://registry.npmmirror.com
  }
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[错误] 依赖安装失败，请检查网络后重试。' -ForegroundColor Red
    return $false
  }
  return $true
}

function Free-Port([int]$port) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

function Stop-Servers {
  $killed = 0
  $conns = Get-NetTCPConnection -LocalPort $devPort, $previewPort -State Listen -ErrorAction SilentlyContinue
  if ($conns) {
    $ids = @($conns | Select-Object -ExpandProperty OwningProcess -Unique)
    $ids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; $killed++ }
  }
  # 兜底：按命令行特征结束本 wiki 的 node 服务进程（防止端口枚举失效）
  $wikiRoot = (Get-Location).Path
  $nodes = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $_.CommandLine -and
      ($_.CommandLine -match 'vitepress|serve-static') -and
      ($_.CommandLine -like "*$wikiRoot*")
    }
  foreach ($n in $nodes) {
    Stop-Process -Id $n.ProcessId -Force -ErrorAction SilentlyContinue
    $killed++
  }
  if ($killed -gt 0) {
    Write-Host "已停止 $killed 个服务器进程。" -ForegroundColor Green
  } else {
    Write-Host '没有正在运行的 Wiki 服务器。'
  }
}

function Show-Status {
  $rows = Get-NetTCPConnection -LocalPort $devPort, $previewPort -State Listen -ErrorAction SilentlyContinue
  if ($rows) {
    $rows | Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table -AutoSize | Out-String | Write-Host
  } else {
    Write-Host '没有正在运行的 Wiki 服务器。'
  }
}

function Invoke-Build {
  if (-not (Test-Node)) { return $false }
  if (-not (Ensure-Modules)) { return $false }
  Write-Host '正在构建站点 ...' -ForegroundColor Cyan
  & npm.cmd run docs:build
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[错误] 构建失败，请查看上方输出。' -ForegroundColor Red
    return $false
  }
  Write-Host '构建完成：.vitepress\dist' -ForegroundColor Green
  return $true
}

function Start-Dev {
  if (-not (Test-Node)) { return }
  if (-not (Ensure-Modules)) { return }
  Free-Port $devPort
  Write-Host "正在启动开发服务器：http://localhost:$devPort （热更新）" -ForegroundColor Cyan
  Write-Host '停止方式：关闭弹出的窗口，或在菜单按 [5]。'
  Start-Process cmd -ArgumentList '/k', "chcp 65001 >nul && npm.cmd run docs:dev -- --host 127.0.0.1 --port $devPort"
}

function Start-Preview {
  if (-not (Test-Node)) { return }
  if (-not (Test-Path '.vitepress\dist\index.html')) {
    Write-Host '[提示] 未找到构建产物，正在先构建 ...' -ForegroundColor Yellow
    if (-not (Invoke-Build)) { return }
  }
  Free-Port $previewPort
  Write-Host "正在启动静态预览：http://localhost:$previewPort" -ForegroundColor Cyan
  Write-Host '停止方式：关闭弹出的窗口，或在菜单按 [5]。'
  Start-Process cmd -ArgumentList '/k', "chcp 65001 >nul && node ""$PSScriptRoot\.vitepress\serve-static.mjs"" ""$PSScriptRoot\.vitepress\dist"" $previewPort"
}

function Show-Usage {
  Write-Host ''
  Write-Host '用法：Wiki服务器.bat [start|preview|build|stop|status|help]'
  Write-Host '  start    启动开发服务器（热更新）'
  Write-Host '  preview  启动静态预览（如未构建会先自动构建）'
  Write-Host '  build    仅构建站点'
  Write-Host '  stop     停止所有 Wiki 服务器'
  Write-Host '  status   查看服务器状态'
  Write-Host ''
}

# ---- 命令行参数模式 ----
switch ($args[0]) {
  'start'   { Start-Dev; exit }
  'preview' { Start-Preview; exit }
  'build'   { Invoke-Build | Out-Null; exit }
  'stop'    { Stop-Servers; exit }
  'status'  { Show-Status; exit }
  'help'    { Show-Usage; exit }
}

# ---- 启动前环境自检（交互菜单模式）----
if (-not (Test-Node)) {
  Write-Host ''
  $ans = Read-Host '是否现在自动安装 Node.js？[y=自动安装 / 其他任意键=跳过]'
  if ($ans -match '^[yY]') { Install-Node }
}

# ---- 交互菜单模式 ----
while ($true) {
  Clear-Host
  Write-Host ''
  Write-Host ' ==================================================' -ForegroundColor DarkGray
  Write-Host '   神造物 Wiki 服务器控制台   [ WORLD ARCHIVE ]'
  Write-Host ' ==================================================' -ForegroundColor DarkGray
  Write-Host ''
  Write-Host "   [1] 启动开发服务器      热更新  http://localhost:$devPort"
  Write-Host "   [2] 启动静态预览        已构建  http://localhost:$previewPort"
  Write-Host '   [3] 构建站点            .vitepress\dist'
  Write-Host '   [4] 构建并启动静态预览'
  Write-Host '   [5] 停止服务器          关闭所有 Wiki 服务器'
  Write-Host '   [6] 服务器状态'
  Write-Host '   [7] 安装 Node.js 前置   缺失或版本过低时使用'
  Write-Host '   [0] 退出'
  Write-Host ''
  $choice = Read-Host '请选择并回车'
  switch ($choice) {
    '0' { exit }
    '1' { Start-Dev }
    '2' { Start-Preview }
    '3' { Invoke-Build | Out-Null }
    '4' { if (Invoke-Build) { Start-Preview } }
    '5' { Stop-Servers }
    '6' { Show-Status }
    '7' { if (Test-Node) { Write-Host '[提示] Node.js 已安装且版本满足要求，无需重复安装。' -ForegroundColor Green } else { Install-Node } }
  }
  Write-Host ''
  Read-Host '按回车返回菜单'
}
