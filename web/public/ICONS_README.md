# PWA Icons

This directory should contain the following PWA icons:

## Required Icons

1. **icon-192.png** (192x192 pixels)
   - Used for PWA installation on mobile devices
   - Should feature the app logo/branding
   - Recommended: Purple/pink gradient with music note or waveform

2. **icon-512.png** (512x512 pixels)
   - High-resolution icon for larger displays
   - Used in app stores and splash screens
   - Same design as icon-192.png but higher resolution

## How to Create Icons

You can create these icons using:

1. **Design Tools**: Figma, Sketch, Adobe Illustrator, or GIMP
2. **Online Generators**: Use PWA icon generators like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

## Design Recommendations

- **Theme Colors**: Use purple (#a855f7) and pink (#ec4899) to match the app
- **Icon Style**: Modern, flat design with music/audio theme
- **Elements**: Consider using:
  - Music notes (🎵)
  - Waveforms
  - Equalizer bars
  - Retro/synthwave aesthetic

## Temporary Solution

For development/testing, you can use:
- Placeholder images from https://via.placeholder.com/192 and https://via.placeholder.com/512
- Convert existing vite.svg to PNG at required sizes
- Use the web app's branding or logo

## Installation

Once created, place the icon files in `/web/public/` directory:
```
web/public/
├── icon-192.png
├── icon-512.png
├── manifest.json
└── sw.js
```

The app will automatically use these icons when installed as a PWA.
