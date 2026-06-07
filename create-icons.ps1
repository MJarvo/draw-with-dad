# Run this once to create placeholder icons if you don't have Node canvas installed.
# It writes simple coloured PNG files using .NET System.Drawing.
# After running, replace with a proper icon if you want.

Add-Type -AssemblyName System.Drawing

function Make-Icon($path, $size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    # Dark bg
    $g.FillRectangle([System.Drawing.Brushes]::Black, 0, 0, $size, $size)
    # Coloured arcs
    $colors = @("#E53935","#FF9800","#FFD600","#4CAF50","#2196F3","#7C4DFF")
    $cx = $size / 2
    $cy = $size * 0.6
    for ($i = 0; $i -lt $colors.Count; $i++) {
        $hex = $colors[$i].TrimStart('#')
        $r = [Convert]::ToInt32($hex.Substring(0,2),16)
        $gg = [Convert]::ToInt32($hex.Substring(2,2),16)
        $b = [Convert]::ToInt32($hex.Substring(4,2),16)
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($r,$gg,$b), ($size*0.045))
        $rad = $size * (0.32 - $i * 0.045)
        $rect = New-Object System.Drawing.RectangleF(($cx - $rad), ($cy - $rad), ($rad*2), ($rad*2))
        $g.DrawArc($pen, $rect, 180, 180)
        $pen.Dispose()
    }
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "Created $path"
}

Make-Icon "public\icon-192.png" 192
Make-Icon "public\icon-512.png" 512
