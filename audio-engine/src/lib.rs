/*!
 * Audio Style Filter Engine - WASM Module
 *
 * A WebAssembly-based audio processing engine for applying various music styles
 * and effects to audio in the browser.
 *
 * Features:
 * - Multiple built-in style presets (8-bit, Touhou, FM synthesis, Lo-fi, etc.)
 * - Extensible effect system
 * - AI model interface for intelligent style transformation
 * - Custom preset support
 */

use wasm_bindgen::prelude::*;
use web_sys::console;

mod dsp;
mod styles;
mod ai;

use styles::*;
use ai::*;

/// JavaScript console logging
macro_rules! log {
    ($($t:tt)*) => {
        console::log_1(&format!($($t)*).into());
    }
}

/// Audio engine instance - main processing engine
#[wasm_bindgen]
pub struct AudioEngine {
    sample_rate: f32,
    audio_data: Vec<Vec<f32>>,
    processed_data: Vec<Vec<f32>>,
    current_preset: Option<StylePreset>,
    pipeline: Option<AudioPipeline>,
    feature_extractor: BasicFeatureExtractor,
}

#[wasm_bindgen]
impl AudioEngine {
    /// Create a new audio engine instance
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        // Set panic hook for better error messages
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        log!("Audio Engine initialized with sample rate: {}", sample_rate);

        Self {
            sample_rate,
            audio_data: Vec::new(),
            processed_data: Vec::new(),
            current_preset: None,
            pipeline: None,
            feature_extractor: BasicFeatureExtractor::new(),
        }
    }

    /// Load audio data (expects interleaved float32 array)
    #[wasm_bindgen(js_name = loadAudio)]
    pub fn load_audio(&mut self, audio_data: Vec<f32>, num_channels: usize) -> Result<(), JsValue> {
        if num_channels == 0 {
            return Err(JsValue::from_str("Number of channels must be greater than 0"));
        }

        let num_samples = audio_data.len() / num_channels;

        // De-interleave audio data
        let mut channels = vec![vec![0.0; num_samples]; num_channels];

        for i in 0..num_samples {
            for ch in 0..num_channels {
                channels[ch][i] = audio_data[i * num_channels + ch];
            }
        }

        self.audio_data = channels;
        self.processed_data = self.audio_data.clone();

        log!(
            "Loaded audio: {} channels, {} samples",
            num_channels,
            num_samples
        );

        Ok(())
    }

    /// Apply a style preset by ID
    #[wasm_bindgen(js_name = applyPreset)]
    pub fn apply_preset(&mut self, preset_id: &str) -> Result<(), JsValue> {
        let preset = PresetLibrary::get_by_id(preset_id)
            .ok_or_else(|| JsValue::from_str(&format!("Preset not found: {}", preset_id)))?;

        self.apply_preset_obj(preset)
    }

    /// Apply a custom style preset from JSON
    #[wasm_bindgen(js_name = applyCustomPreset)]
    pub fn apply_custom_preset(&mut self, preset_json: &str) -> Result<(), JsValue> {
        let preset = StylePreset::from_json(preset_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse preset: {}", e)))?;

        self.apply_preset_obj(preset)
    }

    /// Internal method to apply preset
    fn apply_preset_obj(&mut self, preset: StylePreset) -> Result<(), JsValue> {
        if self.audio_data.is_empty() {
            return Err(JsValue::from_str("No audio data loaded"));
        }

        log!("Applying preset: {}", preset.name);

        let num_channels = self.audio_data.len();
        let pipeline = AudioPipeline::from_preset(&preset, self.sample_rate, num_channels);

        self.current_preset = Some(preset);
        self.pipeline = Some(pipeline);

        // Process audio
        self.process_audio()?;

        Ok(())
    }

    /// Process audio through the current pipeline
    fn process_audio(&mut self) -> Result<(), JsValue> {
        if self.audio_data.is_empty() {
            return Err(JsValue::from_str("No audio data loaded"));
        }

        let pipeline = self.pipeline.as_mut()
            .ok_or_else(|| JsValue::from_str("No preset applied"))?;

        // Clone original data for processing
        self.processed_data = self.audio_data.clone();

        // Process in chunks to avoid blocking
        let chunk_size = 8192;
        pipeline.process_chunked(&mut self.processed_data, chunk_size);

        log!("Audio processing complete");

        Ok(())
    }

    /// Get processed audio data (interleaved)
    #[wasm_bindgen(js_name = getProcessedAudio)]
    pub fn get_processed_audio(&self) -> Result<Vec<f32>, JsValue> {
        if self.processed_data.is_empty() {
            return Err(JsValue::from_str("No processed audio available"));
        }

        let num_channels = self.processed_data.len();
        let num_samples = self.processed_data[0].len();
        let mut interleaved = vec![0.0; num_samples * num_channels];

        // Interleave channels
        for i in 0..num_samples {
            for ch in 0..num_channels {
                interleaved[i * num_channels + ch] = self.processed_data[ch][i];
            }
        }

        Ok(interleaved)
    }

    /// Get original audio data (interleaved)
    #[wasm_bindgen(js_name = getOriginalAudio)]
    pub fn get_original_audio(&self) -> Result<Vec<f32>, JsValue> {
        if self.audio_data.is_empty() {
            return Err(JsValue::from_str("No audio data available"));
        }

        let num_channels = self.audio_data.len();
        let num_samples = self.audio_data[0].len();
        let mut interleaved = vec![0.0; num_samples * num_channels];

        for i in 0..num_samples {
            for ch in 0..num_channels {
                interleaved[i * num_channels + ch] = self.audio_data[ch][i];
            }
        }

        Ok(interleaved)
    }

    /// Extract audio features for analysis
    #[wasm_bindgen(js_name = extractFeatures)]
    pub fn extract_features(&self) -> Result<JsValue, JsValue> {
        if self.audio_data.is_empty() {
            return Err(JsValue::from_str("No audio data loaded"));
        }

        let features = self.feature_extractor.extract(&self.audio_data, self.sample_rate);

        serde_wasm_bindgen::to_value(&features)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize features: {}", e)))
    }

    /// Get current preset info as JSON
    #[wasm_bindgen(js_name = getCurrentPreset)]
    pub fn get_current_preset(&self) -> Option<String> {
        self.current_preset.as_ref().and_then(|p| p.to_json().ok())
    }

    /// Get number of channels
    #[wasm_bindgen(js_name = getChannelCount)]
    pub fn get_channel_count(&self) -> usize {
        self.audio_data.len()
    }

    /// Get number of samples
    #[wasm_bindgen(js_name = getSampleCount)]
    pub fn get_sample_count(&self) -> usize {
        if self.audio_data.is_empty() {
            0
        } else {
            self.audio_data[0].len()
        }
    }

    /// Get duration in seconds
    #[wasm_bindgen(js_name = getDuration)]
    pub fn get_duration(&self) -> f32 {
        if self.audio_data.is_empty() || self.sample_rate == 0.0 {
            0.0
        } else {
            self.audio_data[0].len() as f32 / self.sample_rate
        }
    }

    /// Reset to original audio
    #[wasm_bindgen(js_name = reset)]
    pub fn reset(&mut self) {
        self.processed_data = self.audio_data.clone();
        self.current_preset = None;
        self.pipeline = None;
        log!("Engine reset");
    }
}

