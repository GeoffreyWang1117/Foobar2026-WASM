/// Dynamic range compressor

use super::utils::{db_to_gain, gain_to_db};
use serde::{Deserialize, Serialize};

/// Compressor parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressorParams {
    /// Threshold in dB (above this level, compression kicks in)
    pub threshold: f32,
    /// Ratio (e.g., 4.0 means 4:1 compression)
    pub ratio: f32,
    /// Attack time in milliseconds
    pub attack_ms: f32,
    /// Release time in milliseconds
    pub release_ms: f32,
    /// Makeup gain in dB
    pub makeup_gain: f32,
}

impl Default for CompressorParams {
    fn default() -> Self {
        Self {
            threshold: -20.0,
            ratio: 4.0,
            attack_ms: 10.0,
            release_ms: 100.0,
            makeup_gain: 0.0,
        }
    }
}

/// Dynamic range compressor
#[derive(Debug)]
pub struct Compressor {
    params: CompressorParams,
    sample_rate: f32,
    envelope: f32,
    attack_coeff: f32,
    release_coeff: f32,
}

impl Compressor {
    pub fn new(params: CompressorParams, sample_rate: f32) -> Self {
        let attack_coeff = Self::calc_coeff(params.attack_ms, sample_rate);
        let release_coeff = Self::calc_coeff(params.release_ms, sample_rate);

        Self {
            params,
            sample_rate,
            envelope: 0.0,
            attack_coeff,
            release_coeff,
        }
    }

    fn calc_coeff(time_ms: f32, sample_rate: f32) -> f32 {
        (-1000.0 / (time_ms * sample_rate)).exp()
    }

    pub fn set_params(&mut self, params: CompressorParams) {
        self.attack_coeff = Self::calc_coeff(params.attack_ms, self.sample_rate);
        self.release_coeff = Self::calc_coeff(params.release_ms, self.sample_rate);
        self.params = params;
    }

    /// Process audio buffer through compressor
    pub fn process(&mut self, buffer: &mut [Vec<f32>]) {
        let makeup_gain = db_to_gain(self.params.makeup_gain);

        for i in 0..buffer[0].len() {
            // Get peak value across all channels
            let mut peak = 0.0_f32;
            for channel in buffer.iter() {
                peak = peak.max(channel[i].abs());
            }

            // Convert to dB
            let peak_db = if peak > 0.0001 {
                gain_to_db(peak)
            } else {
                -100.0
            };

            // Envelope follower
            let target_envelope = peak;
            if target_envelope > self.envelope {
                self.envelope = self.attack_coeff * (self.envelope - target_envelope) + target_envelope;
            } else {
                self.envelope = self.release_coeff * (self.envelope - target_envelope) + target_envelope;
            }

            // Calculate gain reduction
            let gain_reduction = if peak_db > self.params.threshold {
                let overshoot = peak_db - self.params.threshold;
                let compressed = overshoot / self.params.ratio;
                let reduction_db = overshoot - compressed;
                db_to_gain(-reduction_db)
            } else {
                1.0
            };

            // Apply compression and makeup gain to all channels
            let total_gain = gain_reduction * makeup_gain;
            for channel in buffer.iter_mut() {
                channel[i] *= total_gain;
                channel[i] = channel[i].clamp(-1.0, 1.0);
            }
        }
    }

    pub fn reset(&mut self) {
        self.envelope = 0.0;
    }
}

/// Simple limiter (extreme compressor with very high ratio)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LimiterParams {
    /// Ceiling level in dB (nothing goes above this)
    pub ceiling: f32,
    /// Release time in milliseconds
    pub release_ms: f32,
}

impl Default for LimiterParams {
    fn default() -> Self {
        Self {
            ceiling: -0.3,
            release_ms: 50.0,
        }
    }
}

#[derive(Debug)]
pub struct Limiter {
    params: LimiterParams,
    sample_rate: f32,
    envelope: f32,
    release_coeff: f32,
}

impl Limiter {
    pub fn new(params: LimiterParams, sample_rate: f32) -> Self {
        let release_coeff = (-1000.0 / (params.release_ms * sample_rate)).exp();

        Self {
            params,
            sample_rate,
            envelope: 1.0,
            release_coeff,
        }
    }

    pub fn set_params(&mut self, params: LimiterParams) {
        self.release_coeff = (-1000.0 / (params.release_ms * self.sample_rate)).exp();
        self.params = params;
    }

    pub fn process(&mut self, buffer: &mut [Vec<f32>]) {
        let ceiling_linear = db_to_gain(self.params.ceiling);

        for i in 0..buffer[0].len() {
            // Find peak across all channels
            let mut peak = 0.0_f32;
            for channel in buffer.iter() {
                peak = peak.max(channel[i].abs());
            }

            // Calculate required gain
            let required_gain = if peak > ceiling_linear {
                ceiling_linear / peak
            } else {
                1.0
            };

            // Smooth gain changes (instant attack, slow release)
            if required_gain < self.envelope {
                self.envelope = required_gain;
            } else {
                self.envelope = self.release_coeff * (self.envelope - required_gain) + required_gain;
            }

            // Apply limiting to all channels
            for channel in buffer.iter_mut() {
                channel[i] *= self.envelope;
            }
        }
    }

    pub fn reset(&mut self) {
        self.envelope = 1.0;
    }
}
