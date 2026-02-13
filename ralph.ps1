$MAX_ITERATIONS = if ($args[0]) { [int]$args[0] } else { 12 }
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PROJECT_DIR

Write-Host "Starting Ralph in $PROJECT_DIR - Max iterations: $MAX_ITERATIONS"

for ($i = 1; $i -le $MAX_ITERATIONS; $i++) {
    Write-Host ""
    Write-Host "==============================================================="
    Write-Host "  Ralph Iteration $i of $MAX_ITERATIONS"
    Write-Host "==============================================================="

    claude --print -p "Read CLAUDE.md, prd.json, and progress.txt in the current directory. Follow the instructions in CLAUDE.md to implement the next incomplete user story from prd.json. After completing it, update prd.json to mark it passes:true, commit changes, and append progress to progress.txt. If ALL stories pass, output <promise>COMPLETE</promise>."

    # Check if all stories are done by reading prd.json
    $prd = Get-Content "prd.json" -Raw | ConvertFrom-Json
    $remaining = @($prd.userStories | Where-Object { $_.passes -eq $false }).Count

    if ($remaining -eq 0) {
        Write-Host ""
        Write-Host "Ralph completed all tasks!"
        exit 0
    }

    Write-Host ""
    Write-Host "$remaining stories remaining. Continuing..."
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "Ralph reached max iterations ($MAX_ITERATIONS). Check prd.json for status."
exit 1
