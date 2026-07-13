# Backgound WebBrowser rendering to capture lms.html window.onerror banner content
Add-Type -AssemblyName System.Windows.Forms
$wb = New-Object System.Windows.Forms.WebBrowser
$wb.ScriptErrorsSuppressed = $true # Suppress popup dialogs

# Enable IE 11 emulation for PowerShell process to load ES6 code properly
$regPath = "HKCU:\Software\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION"
if (!(Test-Path $regPath)) { New-Item $regPath -Force | Out-Null }
Set-ItemProperty $regPath -Name "powershell.exe" -Value 11001 -Type DWord

$userProfile = $env:USERPROFILE
$desktop = Join-Path $userProfile "Desktop"
$targetDir = Get-ChildItem -LiteralPath $desktop -Directory -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -like "*metronic-demo1\metronic-demo1" } | 
    Select-Object -First 1 -ExpandProperty FullName

if ($targetDir) {
    $fullPath = Join-Path $targetDir "lms.html"
    if (Test-Path -LiteralPath $fullPath) {
        Write-Host "Navigating to $fullPath..."
        $wb.Navigate($fullPath)
        
        # Bounded wait for 5 seconds max
        $timeout = [DateTime]::Now.AddSeconds(5)
        while ($wb.ReadyState -ne "Complete" -and [DateTime]::Now -lt $timeout) {
            [System.Windows.Forms.Application]::DoEvents()
            Start-Sleep -Milliseconds 100
        }
        
        # Give JS another 1 second to execute and append the error div
        Start-Sleep -Seconds 1
        
        $bodyText = $wb.Document.Body.InnerText
        $bodyHtml = $wb.Document.Body.InnerHtml
        
        if ($bodyText -match "브라우저 스크립트 에러 감지") {
            Write-Host "=================== SCRIPTERROR DETECTED ===================" -ForegroundColor Red
            
            # Extract the error text from the appended div
            # Find the error div content
            # The div contains specific cssText style
            $elements = $wb.Document.GetElementsByTagName("div")
            foreach ($el in $elements) {
                if ($el.Style -and $el.Style.Contains("position: fixed") -and $el.InnerText -match "브라우저 스크립트 에러") {
                    Write-Host $el.InnerText -ForegroundColor Yellow
                }
                # Also fallback if style is not explicitly matching
                if ($el.InnerText -match "Uncaught ReferenceError" -or $el.InnerText -match "SyntaxError") {
                    Write-Host $el.InnerText -ForegroundColor Cyan
                }
            }
        } else {
            Write-Host "No script error detected in the HTML body!"
            # Print first 200 chars of body text to verify page loaded
            if ($bodyText) {
                Write-Host "Page Loaded. Snippet: $($bodyText.Substring(0, [Math]::Min(200, $bodyText.Length)))"
            }
        }
    }
} else {
    Write-Host "Project directory not found!"
}