/// Preset library functions (static)
#[wasm_bindgen]
pub struct PresetLib;

#[wasm_bindgen]
impl PresetLib {
    /// Get all built-in presets as JSON array
    #[wasm_bindgen(js_name = getAllPresets)]
    pub fn get_all_presets() -> Result<JsValue, JsValue> {
        let presets = PresetLibrary::get_all();

        serde_wasm_bindgen::to_value(&presets)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize presets: {}", e)))
    }

    /// Get a specific preset by ID as JSON
    #[wasm_bindgen(js_name = getPresetById)]
    pub fn get_preset_by_id(id: &str) -> Option<String> {
        PresetLibrary::get_by_id(id).and_then(|p| p.to_json().ok())
    }

    /// Get preset categories
    #[wasm_bindgen(js_name = getCategories)]
    pub fn get_categories() -> Vec<String> {
        let mut categories: Vec<String> = PresetLibrary::get_all()
            .iter()
            .map(|p| p.category.clone())
            .collect();

        categories.sort();
        categories.dedup();
        categories
    }
}

/// Version information
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Initialize the engine (must be called first)
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    log!("Audio Style Filter Engine v{} loaded", version());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let engine = AudioEngine::new(44100.0);
        assert_eq!(engine.sample_rate, 44100.0);
        assert_eq!(engine.get_channel_count(), 0);
    }

    #[test]
    fn test_load_audio() {
        let mut engine = AudioEngine::new(44100.0);
        let audio_data = vec![0.5, -0.5, 0.3, -0.3, 0.7, -0.7];

        engine.load_audio(audio_data, 2).unwrap();

        assert_eq!(engine.get_channel_count(), 2);
        assert_eq!(engine.get_sample_count(), 3);
    }
}
