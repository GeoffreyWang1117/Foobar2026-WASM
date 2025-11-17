/// Style preset definitions and management

use crate::dsp::*;
use serde::{Deserialize, Serialize};

/// Effect configuration enum - defines all available effects
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum EffectConfig {
    #[serde(rename = "eq")]
    EQ { params: EQParams },

    #[serde(rename = "bitcrush")]
    Bitcrush { params: BitcrushParams },

    #[serde(rename = "reverb")]
    Reverb { params: ReverbParams },

    #[serde(rename = "compressor")]
    Compressor { params: CompressorParams },

    #[serde(rename = "limiter")]
    Limiter { params: LimiterParams },

    #[serde(rename = "stereo")]
    Stereo { params: StereoParams },
}

/// Style preset - defines a complete audio transformation style
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StylePreset {
    /// Unique identifier for the preset
    pub id: String,

    /// Display name
    pub name: String,

    /// Description of the style and its characteristics
    pub description: String,

    /// Effects pipeline (applied in order)
    pub effects: Vec<EffectConfig>,

    /// Whether this preset uses AI enhancement
    pub ai_enhanced: bool,

    /// Category (for UI organization)
    pub category: String,

    /// Tags for searching
    pub tags: Vec<String>,

    /// Author/creator
    pub author: Option<String>,

    /// Version
    pub version: String,
}

impl StylePreset {
    /// Create a new custom preset
    pub fn new(id: String, name: String, description: String) -> Self {
        Self {
            id,
            name,
            description,
            effects: Vec::new(),
            ai_enhanced: false,
            category: "Custom".to_string(),
            tags: Vec::new(),
            author: None,
            version: "1.0.0".to_string(),
        }
    }

    /// Add an effect to the pipeline
    pub fn add_effect(mut self, effect: EffectConfig) -> Self {
        self.effects.push(effect);
        self
    }

    /// Serialize to JSON
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }

    /// Deserialize from JSON
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

/// Built-in preset collection
pub struct PresetLibrary;

impl PresetLibrary {
    /// Get all built-in presets
    pub fn get_all() -> Vec<StylePreset> {
        vec![
            Self::preset_8bit(),
            Self::preset_touhou(),
            Self::preset_fm_synthesis(),
            Self::preset_lofi(),
            Self::preset_vaporwave(),
            Self::preset_synthwave(),
            Self::preset_pop80s(),
            Self::preset_clean(),
        ]
    }

    /// Get preset by ID
    pub fn get_by_id(id: &str) -> Option<StylePreset> {
        Self::get_all().into_iter().find(|p| p.id == id)
    }

    /// 8-bit / Chiptune style preset
    pub fn preset_8bit() -> StylePreset {
        StylePreset {
            id: "8bit".to_string(),
            name: "8-bit Chiptune".to_string(),
            description: "Classic 8-bit game console sound - NES/Famicom style with reduced bit depth and sample rate".to_string(),
            effects: vec![
                // First, reduce to mono or narrow stereo
                EffectConfig::Stereo {
                    params: StereoParams {
                        width: 0.3,
                        pan: 0.0,
                    },
                },
                // Bitcrush for 8-bit sound
                EffectConfig::Bitcrush {
                    params: BitcrushParams {
                        bit_depth: 8,
                        rate_reduction: 4,
                        mix: 1.0,
                    },
                },
                // EQ to simulate old hardware frequency response
                EffectConfig::EQ {
                    params: EQParams {
                        low_gain: -3.0,
                        mid_gain: 2.0,
                        high_gain: -6.0,
                        low_freq: 200.0,
                        high_freq: 3000.0,
                    },
                },
                // Light compression to even out dynamics
                EffectConfig::Compressor {
                    params: CompressorParams {
                        threshold: -15.0,
                        ratio: 3.0,
                        attack_ms: 5.0,
                        release_ms: 50.0,
                        makeup_gain: 2.0,
                    },
                },
            ],
            ai_enhanced: false,
            category: "Retro".to_string(),
            tags: vec!["8bit".to_string(), "chiptune".to_string(), "retro".to_string(), "nes".to_string()],
            author: Some("Audio Engine Team".to_string()),
            version: "1.0.0".to_string(),
        }
    }

