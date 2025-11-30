# TickTaskPro App Icons

This folder contains the app icons for TickTaskPro.

## Required Files

Replace these placeholder files with your real TickTaskPro icons:

| File | Platform | Size/Format |
|------|----------|-------------|
| `icon.png` | All (dev/fallback) | 512x512px or 1024x1024px PNG |
| `icon.icns` | macOS | Apple Icon Image format (use `iconutil` to create from iconset) |
| `icon.ico` | Windows | Multi-resolution ICO (16, 32, 48, 64, 128, 256px) |
| `icon.svg` | Source | Vector source for UI/branding |

## How to Create Icons

### From SVG to PNG
Use any image editor or command line tool like `rsvg-convert`:
```bash
rsvg-convert -w 1024 -h 1024 icon.svg > icon.png
```

### macOS (.icns)
1. Create an iconset folder with multiple sizes:
   ```bash
   mkdir icon.iconset
   # Create sizes: 16, 32, 64, 128, 256, 512, 1024 (and @2x variants)
   sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
   sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
   ```
2. Convert to .icns:
   ```bash
   iconutil -c icns icon.iconset -o icon.icns
   ```

### Windows (.ico)
Use a tool like ImageMagick:
```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

Or use an online converter like https://icoconvert.com/

## Current Placeholder

The included `icon.svg` is a placeholder with a checkmark design. Replace it with your actual TickTaskPro branding.

