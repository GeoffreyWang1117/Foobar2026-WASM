/// Simple reverb module using Schroeder reverberator

use serde::{Deserialize, Serialize};

/// Reverb parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReverbParams {
    /// Room size (0.0 to 1.0)
    pub room_size: f32,
    /// Damping factor (0.0 to 1.0)
    pub damping: f32,
    /// Wet/dry mix (0.0 = dry, 1.0 = wet)
    pub mix: f32,
    /// Width of stereo spread (0.0 to 1.0)
    pub width: f32,
}

impl Default for ReverbParams {
    fn default() -> Self {
        Self {
            room_size: 0.5,
            damping: 0.5,
            mix: 0.3,
            width: 1.0,
        }
    }
}

/// Simple delay line for reverb
#[derive(Debug)]
struct DelayLine {
    buffer: Vec<f32>,
    read_pos: usize,
    write_pos: usize,
}

impl DelayLine {
    fn new(length: usize) -> Self {
        Self {
            buffer: vec![0.0; length],
            read_pos: 0,
            write_pos: 0,
        }
    }

    fn read(&self) -> f32 {
        self.buffer[self.read_pos]
    }

    fn write_and_advance(&mut self, sample: f32) {
        self.buffer[self.write_pos] = sample;
        self.write_pos = (self.write_pos + 1) % self.buffer.len();
        self.read_pos = (self.read_pos + 1) % self.buffer.len();
    }

    fn reset(&mut self) {
        self.buffer.fill(0.0);
        self.read_pos = 0;
        self.write_pos = 0;
    }
}

/// Comb filter for reverb
#[derive(Debug)]
struct CombFilter {
    delay: DelayLine,
    feedback: f32,
    damping: f32,
    filter_state: f32,
}

impl CombFilter {
    fn new(delay_length: usize) -> Self {
        Self {
            delay: DelayLine::new(delay_length),
            feedback: 0.5,
            damping: 0.5,
            filter_state: 0.0,
        }
    }

    fn process(&mut self, input: f32) -> f32 {
        let output = self.delay.read();

        // One-pole lowpass filter for damping
        self.filter_state = output * (1.0 - self.damping) + self.filter_state * self.damping;

        self.delay.write_and_advance(input + self.filter_state * self.feedback);

        output
    }

    fn set_feedback(&mut self, feedback: f32) {
        self.feedback = feedback.clamp(0.0, 1.0);
    }

    fn set_damping(&mut self, damping: f32) {
        self.damping = damping.clamp(0.0, 1.0);
    }

    fn reset(&mut self) {
        self.delay.reset();
        self.filter_state = 0.0;
    }
}

/// Allpass filter for reverb
#[derive(Debug)]
struct AllpassFilter {
    delay: DelayLine,
    feedback: f32,
}

impl AllpassFilter {
    fn new(delay_length: usize) -> Self {
        Self {
            delay: DelayLine::new(delay_length),
            feedback: 0.5,
        }
    }

    fn process(&mut self, input: f32) -> f32 {
        let delayed = self.delay.read();
        let output = -input + delayed;
        self.delay.write_and_advance(input + delayed * self.feedback);
        output
    }

    fn reset(&mut self) {
        self.delay.reset();
    }
}

/// Schroeder reverberator
#[derive(Debug)]
pub struct Reverb {
    params: ReverbParams,
    sample_rate: f32,
    // Parallel comb filters
    comb_filters_l: Vec<CombFilter>,
    comb_filters_r: Vec<CombFilter>,
    // Series allpass filters
    allpass_filters_l: Vec<AllpassFilter>,
    allpass_filters_r: Vec<AllpassFilter>,
}

impl Reverb {
    pub fn new(params: ReverbParams, sample_rate: f32) -> Self {
        // Comb filter delay times (in samples) - prime numbers for less resonance
        let comb_delays = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116];