    /// Touhou Project-like style (early Windows era)
    pub fn preset_touhou() -> StylePreset {
        StylePreset {
            id: "touhou".to_string(),
            name: "Touhou-like".to_string(),
            description: "Inspired by early Touhou Project music - bright electronic sound with enhanced leads and spatial effects".to_string(),
            effects: vec![
                // Boost mid-high frequencies for lead prominence
                EffectConfig::EQ {
                    params: EQParams {
                        low_gain: 1.0,
                        mid_gain: 4.0,
                        high_gain: 3.0,
                        low_freq: 250.0,
                        high_freq: 4000.0,
                    },
                },
                // Widen stereo image
                EffectConfig::Stereo {
                    params: StereoParams {
                        width: 1.4,
                        pan: 0.0,
                    },
                },
                // Medium reverb for spatial depth
                EffectConfig::Reverb {
                    params: ReverbParams {
                        room_size: 0.6,
                        damping: 0.4,
                        mix: 0.35,
                        width: 0.8,
                    },
                },
                // Gentle compression to bring out details
                EffectConfig::Compressor {
                    params: CompressorParams {
                        threshold: -18.0,
                        ratio: 2.5,
                        attack_ms: 8.0,
                        release_ms: 120.0,
                        makeup_gain: 3.0,
                    },
                },
            ],
            ai_enhanced: false,
            category: "Electronic".to_string(),
            tags: vec!["touhou".to_string(), "electronic".to_string(), "bright".to_string()],
            author: Some("Audio Engine Team".to_string()),
            version: "1.0.0".to_string(),
        }
    }

    /// FM Synthesis / Old PC style
    pub fn preset_fm_synthesis() -> StylePreset {
        StylePreset {
            id: "fm_synthesis".to_string(),
            name: "FM/PC-98 Style".to_string(),
            description: "Emulates FM synthesis sound chips - metallic timbre with characteristic frequency response".to_string(),
            effects: vec![
                // Narrow stereo for old PC sound
                EffectConfig::Stereo {
                    params: StereoParams {
                        width: 0.5,
                        pan: 0.0,
                    },
                },
                // Slight bitcrush for digital artifacts
                EffectConfig::Bitcrush {
                    params: BitcrushParams {
                        bit_depth: 12,
                        rate_reduction: 2,
                        mix: 0.6,
                    },
                },
                // EQ to simulate FM chip character
                EffectConfig::EQ {
                    params: EQParams {
                        low_gain: -2.0,
                        mid_gain: 3.0,
                        high_gain: 1.0,
                        low_freq: 180.0,
                        high_freq: 5000.0,
                    },
                },
                // Small room reverb
                EffectConfig::Reverb {
                    params: ReverbParams {
                        room_size: 0.3,
                        damping: 0.6,
                        mix: 0.15,
                        width: 0.5,
                    },
                },
            ],
            ai_enhanced: false,
            category: "Retro".to_string(),
            tags: vec!["fm".to_string(), "pc98".to_string(), "synthesis".to_string()],
            author: Some("Audio Engine Team".to_string()),
            version: "1.0.0".to_string(),
        }
    }

    /// Lo-fi style
    pub fn preset_lofi() -> StylePreset {
        StylePreset {
            id: "lofi".to_string(),
            name: "Lo-fi Hip Hop".to_string(),
            description: "Warm, nostalgic lo-fi sound with gentle compression and reduced highs".to_string(),
            effects: vec![
                // Reduce high frequencies
                EffectConfig::EQ {
                    params: EQParams {
                        low_gain: 2.0,
                        mid_gain: 1.0,
                        high_gain: -4.0,
                        low_freq: 200.0,
                        high_freq: 6000.0,
                    },
                },
                // Light bitcrush for warmth
                EffectConfig::Bitcrush {
                    params: BitcrushParams {
                        bit_depth: 14,
                        rate_reduction: 1,
                        mix: 0.3,
                    },
                },
                // Warm reverb
                EffectConfig::Reverb {
                    params: ReverbParams {
                        room_size: 0.5,
                        damping: 0.7,
                        mix: 0.25,
                        width: 0.6,
                    },
                },
                // Gentle compression
                EffectConfig::Compressor {
                    params: CompressorParams {
                        threshold: -20.0,
                        ratio: 3.0,
                        attack_ms: 15.0,
                        release_ms: 150.0,
                        makeup_gain: 2.0,
                    },
                },
            ],
            ai_enhanced: false,
            category: "Modern".to_string(),
            tags: vec!["lofi".to_string(), "chill".to_string(), "hip-hop".to_string()],
            author: Some("Audio Engine Team".to_string()),
            version: "1.0.0".to_string(),
        }
    }

    /// Vaporwave aesthetic style
    pub fn preset_vaporwave() -> StylePreset {
        StylePreset {
            id: "vaporwave".to_string(),
            name: "Vaporwave Aesthetic".to_string(),
            description: "Slowed, reverb-heavy 80s aesthetic with nostalgic vibes".to_string(),
            effects: vec![
                // Enhance bass and highs for that aesthetic feel
                EffectConfig::EQ {
                    params: EQParams {
                        low_gain: 4.0,
                        mid_gain: -1.0,
                        high_gain: 3.0,
                        low_freq: 150.0,
                        high_freq: 8000.0,
                    },
                },
                // Wide stereo for spacious feel
                EffectConfig::Stereo {
                    params: StereoParams {
                        width: 1.6,
                        pan: 0.0,
                    },
                },
                // Large reverb for dreamy atmosphere
                EffectConfig::Reverb {
                    params: ReverbParams {
                        room_size: 0.9,
                        damping: 0.3,
                        mix: 0.5,
                        width: 1.0,
                    },
                },
                // Light compression
                EffectConfig::Compressor {
                    params: CompressorParams {
                        threshold: -18.0,
                        ratio: 2.0,
                        attack_ms: 20.0,
                        release_ms: 200.0,
                        makeup_gain: 2.0,
                    },
                },
            ],
            ai_enhanced: false,
            category: "Modern".to_string(),
            tags: vec!["vaporwave".to_string(), "aesthetic".to_string(), "80s".to_string()],
            author: Some("Audio Engine Team".to_string()),
            version: "1.0.0".to_string(),
        }
    }

