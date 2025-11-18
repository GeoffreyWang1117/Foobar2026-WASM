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

### Performance Settings (NEW in Phase 3!)

Click the **⚙️ Settings** button in the top-right corner to access performance options:

**Processing Engine Modes:**

1. **⚡ Web Worker Mode (Default - Recommended)**:
   - Processes audio in a separate thread
   - UI remains responsive during processing
   - No freezing or lag when adjusting parameters
   - Best for: Large files, real-time parameter tuning
   - Slightly higher memory usage

2. **🔧 Main Thread Mode**:
   - Processes audio on the main thread
   - Maximum compatibility with all browsers
   - UI may freeze briefly during processing
   - Best for: Smaller files, maximum compatibility
   - Lower memory usage

**When to use each mode:**
- **Use Web Worker** for files > 3 minutes or when adjusting many parameters
- **Use Main Thread** if experiencing issues or on older devices

⚠️ **Note**: Changing the engine mode requires reloading your audio file.

---

### Choose Your Processing Mode

The app offers two modes:

1. **🎵 Single File Mode**: Process one audio file at a time with full control
   - Upload, preview, adjust parameters, and export single files
   - Full waveform visualization and A/B comparison
   - Real-time parameter tuning

2. **📦 Batch Processing Mode**: Process multiple files at once
   - Upload multiple audio files simultaneously
   - Apply the same preset to all files in one go
   - Queue management with progress tracking
   - Batch export all processed files

---

## Single File Mode

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

- **🌊 Vaporwave Aesthetic**
  - Slowed, reverb-heavy 80s aesthetic
  - Enhanced bass and highs
  - Extra-wide stereo image
  - Large reverb for dreamy atmosphere
  - Perfect for: A E S T H E T I C vibes, nostalgic tracks

- **🌃 Synthwave**
  - Retro 80s synthwave sound
  - Punchy and energetic
  - Enhanced bass presence
  - Fast attack compression for impact
  - Perfect for: Outrun style, retro action music

- **💿 80s Pop**
  - Classic 80s pop production
  - Bright, punchy sound
  - Gated reverb character
  - Heavy compression for loud pop sound
  - Perfect for: Pop music, upbeat tracks

- **🔊 Clean & Transparent**
  - Minimal processing
  - Only brick-wall limiting for safety
  - Perfect for: High-fidelity playback

### Step 4: Apply the Style

1. Click on a preset to select it (border will turn purple)
2. Click **"✨ Apply Style"** button
3. Wait for processing (usually < 1 second)
4. Waveform on the right updates with processed audio

### Step 5: Fine-Tune Parameters (Phase 2 Feature!)

After applying a preset, customize the sound to your liking:

1. **Parameter Sliders**: A "🎛️ Fine-Tune Parameters" section appears below
2. **Real-Time Adjustment**: Move any slider to instantly update the audio
3. **Effect Controls**: Adjust EQ, reverb, compression, stereo width, and more
4. **Live Preview**: Changes are processed and applied immediately

**Available Parameters by Effect:**
- **EQ**: Low/Mid/High frequency gain (-12dB to +12dB)
- **Bitcrush**: Bit depth (1-16 bit), sample rate reduction, dry/wet mix
- **Reverb**: Room size, damping, mix level
- **Compression**: Threshold, ratio, attack/release times, makeup gain
- **Stereo**: Width (0=mono, 2=extra wide), pan position
- **Limiter**: Threshold, release time

### Step 6: Save & Share Custom Presets (Phase 2 Feature!)

**Export Your Custom Settings:**
1. After adjusting parameters, click **"📤 Export"** in the Fine-Tune section
2. A JSON file downloads with your custom preset
3. Share this file with others or save for later!

**Import Custom Presets:**
1. Click **"📥 Import"** in the Fine-Tune section
2. Select a preset JSON file
3. The custom preset applies automatically
4. All parameters are restored exactly as saved

### Step 7: A/B Comparison

