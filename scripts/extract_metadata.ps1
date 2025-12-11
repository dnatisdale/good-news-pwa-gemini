$audioDir = "C:\GitHub\good-news-pwa-gemini\public\audio"
$jsonPath = "C:\GitHub\good-news-pwa-gemini\scripts\short_samples_list.json"

if (-not (Test-Path $jsonPath)) {
    Write-Error "JSON list not found"
    exit 1
}

$jsonContent = Get-Content $jsonPath | ConvertFrom-Json
$shell = New-Object -ComObject Shell.Application
$folder = $shell.Namespace($audioDir)

$results = @()

foreach ($item in $jsonContent) {
    $filename = $item.file
    $file = $folder.ParseName($filename)
    
    if ($file) {
        # Dynamically find indices if not already found
        if ($null -eq $idxAlbum) {
            for ($i = 0; $i -lt 300; $i++) {
                $name = $folder.GetDetailsOf($null, $i)
                if ($name -eq "Album") { $idxAlbum = $i }
                if ($name -eq "Composers" -or $name -eq "Authors") { $idxComposers = $i }
                if ($name -eq "Title") { $idxTitle = $i }
            }
        }

        $album = $folder.GetDetailsOf($file, $idxAlbum)
        $composers = $folder.GetDetailsOf($file, $idxComposers)
        $title = $folder.GetDetailsOf($file, $idxTitle)
        
        $results += [PSCustomObject]@{
            Filename = $filename
            Album = $album
            Composers = $composers
            Title = $title
        }
    }
}

$results | ConvertTo-Json -Depth 2