    /// Synthwave/retrowave style
    pub fn preset_synthwave() -> StylePreset {
        StylePreset {
            id: "synthwave".to_string(),
            name: "Synthwave".to_string(),
            description: "Retro 80s synthwave sound - punchy and energetic with enhanced bass".to_string(),
            effects: vec![
                // Boost bass and presence
                EffectConfig::EQ {
                    params: EQParams {
                        low_gain: 5.0,
                        mid_gain: 2.0,
                        high_gain: 4.0,
                        low_freq: 120.0,
                        high_freq: 6000.0,
                    },
                },
                // Moderate stereo width
                EffectConfig::Stereo {
                    params: StereoParams {
                        width: 1.2,
                        pan: 0.0,
                    },
                },
                // Medium reverb for depth
                EffectConfig::Reverb {
                    params: ReverbParams {
                        room_size: 0.5,
                        damping: 0.4,
                        mix: 0.3,
                        width: 0.7,
                    },
                },
                // Punchy compression
                EffectConfig::Compressor {
                    params: CompressorParams {
                        threshold: -15.0,
                        ratio: 4.0,
                        attack_ms: 5.0,
                        release_ms: 80.0,
                        makeup_gain: 4.0,
                    },
                },
            ],
            ai_enhanced: false,
            category: "Modern".to_string(),
            tags: vec!["synthwave".to_string(), "retrowave".to_string(), "80s".to_string()],
            author: Some("Audio Engine Team".to_string()),
            version: "1.0.0".to_string(),
        }
    }

    /// 80s Pop style
    pub fn preset_pop80s() -> StylePreset {
        StylePreset {
            id: "pop80s".to_string(),
            name: "80s Pop".to_string(),
            description: "Classic 80s pop production - bright, punchy, with gated reverb character".to_string(),
            effects: vec![
                // Bright EQ curve
                EffectConfig::EQ {
                    params: EQParams {
                        low_gain: 2.0,
                        mid_gain: 3.0,
                        high_gain: 5.0,
                        low_freq: 180.0,
                        high_freq: 5000.0,
                    },
                },
                // Wide stereo
                EffectConfig::Stereo {
                    params: StereoParams {
                        width: 1.3,
                        pan: 0.0,
                    },
                },
                // Reverb with character
                EffectConfig::Reverb {
                    params: ReverbParams {
                        room_size: 0.6,
                        damping: 0.5,
                        mix: 0.35,
                        width: 0.8,
                    },
                },
                // Heavy compression for that loud pop sound
                EffectConfig::Compressor {
                    params: CompressorParams {
                        threshold: -12.0,
                        ratio: 6.0,
                        attack_ms: 3.0,
                        release_ms: 100.0,
                        makeup_gain: 5.0,
                    },
                },
            ],
            ai_enhanced: false,
            category: "Retro".to_string(),
            tags: vec!["80s".to_string(), "pop".to_string(), "bright".to_string()],
            author: Some("Audio Engine Team".to_string()),
            version: "1.0.0".to_string(),
        }
    }

    /// Clean/transparent preset (minimal processing)
    pub fn preset_clean() -> StylePreset {
        StylePreset {
            id: "clean".to_string(),
            name: "Clean & Transparent".to_string(),
            description: "Minimal processing - just gentle limiting for volume safety".to_string(),
            effects: vec![
                EffectConfig::Limiter {
                    params: LimiterParams {
                        ceiling: -0.3,
                        release_ms: 50.0,
                    },
                },
            ],
            ai_enhanced: false,
            category: "Utility".to_string(),
            tags: vec!["clean".to_string(), "transparent".to_string(), "minimal".to_string()],
            author: Some("Audio Engine Team".to_string()),
            version: "1.0.0".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preset_serialization() {
        let preset = PresetLibrary::preset_8bit();
        let json = preset.to_json().unwrap();
        let deserialized = StylePreset::from_json(&json).unwrap();

        assert_eq!(preset.id, deserialized.id);
        assert_eq!(preset.effects.len(), deserialized.effects.len());
    }

    #[test]
    fn test_preset_library() {
        let presets = PresetLibrary::get_all();
        assert!(presets.len() >= 4);

        let eight_bit = PresetLibrary::get_by_id("8bit");
        assert!(eight_bit.is_some());
    }
}
