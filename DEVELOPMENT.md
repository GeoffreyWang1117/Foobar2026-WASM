# 🔧 Development Guide

## Project Structure Overview

This project implements a **pure frontend audio processing workstation** using Rust/WASM for the audio engine and React/TypeScript for the UI.

## Architecture Details

### Audio Engine (Rust/WASM)

#### DSP Modules (`audio-engine/src/dsp/`)

1. **utils.rs** - Core utilities
   - Biquad filter implementation (IIR filters)
   - Audio type definitions
   - Conversion functions (dB ↔ linear gain)

2. **eq.rs** - Three-band equalizer
   - Low/Mid/High frequency bands
   - Parametric EQ using peaking filters
   - Real-time coefficient calculation

3. **bitcrush.rs** - Bit depth & sample rate reduction
   - Simulates lo-fi/retro sound
   - Sample-and-hold algorithm
   - Wet/dry mixing

4. **reverb.rs** - Schroeder reverberator
   - Parallel comb filters
   - Serial allpass filters
   - Stereo width control

5. **compression.rs** - Dynamic range processing
   - RMS-based compressor
   - Brick-wall limiter
   - Attack/release envelope followers

6. **stereo.rs** - Stereo imaging
   - Mid/Side processing
   - Stereo width adjustment
   - Pan control

#### Style System (`audio-engine/src/styles/`)

**Extensible architecture** for adding new styles:

```rust
// Define your effect chain
let preset = StylePreset {
    id: "custom".to_string(),
    name: "My Custom Style".to_string(),
    effects: vec![
        EffectConfig::EQ { params: /* ... */ },
        EffectConfig::Bitcrush { params: /* ... */ },
    ],
    // ...
};
```

**Built-in Presets:**
- `8bit` - Emulates 8-bit game consoles
- `touhou` - Bright, electronic, inspired by Touhou Project
- `fm_synthesis` - FM chip character (PC-98, YM2612)
- `lofi` - Warm, nostalgic hip-hop sound
- `clean` - Transparent limiter only

#### AI Interface (`audio-engine/src/ai/`)

**Purpose:** Enable future AI-powered features

**Features:**
- `AudioFeatures` - Extract spectral/temporal features
- `AIStyleModel` trait - Plug in custom AI models
- `BasicFeatureExtractor` - Rule-based fallback

**Example Integration:**
```rust
impl AIStyleModel for MyModel {
    fn suggest_parameters(&self, features: &AudioFeatures, style: &str) -> String {
        // Your AI model inference here
        // Return JSON with suggested parameters
    }
}
```

### Frontend (React/TypeScript)

#### Key Technologies

- **Vite** - Ultra-fast builds & dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Web Audio API** - Audio playback & decoding

#### Integration Pattern

```typescript
// Load WASM module
import init, { AudioEngine, PresetLib } from 'audio-engine'

// Initialize
await init()
const engine = new AudioEngine(44100)

// Load audio
const audioContext = new AudioContext()
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

// Convert to float array
const audioData = new Float32Array(
  audioBuffer.numberOfChannels * audioBuffer.length
)
// Interleave channels...

// Process
engine.loadAudio(audioData, audioBuffer.numberOfChannels)
engine.applyPreset('8bit')
const processed = engine.getProcessedAudio()
```

## Development Workflow

### 1. Building WASM Engine

```bash
cd audio-engine

# Development build (faster, larger)
wasm-pack build --target web --no-opt

# Production build (optimized)
wasm-pack build --target web
```

### 2. Running Frontend

```bash
cd web
npm run dev
```

### 3. Testing Changes

**Rust Tests:**
```bash
cd audio-engine
cargo test
```

**Frontend:**
```bash
cd web
npm test  # (when tests are added)
```

## Adding New Features

### Adding a New DSP Effect

1. Create `audio-engine/src/dsp/my_effect.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyEffectParams {
    pub intensity: f32,
}

#[derive(Debug)]
pub struct MyEffect {
    params: MyEffectParams,
}

impl MyEffect {
    pub fn new(params: MyEffectParams) -> Self {
        Self { params }
    }

    pub fn process(&mut self, buffer: &mut [Vec<f32>]) {
        // Your DSP algorithm here
    }
}
```

2. Register in `dsp/mod.rs`:
```rust
pub mod my_effect;
pub use my_effect::*;
```