Use the audio player's mode selector:
- **🎼 Original**: Hear the unprocessed audio
- **✨ Processed**: Hear the styled version

Switch between them in real-time to compare!

### Step 8: Export Your Result

1. Click **"⬇️ Export WAV"** button
2. File downloads automatically as `filename_stylename.wav`
3. High-quality 16-bit PCM WAV format
4. Ready to use in any audio software

---

## Batch Processing Mode

### Step 1: Add Multiple Files

1. Click the **"📦 Batch Processing Mode"** button at the top
2. Click the upload area or drag & drop multiple audio files
3. All files will appear in the queue with "⏳ Pending" status
4. You can add more files at any time

### Step 2: Select a Preset

1. Choose a preset from the grid (same 8 presets available)
2. The selected preset will be applied to ALL files in the queue
3. The preset will be highlighted in purple when selected

### Step 3: Process the Batch

1. Click **"✨ Process Batch (N files)"** button
2. Watch the progress as each file is processed:
   - **⏳ Pending**: Waiting in queue
   - **⚙️ Processing**: Currently being processed with progress bar
   - **✅ Completed**: Successfully processed
   - **❌ Error**: Failed (with error message)
3. Processing happens sequentially, one file at a time
4. You can monitor the statistics at the top (Pending/Processing/Completed/Errors)

### Step 4: Export All Processed Files

1. After processing completes, click **"⬇️ Export All (N)"**
2. All completed files will download automatically
3. Files are named: `original_filename_processed.wav`
4. High-quality 16-bit PCM WAV format

### Step 5: Queue Management

**Remove Individual Files:**
- Click the 🗑️ button next to any file to remove it from the queue

**Clear Completed Files:**
- Click **"🗑️ Clear Completed"** to remove all successfully processed files
- This helps manage the queue when processing large batches

**Add More Files:**
- You can add more files while processing or after completion
- New files will be added with "Pending" status

### Tips for Batch Processing

1. **Large Batches**: For 10+ files, processing may take a few minutes
2. **File Sizes**: Keep individual files under 10MB for best performance
3. **Same Style**: All files in a batch get the same preset - plan accordingly
4. **Error Handling**: If a file fails, others will continue processing
5. **Memory**: Very large batches (50+ files) may consume significant memory

---

## Region Processing Mode (Phase 3 Feature!)

Process only a specific portion of your audio file while leaving the rest untouched.

### Step 1: Enable Region Processing

1. Upload and load your audio file as usual
2. Look for the **"🎯 Region Processing"** panel below the upload section
3. Click **"Enable"** to activate region processing mode

### Step 2: Select a Region

1. **Click and Drag** on the waveform to select a region
   - Click where you want the region to start
   - Drag to where you want it to end
   - Release to complete the selection

2. **Adjust Region Boundaries**:
   - Click and drag the **purple handles** at the start and end to resize
   - Click and drag **inside the region** to move it without changing size
   - The selected region will be highlighted in purple

3. **View Region Info**:
   - Start time, end time, and duration are displayed below the waveform
   - Times are shown in MM:SS.MS format (minutes:seconds.milliseconds)

### Step 3: Apply Preset to Region

1. Select a style preset from the **"🎨 Choose Style"** section
2. Click **"✨ Apply to Region"** button
3. The preset will be applied only to the selected region
4. The rest of the audio remains unchanged

### Step 4: Export Options

**Export Full Audio:**
- Use the standard **"⬇️ Export WAV"** button
- Exports the complete audio with the processed region

**Export Region Only:**
- Click **"⬇️ Export Region"** button
- Exports only the selected (and processed) region as a separate file

### Step 5: Clear Region

- Click the **"✕ Clear Region"** button to deselect and start over
- Or click **"Enable"** again to disable region mode entirely

### Use Cases for Region Processing

