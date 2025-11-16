/// DSP (Digital Signal Processing) module
/// Contains all audio processing algorithms

pub mod utils;
pub mod eq;
pub mod bitcrush;
pub mod reverb;
pub mod compression;
pub mod stereo;

pub use eq::*;
pub use bitcrush::*;
pub use reverb::*;
pub use compression::*;
pub use stereo::*;