3. Add to effect config in `styles/preset.rs`:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum EffectConfig {
    // ... existing effects
    #[serde(rename = "my_effect")]
    MyEffect { params: MyEffectParams },
}
```

4. Add wrapper in `styles/pipeline.rs`:
```rust
#[derive(Debug)]
struct MyEffectWrapper {
    processor: MyEffect,
}

impl AudioEffect for MyEffectWrapper {
    fn process(&mut self, buffer: &mut [Vec<f32>]) {
        self.processor.process(buffer);
    }
    // ... other trait methods
}
```

5. Register in pipeline creation:
```rust
fn create_effect(&self, config: &EffectConfig, ...) -> Option<Box<dyn AudioEffect>> {
    match config {
        // ... existing effects
        EffectConfig::MyEffect { params } => Some(Box::new(MyEffectWrapper {
            processor: MyEffect::new(params.clone()),
        })),
    }
}
```

### Adding a New Style Preset

In `audio-engine/src/styles/preset.rs`:

```rust
impl PresetLibrary {
    pub fn preset_vaporwave() -> StylePreset {
        StylePreset {
            id: "vaporwave".to_string(),
            name: "Vaporwave Aesthetic".to_string(),
            description: "Slowed, reverb-heavy 80s aesthetic".to_string(),
            effects: vec![
                EffectConfig::EQ {
                    params: EQParams {
                        low_gain: 3.0,
                        mid_gain: -2.0,
                        high_gain: 2.0,
                        low_freq: 200.0,
                        high_freq: 8000.0,
                    },
                },
                EffectConfig::Reverb {
                    params: ReverbParams {
                        room_size: 0.9,
                        damping: 0.3,
                        mix: 0.6,
                        width: 1.0,
                    },
                },
            ],
            category: "Modern".to_string(),
            tags: vec!["vaporwave".to_string(), "80s".to_string()],
            // ...
        }
    }
}

// Don't forget to add to get_all():
pub fn get_all() -> Vec<StylePreset> {
    vec![
        // ... existing presets
        Self::preset_vaporwave(),
    ]
}
```

## Performance Optimization

### WASM Optimization

1. **Enable optimization in Cargo.toml:**
```toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

2. **Use `wasm-opt`:**
```bash
wasm-pack build --target web
# wasm-opt is automatically run by wasm-pack
```

### Chunked Processing

For large files, use chunked processing to avoid blocking:

```rust
// In pipeline.rs
pipeline.process_chunked(&mut buffer, 8192);
```

### Web Workers (Future)

Move WASM processing to a Web Worker to avoid blocking UI thread.

## Debugging

### Rust/WASM

Add logging:
```rust
use web_sys::console;

log!("Processing {} samples", buffer[0].len());
```

View in browser console.

### Frontend

Standard browser DevTools + React DevTools

## Common Issues

### 1. WASM Module Not Loading

**Symptom:** Import error or WASM initialization fails

**Solution:**
- Ensure `vite-plugin-wasm` is installed
- Check `vite.config.ts` has wasm plugin
- Verify WASM was built: `ls audio-engine/pkg`

### 2. Audio Crackling/Distortion

**Causes:**
- Excessive gain (> 1.0)
- Integer overflow in bit depth reduction
- Incorrect sample rate

**Debug:**
- Add limiter as final stage
- Check for NaN/Inf values
- Verify sample rate matches

### 3. Memory Issues

**Symptom:** Out of memory errors

**Solution:**
- Process in smaller chunks
- Use streaming instead of loading entire file
- Profile with `performance.memory`

## Deployment

### Static Hosting

The app is **fully static** and can be deployed to:

- **GitHub Pages**
- **Cloudflare Pages**
- **Netlify**
- **Vercel**

Build:
```bash
cd web
npm run build
# Deploy the `dist/` folder
```

### WASM Binary Size

Current size: ~500KB (unoptimized) → ~150KB (optimized + gzip)

To reduce further:
- Remove unused features
- Use `wasm-opt -Oz` (extreme optimization)
- Tree-shake unused Rust code

## Resources

- [Rust WASM Book](https://rustwasm.github.io/docs/book/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/)
- [DSP Guide](https://www.dspguide.com/)

## Contributing

See `README.md` for contribution guidelines.

---

Happy coding! 🎵🦀
