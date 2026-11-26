Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$img = Join-Path $root "vibe_images"
$out = Join-Path $root "public\art\avatars"
New-Item -ItemType Directory -Force -Path $out | Out-Null

function Convert-Avatar {
  param(
    [string]$Source,
    [string]$Name
  )

  $src = [System.Drawing.Image]::FromFile($Source)
  $bitmap = New-Object System.Drawing.Bitmap(320, 320)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($src, 0, 0, 320, 320)

  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]88)

  $target = Join-Path $out "$Name.jpg"
  $bitmap.Save($target, $encoder, $params)

  $graphics.Dispose()
  $bitmap.Dispose()
  $src.Dispose()

  $size = [math]::Round((Get-Item $target).Length / 1KB)
  Write-Output "$Name.jpg - 320x320 - $size KB"
}

Convert-Avatar "$img\avatar-lion_1795666620571_d4e37b05.png" "avatar-lion"
Convert-Avatar "$img\avatar-owl_1795666639387_bf8f2ce4.png" "avatar-owl"
Convert-Avatar "$img\avatar-bear_1795666659943_c5c0e16a.png" "avatar-bear"
Convert-Avatar "$img\avatar-wolf_1795666682370_de0a3a0c.png" "avatar-wolf"
Convert-Avatar "$img\avatar-falcon_1795666753245_3f41942c.png" "avatar-falcon"
Convert-Avatar "$img\avatar-fox_1795666773986_3d336265.png" "avatar-fox"
Convert-Avatar "$img\avatar-whale_1795666796630_62783b86.png" "avatar-whale"
Convert-Avatar "$img\avatar-cat_1795666817936_440627b5.png" "avatar-cat"
Convert-Avatar "$img\avatar-rabbit_1795666854307_2613571f.png" "avatar-rabbit"
Convert-Avatar "$img\avatar-rocket_1795666876261_a9a99ed0.png" "avatar-rocket"
Convert-Avatar "$img\avatar-star_1795666895132_233e83c1.png" "avatar-star"
Convert-Avatar "$img\avatar-sun_1795666916141_f3e7ab36.png" "avatar-sun"