        // Allpass filter delay times
        let allpass_delays = [225, 556, 441, 341];

        let scale = sample_rate / 44100.0;

        let mut reverb = Self {
            params: params.clone(),
            sample_rate,
            comb_filters_l: comb_delays
                .iter()
                .map(|&d| CombFilter::new((d as f32 * scale) as usize))
                .collect(),
            comb_filters_r: comb_delays
                .iter()
                .map(|&d| CombFilter::new(((d as f32 + 23.0) * scale) as usize)) // Slight stereo offset
                .collect(),
            allpass_filters_l: allpass_delays
                .iter()
                .map(|&d| AllpassFilter::new((d as f32 * scale) as usize))
                .collect(),
            allpass_filters_r: allpass_delays
                .iter()
                .map(|&d| AllpassFilter::new(((d as f32 + 23.0) * scale) as usize))
                .collect(),
        };

        reverb.update_params();
        reverb
    }

    pub fn set_params(&mut self, params: ReverbParams) {
        self.params = params;
        self.update_params();
    }

    fn update_params(&mut self) {
        let feedback = 0.28 + self.params.room_size * 0.7;

        for comb in &mut self.comb_filters_l {
            comb.set_feedback(feedback);
            comb.set_damping(self.params.damping);
        }
        for comb in &mut self.comb_filters_r {
            comb.set_feedback(feedback);
            comb.set_damping(self.params.damping);
        }
    }

    /// Process stereo audio buffer
    pub fn process(&mut self, buffer: &mut [Vec<f32>]) {
        if buffer.len() < 2 {
            // Mono processing
            if buffer.is_empty() {
                return;
            }
            self.process_mono(&mut buffer[0]);
            return;
        }

        // Stereo processing
        let len = buffer[0].len();
        for i in 0..len {
            let input_l = buffer[0][i];
            let input_r = buffer[1][i];

            // Mix to mono for input
            let input_mono = (input_l + input_r) * 0.5;

            // Process through comb filters (parallel)
            let mut comb_out_l = 0.0;
            let mut comb_out_r = 0.0;

            for comb in &mut self.comb_filters_l {
                comb_out_l += comb.process(input_mono);
            }
            for comb in &mut self.comb_filters_r {
                comb_out_r += comb.process(input_mono);
            }

            // Process through allpass filters (series)
            let mut allpass_out_l = comb_out_l;
            let mut allpass_out_r = comb_out_r;

            for allpass in &mut self.allpass_filters_l {
                allpass_out_l = allpass.process(allpass_out_l);
            }
            for allpass in &mut self.allpass_filters_r {
                allpass_out_r = allpass.process(allpass_out_r);
            }

            // Apply width control
            let wet_l = allpass_out_l * self.params.width;
            let wet_r = allpass_out_r * self.params.width;

            // Mix wet/dry
            buffer[0][i] = input_l * (1.0 - self.params.mix) + wet_l * self.params.mix;
            buffer[1][i] = input_r * (1.0 - self.params.mix) + wet_r * self.params.mix;
        }
    }

    fn process_mono(&mut self, channel: &mut [f32]) {
        for sample in channel.iter_mut() {
            let input = *sample;

            let mut comb_out = 0.0;
            for comb in &mut self.comb_filters_l {
                comb_out += comb.process(input);
            }

            let mut allpass_out = comb_out;
            for allpass in &mut self.allpass_filters_l {
                allpass_out = allpass.process(allpass_out);
            }

            *sample = input * (1.0 - self.params.mix) + allpass_out * self.params.mix;
        }
    }

    pub fn reset(&mut self) {
        for comb in &mut self.comb_filters_l {
            comb.reset();
        }
        for comb in &mut self.comb_filters_r {
            comb.reset();
        }
        for allpass in &mut self.allpass_filters_l {
            allpass.reset();
        }
        for allpass in &mut self.allpass_filters_r {
            allpass.reset();
        }
    }
}
