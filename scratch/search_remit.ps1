# Read last 100 lines of lms.html using relative path
$fullPath = "lms.html"
if (Test-Path -LiteralPath $fullPath) {
    $content = [System.IO.File]::ReadAllLines($fullPath, [System.Text.Encoding]::UTF8)
    Write-Host "Total lines: $($content.Count)"
    $start = [Math]::Max(0, $content.Count - 100)
    for ($i = $start; $i -lt $content.Count; $i++) {
        Write-Host "$($i+1) : $($content[$i])"
    }
} else {
    Write-Host "Not found lms.html at relative path"
}
