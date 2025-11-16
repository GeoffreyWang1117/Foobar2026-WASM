# 🎵 Music Style Filter - Usage Guide

## Quick Start

### Running the Application

1. **Build the WASM Engine** (one-time setup):
   ```bash
   cd audio-engine
   wasm-pack build --target web --out-dir pkg
   ```

2. **Start the Development Server**:
   ```bash
   cd web
   npm install
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:5173`

## Using the Application

### Step 1: Upload Your Audio File

1. Click the upload area or drag and drop an audio file
2. Supported formats: MP3, WAV, FLAC, OGG, M4A
3. File info will appear below (duration, sample rate, channels)

### Step 2: Preview Original Audio

- **Waveform**: View the visual representation of your audio
- **Player Controls**:
  - ▶️ Play/Pause
  - ⏹️ Stop
  - ⏭️ Skip forward 10 seconds
  - Progress bar: Click to seek to any position

### Step 3: Choose a Style Preset

Available presets:

- **🎮 8-bit Chiptune**
  - NES/Famicom style sound
  - Reduced bit depth (8-bit)
  - Lowered sample rate for that classic "crunchy" sound
  - Perfect for: Game music, retro vibes

- **🌸 Touhou-like**
  - Inspired by ZUN's Touhou Project music
  - Enhanced mid-high frequencies (bright leads)
  - Wider stereo image
  - Medium reverb for spaciousness
  - Perfect for: Electronic music, doujin style

- **🎹 FM/PC-98 Style**
  - Emulates FM synthesis sound chips
  - Characteristic "metallic" timbre
  - Narrower stereo field
  - Perfect for: Retro PC game music

- **🎧 Lo-fi Hip Hop**
  - Warm, nostalgic sound
  - Reduced high frequencies
  - Gentle compression
  - Perfect for: Chill beats, study music

- **🔊 Clean & Transparent**
  - Minimal processing
  - Only brick-wall limiting for safety
  - Perfect for: High-fidelity playback

### Step 4: Apply the Style

1. Click on a preset to select it (border will turn purple)
2. Click **"✨ Apply Style"** button
3. Wait for processing (usually < 1 second)
4. Waveform on the right updates with processed audio

### Step 5: A/B Comparison

Use the audio player's mode selector:
- **🎼 Original**: Hear the unprocessed audio
- **✨ Processed**: Hear the styled version

Switch between them in real-time to compare!

### Step 6: Export Your Result

1. Click **"⬇️ Export WAV"** button
2. File downloads automatically as `filename_stylename.wav`
3. High-quality 16-bit PCM WAV format
4. Ready to use in any audio software

## Tips & Tricks

### Getting the Best Results

1. **8-bit Style**:
   - Works best with melodic content
   - Try on synth leads or chiptune compositions
   - May be too harsh on vocals

2. **Touhou Style**:
   - Excellent for electronic music with prominent melodies
   - Enhances bright, energetic tracks
   - Great for doujin music remixes

3. **FM Synthesis**:
   - Best for retro game music
   - Try on tracks with synthesizers
   - Adds that classic "old computer" character

4. **Lo-fi**:
   - Perfect for hip-hop beats
   - Smooths out harsh digital sounds
   - Creates warm, vintage feeling

5. **Clean**:
   - Use when you just want volume normalization
   - Good for comparing processing vs. no processing
   - Safe loudness for all tracks

### Performance Tips

- **Large Files**: Files over 5 minutes may take a few seconds to process
- **Multiple Styles**: Try different presets on the same track!
- **Browser**: Chrome/Edge recommended for best WASM performance
- **Privacy**: Everything happens locally - no internet required after loading

## Keyboard Shortcuts

(Coming in Phase 2)

- `Space`: Play/Pause
- `R`: Reset to original
- `E`: Export WAV
- `1-5`: Quick select presets

## Troubleshooting

### "Failed to initialize audio engine"
- **Solution**: Refresh the page. WASM module may not have loaded properly.

### "Failed to load audio"
- **Check**: Is the file a supported audio format?
- **Try**: Convert to MP3 or WAV first

### "Failed to apply preset"
- **Solution**: Try reloading the audio file
- **Check**: Make sure audio was fully loaded before processing

### Audio sounds distorted
- **Cause**: Some presets (like 8-bit) intentionally add distortion
- **Solution**: Try the "Clean" preset or reduce effect intensity (Phase 2 feature)

### Playback stutters
- **Cause**: Large file + low-end device
- **Solution**:
  - Close other browser tabs
  - Try a shorter audio file
  - Use a desktop browser instead of mobile

### Export button disabled
- **Cause**: No preset has been applied yet
- **Solution**: Select and apply a preset first

## Advanced Usage

### Custom Presets (Future)

In Phase 2, you'll be able to:
- Adjust individual effect parameters
- Save custom preset configurations
- Import/export presets as JSON
- Share presets with others

### Effect Parameters

Each preset is a combination of effects:

1. **EQ (Equalizer)**
   - Low/Mid/High frequency bands
   - Gain adjustment in dB

2. **Bitcrusher**
   - Bit depth reduction (1-16 bits)
   - Sample rate reduction
   - Wet/dry mix

3. **Reverb**
   - Room size
   - Damping (high-frequency absorption)
   - Stereo width
   - Wet/dry mix

4. **Compressor**
   - Threshold, ratio, attack, release
   - Makeup gain

5. **Limiter**
   - Ceiling level (maximum output)

6. **Stereo Processor**
   - Width (mono to super-wide)
   - Pan (left-right balance)

## Privacy & Security

✅ **All processing happens in your browser**
- Your audio files are NEVER uploaded to any server
- No tracking, no analytics, no data collection
- Works completely offline (after initial page load)
- Can be used on sensitive/unreleased material safely

## Technical Details

### Audio Processing

- **Engine**: Rust compiled to WebAssembly
- **Sample Precision**: 32-bit float internally
- **Export Format**: 16-bit PCM WAV
- **Processing**: Chunked (8192 samples) to avoid UI blocking

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Excellent | Best performance |
| Edge 90+ | ✅ Excellent | Chromium-based |
| Firefox 90+ | ✅ Good | Slightly slower WASM |
| Safari 14+ | ⚠️ Partial | Some audio formats limited |
| Mobile Chrome | ✅ Good | May be slow on large files |

### File Size Limits

- **Recommended**: < 10 MB
- **Maximum**: Limited only by browser memory (~100 MB typical)
- **Duration**: No limit (longer files = longer processing time)

## Support

For bugs or feature requests:
- Check the [GitHub repository](https://github.com/GeoffreyWang1117/Foobar2026-WASM)
- See `DEVELOPMENT.md` for technical details

---

**Enjoy transforming your music! 🎵✨**
