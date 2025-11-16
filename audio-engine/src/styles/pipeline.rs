/// Audio processing pipeline - executes effect chains

use crate::dsp::*;
use crate::styles::preset::{EffectConfig, StylePreset};
use std::fmt;

/// Audio effect trait - all effects must implement this
pub trait AudioEffect: fmt::Debug {
    /// Process audio buffer in-place
    fn process(&mut self, buffer: &mut [Vec<f32>]);

    /// Reset effect state
    fn reset(&mut self);

    /// Get effect name
    fn name(&self) -> &str;
}

/// EQ effect wrapper
#[derive(Debug)]
struct EQEffect {
    processor: ThreeBandEQ,
}

impl AudioEffect for EQEffect {
    fn process(&mut self, buffer: &mut [Vec<f32>]) {
        self.processor.process(buffer);
    }

    fn reset(&mut self) {
        self.processor.reset();
    }

    fn name(&self) -> &str {
        "EQ"
    }
}

/// Bitcrush effect wrapper
#[derive(Debug)]
struct BitcrushEffect {
    processor: Bitcrusher,
}

impl AudioEffect for BitcrushEffect {
    fn process(&mut self, buffer: &mut [Vec<f32>]) {
        self.processor.process(buffer);
    }

    fn reset(&mut self) {
        self.processor.reset();
    }

    fn name(&self) -> &str {
        "Bitcrush"
    }
}

/// Reverb effect wrapper
#[derive(Debug)]
struct ReverbEffect {
    processor: Reverb,
}

impl AudioEffect for ReverbEffect {
    fn process(&mut self, buffer: &mut [Vec<f32>]) {
        self.processor.process(buffer);
    }

    fn reset(&mut self) {
        self.processor.reset();
    }

    fn name(&self) -> &str {
        "Reverb"
    }
}

/// Compressor effect wrapper
#[derive(Debug)]
struct CompressorEffect {
    processor: Compressor,
}

impl AudioEffect for CompressorEffect {
    fn process(&mut self, buffer: &mut [Vec<f32>]) {
        self.processor.process(buffer);
    }

    fn reset(&mut self) {
        self.processor.reset();
    }

    fn name(&self) -> &str {
        "Compressor"
    }
}

/// Limiter effect wrapper
#[derive(Debug)]
struct LimiterEffect {
    processor: Limiter,
}

impl AudioEffect for LimiterEffect {
    fn process(&mut self, buffer: &mut [Vec<f32>]) {
        self.processor.process(buffer);
    }

    fn reset(&mut self) {
        self.processor.reset();
    }

    fn name(&self) -> &str {
        "Limiter"
    }
}

/// Stereo effect wrapper
#[derive(Debug)]
struct StereoEffect {
    processor: StereoProcessor,
}

impl AudioEffect for StereoEffect {
    fn process(&mut self, buffer: &mut [Vec<f32>]) {
        self.processor.process(buffer);
    }

    fn reset(&mut self) {
        // Stereo processor is stateless
    }

    fn name(&self) -> &str {
        "Stereo"
    }
}

/// Audio processing pipeline
pub struct AudioPipeline {
    effects: Vec<Box<dyn AudioEffect>>,
    sample_rate: f32,
}

impl AudioPipeline {
    /// Create a new empty pipeline
    pub fn new(sample_rate: f32) -> Self {
        Self {
            effects: Vec::new(),
            sample_rate,
        }
    }

    /// Create pipeline from a style preset
    pub fn from_preset(preset: &StylePreset, sample_rate: f32, num_channels: usize) -> Self {
        let mut pipeline = Self::new(sample_rate);

        for effect_config in &preset.effects {
            if let Some(effect) = pipeline.create_effect(effect_config, num_channels) {
                pipeline.effects.push(effect);
            }
        }

        pipeline
    }

    /// Create an effect from configuration
    fn create_effect(
        &self,
        config: &EffectConfig,
        num_channels: usize,
    ) -> Option<Box<dyn AudioEffect>> {
        match config {
            EffectConfig::EQ { params } => Some(Box::new(EQEffect {
                processor: ThreeBandEQ::new(params.clone(), self.sample_rate, num_channels),
            })),

            EffectConfig::Bitcrush { params } => Some(Box::new(BitcrushEffect {
                processor: Bitcrusher::new(params.clone(), num_channels),
            })),

            EffectConfig::Reverb { params } => Some(Box::new(ReverbEffect {
                processor: Reverb::new(params.clone(), self.sample_rate),
            })),

            EffectConfig::Compressor { params } => Some(Box::new(CompressorEffect {
                processor: Compressor::new(params.clone(), self.sample_rate),
            })),

            EffectConfig::Limiter { params } => Some(Box::new(LimiterEffect {
                processor: Limiter::new(params.clone(), self.sample_rate),
            })),

            EffectConfig::Stereo { params } => Some(Box::new(StereoEffect {
                processor: StereoProcessor::new(params.clone()),
            })),
        }
    }

    /// Add an effect to the pipeline
    pub fn add_effect(&mut self, effect: Box<dyn AudioEffect>) {
        self.effects.push(effect);
    }

    /// Process audio buffer through all effects in the pipeline
    pub fn process(&mut self, buffer: &mut [Vec<f32>]) {
        for effect in &mut self.effects {
            effect.process(buffer);
        }
    }

    /// Process audio in chunks (for large files)
    pub fn process_chunked(&mut self, buffer: &mut [Vec<f32>], chunk_size: usize) {
        if buffer.is_empty() || buffer[0].is_empty() {
            return;
        }

        let total_samples = buffer[0].len();
        let mut offset = 0;

        while offset < total_samples {
            let end = (offset + chunk_size).min(total_samples);

            // Create chunk views
            let mut chunk: Vec<Vec<f32>> = buffer
                .iter()
                .map(|channel| channel[offset..end].to_vec())
                .collect();

            // Process chunk
            self.process(&mut chunk);

            // Copy back
            for (ch_idx, channel) in buffer.iter_mut().enumerate() {
                channel[offset..end].copy_from_slice(&chunk[ch_idx]);
            }

            offset = end;
        }
    }

    /// Reset all effects in the pipeline
    pub fn reset(&mut self) {
        for effect in &mut self.effects {
            effect.reset();
        }
    }

    /// Get number of effects in pipeline
    pub fn effect_count(&self) -> usize {
        self.effects.len()
    }

    /// Get effect names
    pub fn effect_names(&self) -> Vec<String> {
        self.effects.iter().map(|e| e.name().to_string()).collect()
    }
}

impl fmt::Debug for AudioPipeline {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("AudioPipeline")
            .field("sample_rate", &self.sample_rate)
            .field("effect_count", &self.effects.len())
            .field("effects", &self.effect_names())
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::styles::preset::PresetLibrary;

    #[test]
    fn test_pipeline_creation() {
        let preset = PresetLibrary::preset_8bit();
        let pipeline = AudioPipeline::from_preset(&preset, 44100.0, 2);

        assert!(pipeline.effect_count() > 0);
    }

    #[test]
    fn test_pipeline_processing() {
        let preset = PresetLibrary::preset_clean();
        let mut pipeline = AudioPipeline::from_preset(&preset, 44100.0, 2);

        let mut buffer = vec![
            vec![0.5, -0.3, 0.7, -0.9],
            vec![-0.5, 0.3, -0.7, 0.9],
        ];

        pipeline.process(&mut buffer);

        // Check output is valid
        for channel in &buffer {
            for &sample in channel {
                assert!(sample.abs() <= 1.1); // Allow small overflow before limiting
            }
        }
    }
}
