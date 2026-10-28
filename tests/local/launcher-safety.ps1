# Behavioral checks in disposable local Git repositories. No real remote or application state is changed.
$ErrorActionPreference = 'Stop'
$project = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$cache = Join-Path $project '.local\local-tools'
New-Item -ItemType Directory -Path $cache -Force | Out-Null
$fixture = Join-Path $cache ('safety-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture | Out-Null
$listener = $null
function Git-Run {
    param([string[]]$GitArgs)
    & git @GitArgs | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Fixture Git setup failed: $GitArgs" }
}
function Expect-Rejected {
    param([string[]]$Flags, [string]$Message)
    # PowerShell 5 treats redirected native stderr as ErrorRecords, even for expected Git errors.
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $launcher @Flags 2>&1
        $resultCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previousPreference }
    if ($resultCode -eq 0 -or ($output -join "`n") -notmatch $Message) {
        throw "Expected rejection ($Message), got: $($output -join ' ')"
    }
}
try {
    $origin = Join-Path $fixture 'origin.git'
    $seed = Join-Path $fixture 'seed'
    Git-Run @('init', '--bare', '--initial-branch=main', $origin)
    Git-Run @('clone', $origin, $seed)
    Git-Run @('-C', $seed, 'config', 'user.email', 'local-test@example.invalid')
    Git-Run @('-C', $seed, 'config', 'user.name', 'Local launcher test')
    Set-Content -LiteralPath (Join-Path $seed 'sample.txt') -Value 'base'
    Git-Run @('-C', $seed, 'add', 'sample.txt')
    Git-Run @('-C', $seed, 'commit', '-m', 'fixture base')
    Git-Run @('-C', $seed, 'push', '-u', 'origin', 'main')
    foreach ($name in @('EVO-App-Platform', 'eidos', 'EVO', 'Experience-Compiler')) {
        Git-Run @('clone', $origin, (Join-Path $fixture $name))
    }
    $platform = Join-Path $fixture 'EVO-App-Platform'
    New-Item -ItemType Directory -Path (Join-Path $platform 'scripts') | Out-Null
    Copy-Item -LiteralPath (Join-Path $project 'scripts\local') -Destination (Join-Path $platform 'scripts\local') -Recurse
    $launcher = Join-Path $platform 'scripts\local\Start-Local.ps1'
    $initial = & git -C $platform rev-parse HEAD
    Set-Content -LiteralPath (Join-Path $seed 'remote.txt') -Value 'new remote revision'
    Git-Run @('-C', $seed, 'add', 'remote.txt')
    Git-Run @('-C', $seed, 'commit', '-m', 'fixture remote advance')
    Git-Run @('-C', $seed, 'push')

    # A dirty later repository must prevent even the first repository from pulling.
    $eidosSample = Join-Path $fixture 'eidos\sample.txt'
    $original = [IO.File]::ReadAllBytes($eidosSample)
    Set-Content -LiteralPath $eidosSample -Value 'uncommitted user change'
    Expect-Rejected @('-NoBrowser') 'Uncommitted changes'
    if ((& git -C $platform rev-parse HEAD) -ne $initial) { throw 'Earlier repository was updated before all preflights completed.' }
    [IO.File]::WriteAllBytes($eidosSample, $original)
    Write-Host 'PASS: dirty checkout blocks all pulls without overwriting edits.'

    Git-Run @('-C', $platform, 'config', 'user.email', 'local-test@example.invalid')
    Git-Run @('-C', $platform, 'config', 'user.name', 'Local launcher test')
    Set-Content -LiteralPath (Join-Path $platform 'local.txt') -Value 'local commit'
    Git-Run @('-C', $platform, 'add', 'local.txt')
    Git-Run @('-C', $platform, 'commit', '-m', 'fixture local divergence')
    $localHead = & git -C $platform rev-parse HEAD
    Expect-Rejected @('-NoBrowser') 'git failed'
    if ((& git -C $platform rev-parse HEAD) -ne $localHead) { throw 'Diverged branch was rewritten.' }
    Write-Host 'PASS: divergence is rejected without reset or merge commit.'

    Git-Run @('-C', $platform, 'branch', '--unset-upstream')
    Expect-Rejected @('-NoBrowser') 'Git failed'
    Write-Host 'PASS: missing upstream is rejected before startup.'

    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $occupiedPort = $listener.LocalEndpoint.Port
    Expect-Rejected @('-SkipPull', '-NoBrowser', '-Port', "$occupiedPort") 'occupied'
    if (!$listener.Server.IsBound) { throw 'Unrelated listener was disturbed.' }
    Write-Host 'PASS: unrelated occupied port is preserved.'

    $records = Join-Path $platform '.local\local-tools'
    @{pid=$PID; startTicks='0'; entrypoint='not-the-real-host'; port=4100} |
        ConvertTo-Json | Set-Content -LiteralPath (Join-Path $records 'host.json') -Encoding UTF8
    Expect-Rejected @('-Stop') 'another process'
    Write-Host 'PASS: stale/reused PID is never killed.'
} finally {
    if ($listener) { $listener.Stop() }
    $resolvedFixture = [IO.Path]::GetFullPath($fixture)
    if ((Split-Path -Parent $resolvedFixture) -eq [IO.Path]::GetFullPath($cache) -and
        (Split-Path -Leaf $resolvedFixture) -like 'safety-*') {
        Remove-Item -LiteralPath $resolvedFixture -Recurse -Force
    } else { throw "Unexpected fixture cleanup path: $resolvedFixture" }
}
