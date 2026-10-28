param(
    [switch]$SkipPull,
    [switch]$NoBrowser,
    [switch]$Stop,
    [ValidateRange(1024, 65535)][int]$Port = 4100
)
. (Join-Path $PSScriptRoot 'Common.ps1')
$lock = $null
$transcribing = $false
$timer = [Diagnostics.Stopwatch]::StartNew()
try {
    Set-Location -LiteralPath $ProjectRoot
    $lock = Enter-LocalToolsLock
    Start-Transcript -Path (Join-Path $LocalTools 'start-last.log') -Force | Out-Null
    $transcribing = $true
    if ($Stop) { Stop-ManagedHost; exit 0 }
    Get-Command git,node.exe,npm.cmd -ErrorAction Stop | Out-Null

    if (!$SkipPull) {
        $parent = Split-Path -Parent $ProjectRoot
        $repositories = @($ProjectRoot, (Join-Path $parent 'eidos'), (Join-Path $parent 'EVO'), (Join-Path $parent 'Experience-Compiler'))
        # Inspect every checkout before updating any of them. Git handles untracked-file collisions.
        foreach ($repo in $repositories) {
            if (!(Test-Path -LiteralPath (Join-Path $repo '.git'))) { throw "Repository missing: $repo" }
            $branch = Get-GitText $repo @('symbolic-ref', '--short', 'HEAD')
            $dirty = Get-GitText $repo @('status', '--porcelain', '--untracked-files=no')
            if ($dirty) { throw "Uncommitted changes in $repo. Commit/review them first, or use -SkipPull for local development. No reset or stash was performed." }
            $upstream = Get-GitText $repo @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}')
            Write-Host "$repo : $branch -> $upstream"
        }
        foreach ($repo in $repositories) {
            Write-Host "Updating $repo"
            Invoke-Checked git @('-C', $repo, 'pull', '--ff-only')
        }
    } else { Write-Host 'Local development mode: skipping all Git updates.' }

    # A requested port owned by an unrelated program must not interrupt our current host.
    if (Test-LocalPort $Port) {
        $recordFile = Join-Path $LocalTools 'host.json'
        $record = if (Test-Path -LiteralPath $recordFile) { Get-Content -Raw -LiteralPath $recordFile | ConvertFrom-Json } else { $null }
        if (!$record -or $record.port -ne $Port) {
            throw "Port $Port is occupied by a process this script does not own. Stop it yourself, or choose another -Port."
        }
    }
    Stop-ManagedHost
    if (Test-LocalPort $Port) {
        throw "Port $Port is occupied by a process this script does not own. Stop it yourself, or use -Port 4101."
    }
    Invoke-Checked node @('scripts/local/prepare.mjs')
    $entrypoint = Join-Path $PSScriptRoot 'host.mjs'
    $hostProcess = Start-Process -FilePath (Get-Command node.exe).Source `
        -ArgumentList @(('"' + $entrypoint + '"'), $Port.ToString()) `
        -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $LocalTools 'host.stdout.log') `
        -RedirectStandardError (Join-Path $LocalTools 'host.stderr.log')
    @{ pid = $hostProcess.Id; startTicks = $hostProcess.StartTime.ToUniversalTime().Ticks.ToString(); entrypoint = $entrypoint; port = $Port } |
        ConvertTo-Json | Set-Content -LiteralPath (Join-Path $LocalTools 'host.json') -Encoding UTF8

    $ready = $false
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        $hostProcess.Refresh()
        if ($hostProcess.HasExited) { break }
        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 2
            if ($health.ok -eq $true -and $health.service -eq 'evo-app-manager') { $ready = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    if (!$ready) {
        Stop-ManagedHost
        throw "Platform startup failed. Inspect $LocalTools\host.stderr.log."
    }
    $url = "http://localhost:$Port/#/store"
    Write-Host "Ready: $url"
    Write-Host ('Completed in {0:N1}s. State preserved in .local/personal-agent-experience/.' -f $timer.Elapsed.TotalSeconds)
    Write-Host 'Stop later: start-local.cmd -Stop'
    if (!$NoBrowser) { Start-Process $url }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    if ($transcribing) { Stop-Transcript | Out-Null }
    if ($lock) { $lock.Dispose() }
}
