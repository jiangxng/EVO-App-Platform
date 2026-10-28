param(
    [ValidateSet('Quick', 'Platform')][string]$Mode = 'Quick',
    [string[]]$TestFile = @(),
    [switch]$WithDatabase
)
. (Join-Path $PSScriptRoot 'Common.ps1')
$lock = $null
$transcribing = $false
$timer = [Diagnostics.Stopwatch]::StartNew()
try {
    Set-Location -LiteralPath $ProjectRoot
    $lock = Enter-LocalToolsLock
    Start-Transcript -Path (Join-Path $LocalTools ('check-' + $Mode.ToLower() + '-last.log')) -Force | Out-Null
    $transcribing = $true
    if ($Mode -eq 'Quick') {
        if ($WithDatabase) { throw '-WithDatabase applies to Platform mode only.' }
        Invoke-Checked node @('scripts/local/prepare.mjs')
        $files = @('tests/manager/core-manager.test.mjs', 'tests/actions/router.test.mjs', 'tests/protocol/startup-defaults.test.mjs')
        if ($TestFile.Count -gt 0) {
            $files = @()
            foreach ($file in $TestFile) {
                $full = [IO.Path]::GetFullPath((Join-Path $ProjectRoot $file))
                if (!$full.StartsWith((Join-Path $ProjectRoot 'tests\'), [StringComparison]::OrdinalIgnoreCase) -or
                    !(Test-Path -LiteralPath $full -PathType Leaf)) { throw "Test file must exist under tests/: $file" }
                $files += $full
            }
        }
        Invoke-Checked node (@('--test') + $files)
        Write-Host 'QUICK PASS (build and selected tests only; not full Platform CI).'
    } else {
        if ($TestFile.Count) { throw '-TestFile applies to Quick mode only.' }
        Get-Command docker -ErrorAction Stop | Out-Null
        Invoke-Checked docker @('info', '--format', '{{.ServerVersion}}')
        $ciArguments = @('scripts/local/platform-ci.mjs')
        if ($WithDatabase) { $ciArguments += '--postgres' }
        Invoke-Checked node $ciArguments
        Write-Host 'PLATFORM PASS (npm run test:platform in Linux; other workflows are separate).'
    }
    Write-Host ('Completed in {0:N1}s. Logs: {1}' -f $timer.Elapsed.TotalSeconds, $LocalTools)
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    if ($transcribing) { Stop-Transcript | Out-Null }
    if ($lock) { $lock.Dispose() }
}
