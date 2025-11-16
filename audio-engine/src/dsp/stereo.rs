/// Stereo width and imaging control

use serde::{Deserialize, Serialize};

/// Stereo processing parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StereoParams {
    /// Stereo width (0.0 = mono, 1.0 = normal, >1.0 = extra wide)
    pub width: f32,
    /// Pan (-1.0 = full left, 0.0 = center, 1.0 = full right)
    pub pan: f32,
}

impl Default for StereoParams {
    fn default() -> Self {
        Self {
            width: 1.0,
            pan: 0.0,
        }
    }
}

/// Stereo processor
#[derive(Debug)]
pub struct StereoProcessor {
    params: StereoParams,
}

impl StereoProcessor {
    pub fn new(params: StereoParams) -> Self {
        Self { params }
    }

    pub fn set_params(&mut self, params: StereoParams) {
        self.params = params;
    }

    /// Process stereo buffer
    /// Uses Mid/Side processing for width control
    pub fn process(&mut self, buffer: &mut [Vec<f32>]) {
        if buffer.len() < 2 {
            return; // Need at least 2 channels for stereo processing
        }

        let len = buffer[0].len().min(buffer[1].len());

        for i in 0..len {
            let left = buffer[0][i];
            let right = buffer[1][i];

            // Convert to Mid/Side
            let mid = (left + right) * 0.5;
            let side = (left - right) * 0.5;

            // Apply width (adjust side signal)
            let width_gain = self.params.width.clamp(0.0, 2.0);
            let new_side = side * width_gain;

            // Convert back to Left/Right
            let mut new_left = mid + new_side;
            let mut new_right = mid - new_side;

            // Apply panning
            if self.params.pan != 0.0 {
                let pan = self.params.pan.clamp(-1.0, 1.0);
                let left_gain = ((1.0 - pan) * 0.5).sqrt();
                let right_gain = ((1.0 + pan) * 0.5).sqrt();

                new_left *= left_gain;
                new_right *= right_gain;
            }

            buffer[0][i] = new_left.clamp(-1.0, 1.0);
            buffer[1][i] = new_right.clamp(-1.0, 1.0);
        }
    }

    /// Convert mono to pseudo-stereo by decorrelating channels
    pub fn mono_to_stereo(buffer: &mut Vec<Vec<f32>>, width: f32) {
        if buffer.is_empty() {
            return;
        }

        let mono_data = buffer[0].clone();

        // Create second channel if it doesn't exist
        if buffer.len() == 1 {
            buffer.push(mono_data.clone());
        }

        // Simple decorrelation: delay one channel slightly
        let delay_samples = 5; // Small delay for stereo effect

        for i in 0..mono_data.len() {
            let left = mono_data[i];
            let right = if i >= delay_samples {
                mono_data[i - delay_samples]
            } else {
                mono_data[i]
            };

            // Apply width
            let mid = (left + right) * 0.5;
            let side = (left - right) * 0.5 * width;

            buffer[0][i] = (mid + side).clamp(-1.0, 1.0);
            buffer[1][i] = (mid - side).clamp(-1.0, 1.0);
        }
    }

    /// Convert stereo to mono
    pub fn stereo_to_mono(buffer: &mut Vec<Vec<f32>>) {
        if buffer.len() < 2 {
            return;
        }

        let len = buffer[0].len().min(buffer[1].len());

        for i in 0..len {
            let mono = (buffer[0][i] + buffer[1][i]) * 0.5;
            buffer[0][i] = mono;
        }

        // Remove extra channels
        buffer.truncate(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stereo_width() {
        let params = StereoParams {
            width: 0.0,
            pan: 0.0,
        };
        let mut processor = StereoProcessor::new(params);

        let mut buffer = vec![
            vec![1.0, 0.5, -0.5],
            vec![-1.0, 0.3, 0.7],
        ];

        processor.process(&mut buffer);

        // Width = 0 should produce mono (identical channels)
        for i in 0..buffer[0].len() {
            let diff = (buffer[0][i] - buffer[1][i]).abs();
            assert!(diff < 0.01, "Channels should be identical at width=0");
        }
    }
}
