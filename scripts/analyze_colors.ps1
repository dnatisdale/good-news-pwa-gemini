Add-Type -AssemblyName System.Drawing

function Get-AverageColor {
    param (
        [string]$imagePath
    )
    try {
        if (-not (Test-Path $imagePath)) {
            Write-Host "File not found: $imagePath"
            return $null
        }

        $bitmap = [System.Drawing.Bitmap]::FromFile($imagePath)
        
        # Sample top 60 pixels (header area)
        $totalR = 0
        $totalG = 0
        $totalB = 0
        $count = 0
        
        $heightToSample = [Math]::Min(60, $bitmap.Height)
        $widthToSample = $bitmap.Width

        # Sample every 10th pixel to be faster
        for ($x = 0; $x -lt $widthToSample; $x += 10) {
            for ($y = 0; $y -lt $heightToSample; $y += 10) {
                $pixel = $bitmap.GetPixel($x, $y)
                $totalR += $pixel.R
                $totalG += $pixel.G
                $totalB += $pixel.B
                $count++
            }
        }
        
        $bitmap.Dispose()

        if ($count -gt 0) {
            return @{
                R = $totalR / $count
                G = $totalG / $count
                B = $totalB / $count
            }
        }
        return $null
    }
    catch {
        Write-Host "Error processing $imagePath : $_"
        return $null
    }
}

$imagePaths = @(
    "C:/Users/dnati/.gemini/antigravity/brain/ceb1fc25-53b5-46e9-811d-252edb403c72/uploaded_image_0_1764376742760.png",
    "C:/Users/dnati/.gemini/antigravity/brain/ceb1fc25-53b5-46e9-811d-252edb403c72/uploaded_image_1_1764376742760.png",
    "C:/Users/dnati/.gemini/antigravity/brain/ceb1fc25-53b5-46e9-811d-252edb403c72/uploaded_image_2_1764376742760.png",
    "C:/Users/dnati/.gemini/antigravity/brain/ceb1fc25-53b5-46e9-811d-252edb403c72/uploaded_image_3_1764376742760.png"
)

# Existing brand dark color #8a160a
$brandDarkR = 0x8a
$brandDarkG = 0x16
$brandDarkB = 0x0a

$allR = $brandDarkR
$allG = $brandDarkG
$allB = $brandDarkB
$sourceCount = 1

Write-Host "Source 1 (Code): #8a160a"

foreach ($path in $imagePaths) {
    $avg = Get-AverageColor -imagePath $path
    if ($avg) {
        $allR += $avg.R
        $allG += $avg.G
        $allB += $avg.B
        $sourceCount++
        $hex = "#{0:X2}{1:X2}{2:X2}" -f [int]$avg.R, [int]$avg.G, [int]$avg.B
        Write-Host "Source $sourceCount (Image): $hex"
    }
}

if ($sourceCount -gt 0) {
    $finalR = [int]($allR / $sourceCount)
    $finalG = [int]($allG / $sourceCount)
    $finalB = [int]($allB / $sourceCount)
    
    $finalHex = "#{0:X2}{1:X2}{2:X2}" -f $finalR, $finalG, $finalB
    
    Write-Host "`n--- Result ---"
    Write-Host "Calculated HEX: $finalHex"
}
