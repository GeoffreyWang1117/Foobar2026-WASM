/// Equalizer module - multi-band frequency adjustment

use super::utils::{BiquadCoeffs, BiquadState};
use serde::{Deserialize, Serialize};

/// Three-band EQ parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EQParams {
    /// Low frequency gain in dB (-12 to +12)
    pub low_gain: f32,
    /// Mid frequency gain in dB (-12 to +12)
    pub mid_gain: f32,
    /// High frequency gain in dB (-12 to +12)
    pub high_gain: f32,
    /// Low frequency crossover point (Hz)
    pub low_freq: f32,
    /// High frequency crossover point (Hz)
    pub high_freq: f32,
}

impl Default for EQParams {
    fn default() -> Self {
        Self {
            low_gain: 0.0,
            mid_gain: 0.0,
            high_gain: 0.0,
            low_freq: 250.0,
            high_freq: 4000.0,
        }
    }
}

/// Three-band equalizer processor
#[derive(Debug)]
pub struct ThreeBandEQ {
    params: EQParams,
    sample_rate: f32,
    // Filter states for each channel
    low_states: Vec<BiquadState>,
    mid_states: Vec<BiquadState>,
    high_states: Vec<BiquadState>,
    // Cached coefficients
    low_coeffs: BiquadCoeffs,
    mid_coeffs: BiquadCoeffs,
    high_coeffs: BiquadCoeffs,
}

impl ThreeBandEQ {
    pub fn new(params: EQParams, sample_rate: f32, num_channels: usize) -> Self {
        let low_coeffs = BiquadCoeffs::peaking(sample_rate, params.low_freq, 0.707, params.low_gain);
        let mid_coeffs = BiquadCoeffs::peaking(
            sample_rate,
            (params.low_freq + params.high_freq) / 2.0,
            0.707,
            params.mid_gain,
        );
        let high_coeffs = BiquadCoeffs::peaking(sample_rate, params.high_freq, 0.707, params.high_gain);

        Self {
            params,
            sample_rate,
            low_states: vec![BiquadState::default(); num_channels],
            mid_states: vec![BiquadState::default(); num_channels],
            high_states: vec![BiquadState::default(); num_channels],
            low_coeffs,
            mid_coeffs,
            high_coeffs,
        }
    }

    /// Update EQ parameters and recalculate coefficients
    pub fn set_params(&mut self, params: EQParams) {
        self.params = params.clone();
        self.low_coeffs = BiquadCoeffs::peaking(
            self.sample_rate,
            params.low_freq,
            0.707,
            params.low_gain,
        );
        self.mid_coeffs = BiquadCoeffs::peaking(
            self.sample_rate,
            (params.low_freq + params.high_freq) / 2.0,
            0.707,
            params.mid_gain,
        );
        self.high_coeffs = BiquadCoeffs::peaking(
            self.sample_rate,
            params.high_freq,
            0.707,
            params.high_gain,
        );
    }

    /// Process audio buffer through the EQ
    pub fn process(&mut self, buffer: &mut [Vec<f32>]) {
        for (ch_idx, channel) in buffer.iter_mut().enumerate() {
            for sample in channel.iter_mut() {
                // Process through all three bands in series
                let mut out = *sample;
                out = self.low_states[ch_idx].process(out, &self.low_coeffs);
                out = self.mid_states[ch_idx].process(out, &self.mid_coeffs);
                out = self.high_states[ch_idx].process(out, &self.high_coeffs);
                *sample = out;
            }
        }
    }

    /// Reset all filter states
    pub fn reset(&mut self) {
        for state in &mut self.low_states {
            state.reset();
        }
        for state in &mut self.mid_states {
            state.reset();
        }
        for state in &mut self.high_states {
            state.reset();
        }
    }
}
