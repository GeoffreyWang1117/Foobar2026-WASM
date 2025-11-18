# 🎵 Music Style Filter App

A pure frontend, WebAssembly-based audio processing workstation that transforms music styles in your browser - no server needed!

**Status:** ✅ Phase 2 Complete - Parameter controls & custom presets!

## ✨ Features

- **Pure Frontend**: All audio processing happens in your browser
- **Privacy-First**: No uploads, no tracking - your files never leave your device
- **Multiple Style Presets**:
  - 🎮 8-bit / Chiptune (NES/Famicom style)
  - 🌸 Touhou-like (Early Windows electronic sound)
  - 🎹 FM Synthesis / PC-98 Style
  - 🎧 Lo-fi Hip Hop
  - 🌊 Vaporwave Aesthetic
  - 🌃 Synthwave
  - 💿 80s Pop
  - 🔊 Clean & Transparent
- **Real-Time Parameter Control**: Fine-tune any preset with interactive sliders
- **Custom Preset Editor**: Adjust effect parameters to create your own unique sounds
- **Preset Import/Export**: Share presets as JSON files
- **Batch Processing**: Process multiple audio files at once with queue management
- **Web Worker Processing**: Non-blocking audio processing for smooth UI experience
- **Region Processing**: Select and process specific parts of your audio
- **Progressive Web App**: Install as desktop/mobile app with offline support
- **AI-Ready**: Extensible AI interface for intelligent style suggestions
- **Custom Styles**: Create and save your own filter presets
- **High-Performance**: Rust + WASM powered audio engine

## 🏗️ Architecture

```
Foobar2026-WASM/
├── audio-engine/          # Rust/WASM audio processing engine
│   ├── src/
│   │   ├── dsp/          # DSP algorithms (EQ, reverb, bitcrush, etc.)
│   │   ├── styles/       # Style preset system
│   │   ├── ai/           # AI model interface
│   │   └── lib.rs        # WASM exports
│   └── pkg/              # Compiled WASM module
└── web/                   # React/TypeScript frontend
    └── src/
        ├── components/   # React components
        ├── hooks/        # Custom React hooks
        └── utils/        # Utilities
```

## 🚀 Quick Start

### Prerequisites

- Rust (latest stable) with wasm32 target
- Node.js (v18+)
- wasm-pack

### Building the WASM Engine

```bash
cd audio-engine
wasm-pack build --target web --out-dir pkg
```

### Running the Frontend

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## 📖 Documentation

- **[USAGE.md](USAGE.md)** - Complete user guide with tips and tricks
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer documentation and architecture
- **[Audio Engine Docs](audio-engine/src/)** - Rust/WASM source code with inline documentation

## 🎨 Usage

1. **Upload Audio**: Click to upload MP3, WAV, FLAC, or OGG files
2. **Choose Style**: Select from 8 built-in presets
3. **Apply & Listen**: Hear the transformed audio immediately
4. **Fine-Tune**: Adjust effect parameters with interactive sliders
5. **Save Preset**: Export your custom settings as JSON
6. **Preview**: A/B compare original vs processed audio
7. **Export**: Download as high-quality WAV

## 📱 Progressive Web App (PWA)

The Music Style Filter can be installed as a standalone app on your device:

### Features
- **Offline Support**: Process audio files without internet connection
- **Install Prompt**: One-click installation on desktop and mobile
- **App-like Experience**: Runs in standalone window without browser UI
- **Automatic Updates**: Get notified when new versions are available
- **Fast Loading**: Cached assets for instant startup

### Installation

**Desktop (Chrome/Edge):**
1. Visit the app in your browser
2. Look for the install banner or click the install button in the address bar
3. Click "Install" to add to your desktop

**Mobile (iOS/Android):**
1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the "Install" button in the banner, or use the "Add to Home Screen" option
3. The app will appear on your home screen

**Offline Usage:**
- Once installed, the app works offline for audio processing
- Note: Initial WASM module load requires internet connection
- Processed files are saved locally on your device

## 🔧 Development

### Adding New Audio Effects

1. Create DSP module in `audio-engine/src/dsp/`
2. Add effect parameters with `serde` serialization
3. Register in `EffectConfig` enum
4. Create wrapper in `pipeline.rs`

### Adding New Style Presets

```rust
// In audio-engine/src/styles/preset.rs
impl PresetLibrary {
    pub fn my_custom_style() -> StylePreset {
        StylePreset {
            id: "my_style".to_string(),
            name: "My Custom Style".to_string(),
            effects: vec![
                EffectConfig::EQ { /* params */ },
                EffectConfig::Reverb { /* params */ },
            ],
            // ...
        }
    }
}
```

## 🤖 AI Integration

The engine includes interfaces for AI-powered features:

- **Audio Analysis**: Extract features (energy, spectral centroid, tempo, etc.)
- **Parameter Suggestion**: AI recommends optimal effect parameters
- **Style Optimization**: Learn from user adjustments

To integrate your AI model, implement the `AIStyleModel` trait in `ai/interface.rs`.

## 📦 Tech Stack

**Audio Engine:**
- Rust
- WebAssembly (wasm-bindgen)
- Custom DSP algorithms

**Frontend:**
- React 18
- TypeScript
- Vite (for fast builds)
- Tailwind CSS
- Web Audio API

## 🎯 Roadmap

### Phase 1: MVP ✅ COMPLETED
- [x] Basic DSP algorithms (EQ, bitcrush, reverb, compression, stereo)
- [x] 5 built-in style presets (8-bit, Touhou, FM, Lo-fi, Clean)
- [x] WASM compilation and integration
- [x] Full UI with file upload
- [x] Waveform visualization (Canvas-based)
- [x] Audio playback & A/B comparison
- [x] WAV export (16-bit PCM)

### Phase 2: Enhanced Features ✅ COMPLETED
- [x] Real-time parameter adjustment with interactive sliders
- [x] More style presets (Synthwave, Vaporwave, 80s Pop)
- [x] Custom preset editor with live preview
- [x] Preset import/export (JSON)
- [ ] MP3 export (pending)

### Phase 3: Advanced Features ✅ COMPLETED
- [x] Batch processing with queue management
- [x] Web Worker for non-blocking processing
- [x] Performance mode toggle (Worker / Main Thread)
- [x] Region-specific processing (audio selection)
- [x] PWA support (offline mode, install prompt)
- [ ] AI-powered style suggestions (planned for Phase 4)

## 🤝 Contributing

Contributions welcome! Please feel free to:

- Add new DSP effects
- Create new style presets
- Improve UI/UX
- Fix bugs
- Write documentation

## 📄 License

MIT License - feel free to use this project however you like!

## 🙏 Acknowledgments

- Inspired by retro game music and ZUN's Touhou Project soundtracks
- DSP algorithms based on standard audio processing techniques
- Special thanks to the Rust and WebAssembly communities

---

**Made with ♥ and 🦀 by the Audio Filter Team**
