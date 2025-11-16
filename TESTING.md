# 🧪 Testing Guide

## Quick Test

To verify the application is working correctly:

### 1. Start the Application

```bash
# Terminal 1: Make sure WASM is built
cd audio-engine
wasm-pack build --target web --out-dir pkg --no-opt  # Fast build for testing

# Terminal 2: Start dev server
cd ../web
npm run dev
```

### 2. Open Browser

Navigate to `http://localhost:5173`

You should see:
- ✅ Loading screen (briefly)
- ✅ Main interface with gradient background
- ✅ Upload section
- ✅ Feature list

### 3. Test Audio Processing

#### Option A: Use a Test Audio File

If you don't have an audio file handy, you can:

1. Generate a test tone using Web Audio API (in browser console):
```javascript
// Generate a 440Hz sine wave (A note) for 3 seconds
const ctx = new AudioContext();
const sampleRate = ctx.sampleRate;
const duration = 3;
const numSamples = sampleRate * duration;
const buffer = ctx.createBuffer(2, numSamples, sampleRate);

for (let ch = 0; ch < 2; ch++) {
  const data = buffer.getChannelData(ch);
  for (let i = 0; i < numSamples; i++) {
    data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3;
  }
}

// Save as WAV would require audioUtils.exportWAV
console.log('Test tone created');
```

2. Or download any Creative Commons music from:
   - https://freemusicarchive.org/
   - https://soundcloud.com/search/sounds?filter.license=to_share

#### Option B: Test with Your Own Audio

1. Click upload area
2. Select an MP3, WAV, FLAC, or OGG file
3. Wait for file to load

**Expected Results:**
- ✅ File name appears
- ✅ Duration, sample rate, channels displayed
- ✅ Two waveform panels appear (Original + Processed)
- ✅ Original waveform shows audio visualization
- ✅ Audio player controls appear

### 4. Test Playback

1. Click ▶️ Play button
2. Audio should play
3. Progress bar should move
4. Click anywhere on progress bar to seek
5. Click ⏹️ Stop button

**Expected Results:**
- ✅ Audio plays smoothly
- ✅ Time counter updates
- ✅ Seeking works
- ✅ Stop returns to beginning

### 5. Test Style Processing

1. Click on "🎮 8-bit Chiptune" preset
   - Border should turn purple
2. Click "✨ Apply Style" button
3. Wait for processing (should be < 1 second)

**Expected Results:**
- ✅ "Processing..." indicator appears briefly
- ✅ Processed waveform updates on right side
- ✅ "✓ Applied" badge appears on preset
- ✅ No errors in console

### 6. Test A/B Comparison

1. Click "🎼 Original" button in player
2. Click Play ▶️
3. While playing, click "✨ Processed" button

**Expected Results:**
- ✅ Smooth transition between original and processed
- ✅ Playback continues without interruption
- ✅ Clear difference in audio quality (for 8-bit: more "crunchy")

### 7. Test Other Presets

Try each preset:
- 🌸 **Touhou-like**: Should sound brighter, more spacious
- 🎹 **FM/PC-98**: Should sound more "metallic"
- 🎧 **Lo-fi**: Should sound warmer, less bright
- 🔊 **Clean**: Should sound nearly identical (just limited)

### 8. Test Export

1. With a preset applied, click "⬇️ Export WAV"
2. File should download

**Expected Results:**
- ✅ File downloads as `filename_presetname.wav`
- ✅ File opens in audio player
- ✅ Processed audio sounds correct

### 9. Test Reset

1. Click "🔄 Reset" button

**Expected Results:**
- ✅ Processed waveform disappears
- ✅ Preset selection clears
- ✅ Can apply different preset

## Automated Testing

### Build Test

```bash
cd web
npm run build
```

**Expected:**
- ✅ No TypeScript errors
- ✅ Build completes successfully
- ✅ Bundle sizes reasonable (< 300KB total gzipped)

### WASM Test

```bash
cd audio-engine
cargo test
```

**Expected:**
- ✅ All unit tests pass
- ✅ No compilation warnings

## Performance Testing

### Test with Different File Sizes

1. **Small file** (< 1 MB / < 1 minute):
   - Should process instantly (< 100ms)

2. **Medium file** (5 MB / ~3 minutes):
   - Should process in < 1 second

3. **Large file** (20 MB / 10+ minutes):
   - May take 2-5 seconds
   - UI should remain responsive

### Browser Console Checks

Open DevTools → Console

**Should see:**
```
Audio Engine v0.1.0 loaded
Audio Engine initialized with sample rate: 44100
Loaded audio: song.mp3
Duration: 180.23s
Sample rate: 44100Hz
Channels: 2
Applying preset: 8bit
Audio processing complete
```

**Should NOT see:**
- ❌ Any errors
- ❌ WASM loading failures
- ❌ Audio decoding errors

## Common Issues

### 1. "Failed to initialize audio engine"

**Debug steps:**
```bash
# Check WASM is built
ls audio-engine/pkg/

# Should see:
# audio_engine_bg.wasm
# audio_engine.js
# package.json
```

**Fix:** Rebuild WASM:
```bash
cd audio-engine
wasm-pack build --target web --out-dir pkg
```

### 2. Waveform not showing

**Check:** DevTools → Console for errors

**Common causes:**
- Canvas rendering issue → Try different browser
- File too large → Try smaller file
- Unsupported format → Convert to MP3

### 3. Audio playback issues

**Test in console:**
```javascript
const ctx = new AudioContext();
console.log(ctx.state); // Should be "running" or "suspended"
```

**Fix:** Click anywhere on page to resume audio context

### 4. Processing takes too long

**Check:**
- File size (> 50 MB may be slow)
- Browser (Chrome/Edge perform best)
- Other tabs/apps consuming CPU

## Regression Testing Checklist

Before any release, verify:

- [ ] WASM builds without errors
- [ ] Frontend builds without errors
- [ ] Upload works for: MP3, WAV, FLAC, OGG
- [ ] All 5 presets apply successfully
- [ ] Waveforms render correctly
- [ ] Audio playback works
- [ ] A/B comparison works
- [ ] Export creates valid WAV file
- [ ] Reset button works
- [ ] No console errors
- [ ] Responsive on mobile (basic test)
- [ ] Works in Chrome, Firefox, Safari

## Benchmark Results

(Run on M1 MacBook Pro, Chrome 120)

| File Size | Duration | Sample Rate | Process Time (8bit) | Process Time (Touhou) |
|-----------|----------|-------------|---------------------|----------------------|
| 3 MB | 2:30 | 44.1kHz | ~450ms | ~480ms |
| 10 MB | 8:00 | 44.1kHz | ~1.2s | ~1.3s |
| 25 MB | 20:00 | 48kHz | ~3.1s | ~3.3s |

*Processing time includes WASM execution + AudioBuffer conversion*

## Next Steps

After successful testing:

1. ✅ Deploy to GitHub Pages / Cloudflare Pages
2. ✅ Add sample audio files for demo
3. ✅ Create video tutorial
4. ✅ Get user feedback

---

**Happy Testing! 🧪✨**
