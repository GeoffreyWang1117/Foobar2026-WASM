/// Bitcrusher module - reduces bit depth and sample rate for lo-fi effects

use serde::{Deserialize, Serialize};

/// Bitcrusher parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BitcrushParams {
    /// Bit depth (1-16, simulated bit depth)
    pub bit_depth: u32,
    /// Sample rate reduction factor (1 = no reduction, higher = more reduction)
    pub rate_reduction: u32,
    /// Wet/dry mix (0.0 = dry, 1.0 = wet)
    pub mix: f32,
}

impl Default for BitcrushParams {
    fn default() -> Self {
        Self {
            bit_depth: 16,
            rate_reduction: 1,
            mix: 1.0,
        }
    }
}

/// Bitcrusher processor
#[derive(Debug)]
pub struct Bitcrusher {
    params: BitcrushParams,
    hold_samples: Vec<f32>,
    counter: usize,
}

impl Bitcrusher {
    pub fn new(params: BitcrushParams, num_channels: usize) -> Self {
        Self {
            params,
            hold_samples: vec![0.0; num_channels],
            counter: 0,
        }
    }

    pub fn set_params(&mut self, params: BitcrushParams) {
        self.params = params;
    }

    /// Process audio buffer through bitcrusher
    pub fn process(&mut self, buffer: &mut [Vec<f32>]) {
        let bit_depth = self.params.bit_depth.max(1).min(16);
        let levels = (1 << bit_depth) as f32;
        let step = 2.0 / levels;

        for (ch_idx, channel) in buffer.iter_mut().enumerate() {
            for sample in channel.iter_mut() {
                let input = *sample;

                // Sample rate reduction (sample and hold)
                if self.counter % self.params.rate_reduction as usize == 0 {
                    // Bit depth reduction
                    let crushed = ((input + 1.0) / step).floor() * step - 1.0;
                    self.hold_samples[ch_idx] = crushed.clamp(-1.0, 1.0);
                }

                // Mix wet/dry
                let wet = self.hold_samples[ch_idx];
                *sample = input * (1.0 - self.params.mix) + wet * self.params.mix;
            }
            self.counter += 1;
        }
    }

    pub fn reset(&mut self) {
        self.hold_samples.fill(0.0);
        self.counter = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bitcrush_basic() {
        let params = BitcrushParams {
            bit_depth: 8,
            rate_reduction: 2,
            mix: 1.0,
        };
        let mut crusher = Bitcrusher::new(params, 1);

        let mut buffer = vec![vec![0.5, -0.3, 0.7, -0.9]];
        crusher.process(&mut buffer);

        // Output should be different from input due to crushing
        assert_ne!(buffer[0][0], 0.5);
    }
}