1. **Fix Specific Sections**: Apply noise reduction to only the problematic parts
2. **Creative Effects**: Add 8-bit effect to the chorus while keeping verses clean
3. **Highlight Moments**: Apply special processing to drops, solos, or key moments
4. **Selective Enhancement**: Boost only the quiet parts without affecting loud sections
5. **Experimentation**: Test different presets on different parts of the same track

### Tips for Region Processing

1. **Precise Selection**: Use the handle dragging for fine-tuned control
2. **Multiple Regions**: Process one region, export, then select another (sequential workflow)
3. **Undo**: Clear the region and reselect if you make a mistake
4. **Preview**: The audio player will play the full file including processed region
5. **Export Both**: Export the full file AND just the region for maximum flexibility

---

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

5. **Vaporwave**:
   - Best for dreamy, atmospheric tracks
   - Enhances 80s-style synths and samples
   - Creates spacious, nostalgic soundscapes
   - Try on slowed-down music for extra effect

6. **Synthwave**:
   - Excellent for retro electronic music
   - Adds punch and energy to synth tracks
   - Great for action-oriented music
   - Works well with driving basslines

7. **80s Pop**:
   - Perfect for bright, commercial-sounding mixes
   - Makes vocals and leads more prominent
   - Adds that classic "radio ready" sound
   - Best for upbeat, energetic tracks

8. **Clean**:
   - Use when you just want volume normalization
   - Good for comparing processing vs. no processing
   - Safe loudness for all tracks

### Performance Tips

- **Large Files**: Files over 5 minutes may take a few seconds to process
- **Multiple Styles**: Try different presets on the same track!
- **Browser**: Chrome/Edge recommended for best WASM performance
- **Privacy**: Everything happens locally - no internet required after loading

## Keyboard Shortcuts

(Coming in Phase 3)

- `Space`: Play/Pause
- `R`: Reset to original
- `E`: Export WAV
- `1-8`: Quick select presets

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

### Understanding Effect Parameters

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

## 📱 Progressive Web App (PWA)

The Music Style Filter can be installed as a standalone application on your device!

### Installing as an App

**Desktop Installation (Chrome/Edge):**
1. Visit the app in your browser
2. Look for the **📱 Install** banner at the bottom of the screen
3. Click **"✨ Install"** button
4. The app will be added to your desktop/start menu
5. Launch it like any other application

**Mobile Installation:**

*Android (Chrome):*
1. Open the app in Chrome
2. Tap the install banner or use the menu **⋮** → **"Add to Home screen"**
3. The app icon will appear on your home screen
4. Tap to launch in fullscreen mode

*iOS (Safari):*
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll and tap **"Add to Home Screen"**
4. The app will appear on your home screen
5. Launch it for an app-like experience

### PWA Features

**Offline Support:**
- Process audio files without internet connection
- All audio processing happens locally
- Access the app even when offline
- Note: Initial WASM module requires internet for first load

**Automatic Updates:**
- New versions install automatically in the background
- You'll see an **🆕 Update Available** notification
- Click **"🔄 Update Now"** to reload with the latest version
- No manual updates needed!

**App-Like Experience:**
- Runs in its own window (no browser tabs/UI)
- Appears in your taskbar/dock like a native app
- Fast startup with cached resources
- Works seamlessly with file uploads

**Storage & Caching:**
- App assets are cached for instant loading
- No repeated downloads
- Check storage usage in browser settings if needed
- Clear cache via browser settings if experiencing issues

### Managing the PWA

**Uninstalling:**
- **Desktop**: Right-click app icon → Uninstall
- **Android**: Long-press icon → Remove
- **iOS**: Long-press icon → Remove App

**Updating:**
- Updates happen automatically
- You'll be notified when a new version is available
- Click update notification to apply changes
- App continues working during update process

### Benefits of Installing

✅ **Faster**: Instant startup with cached assets
✅ **Offline**: Work without internet connection
✅ **Focused**: No browser distractions
✅ **Convenient**: Launch from desktop/home screen
✅ **Privacy**: All processing stays local on your device

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
