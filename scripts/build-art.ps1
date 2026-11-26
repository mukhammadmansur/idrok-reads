Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "public\art\worlds"
New-Item -ItemType Directory -Force -Path $out | Out-Null

function Convert-Art {
  param(
    [string]$Source,
    [string]$Name,
    [int]$Width,
    [int]$Height,
    [int]$Quality
  )

  $src = [System.Drawing.Image]::FromFile($Source)
  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($src, 0, 0, $Width, $Height)

  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

  $target = Join-Path $out "$Name.jpg"
  $bitmap.Save($target, $encoder, $params)

  $graphics.Dispose()
  $bitmap.Dispose()
  $src.Dispose()

  $size = [math]::Round((Get-Item $target).Length / 1KB)
  Write-Output "$Name.jpg - $($Width)x$($Height) - $size KB"
}

$img = Join-Path $root "vibe_images"

Convert-Art "$img\world-magic-bg_1795633548179_ffef0f23.png" "magic-room" 1600 914 84
Convert-Art "$img\world-pirate-bg_1795633569078_0f36c19f.png" "pirate-sea" 1600 914 84
Convert-Art "$img\world-space-bg_1795633593056_be8079c6.png" "space-nebula" 1600 914 84

Convert-Art "$img\mascot-magic-owl_1795633681878_8057e7c6.png" "mascot-owl" 512 512 88
Convert-Art "$img\mascot-pirate-crow_1795633702859_04f90c0c.png" "mascot-crow" 512 512 88
Convert-Art "$img\mascot-space-cat_1795633724361_8c3e2f43.png" "mascot-cat" 512 512 88

Convert-Art "$img\cover-oy-dosti_1795633811711_0b400de7.png" "cover-oy-dosti" 720 1080 86
Convert-Art "$img\cover-bulut-kemasi_1795633832476_bace5bab.png" "cover-bulut-kemasi" 720 1080 86
Convert-Art "$img\cover-dengiz-siri_1795633856687_61524a4c.png" "cover-dengiz-siri" 720 1080 86
