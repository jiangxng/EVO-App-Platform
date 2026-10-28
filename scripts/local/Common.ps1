$ErrorActionPreference = 'Stop'
$script:ProjectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$script:LocalTools = Join-Path $ProjectRoot '.local\local-tools'
New-Item -ItemType Directory -Path $LocalTools -Force | Out-Null

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "$Program failed (exit $LASTEXITCODE)." }
}

function Get-GitText {
    param([string]$Repository, [string[]]$Arguments)
    $output = & git -C $Repository @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Git failed in $Repository. Resolve the error before retrying." }
    return ($output -join "`n").Trim()
}

function Enter-LocalToolsLock {
    try {
        return [IO.File]::Open((Join-Path $LocalTools 'operation.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
    } catch { throw 'Another local startup/check is running. Wait for it to finish.' }
}

function Stop-ManagedHost {
    $recordFile = Join-Path $LocalTools 'host.json'
    if (!(Test-Path -LiteralPath $recordFile)) { return }
    $record = Get-Content -Raw -LiteralPath $recordFile | ConvertFrom-Json
    $hostProcess = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if ($hostProcess) {
        $info = Get-CimInstance Win32_Process -Filter "ProcessId = $($record.pid)"
        if ($hostProcess.StartTime.ToUniversalTime().Ticks.ToString() -ne $record.startTicks -or
            !$info.CommandLine -or !$info.CommandLine.Contains($record.entrypoint)) {
            throw 'Saved PID belongs to another process. Refusing to stop it; inspect .local/local-tools/host.json.'
        }
        Stop-Process -Id $record.pid -ErrorAction Stop
        $hostProcess.WaitForExit(10000) | Out-Null
        Write-Host "Stopped managed local platform (PID $($record.pid))."
    }
    Remove-Item -LiteralPath $recordFile
}

function Test-LocalPort {
    param([int]$Port)
    $listeners = [Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
    return @($listeners | Where-Object { $_.Port -eq $Port }).Count -gt 0
}
