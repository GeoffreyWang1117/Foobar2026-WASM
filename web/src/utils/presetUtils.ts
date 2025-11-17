/**
 * Utilities for working with audio presets
 */

import type { EffectParameter } from '../components/ParameterControls'

/**
 * Extract parameters from a preset's effects for UI display
 */
export function extractParametersFromPreset(presetData: any): EffectParameter[] {
  if (!presetData || !presetData.effects) {
    return []
  }

  const parameters: EffectParameter[] = []

  presetData.effects.forEach((effect: any, effectIndex: number) => {
    // EQ parameters
    if (effect.EQ) {
      const params = effect.EQ.params
      parameters.push(
        {
          name: `eq_low_gain_${effectIndex}`,
          value: params.low_gain || 0,
          min: -12,
          max: 12,
          step: 0.5,
          unit: 'dB',
          description: 'Low frequency gain',
        },
        {
          name: `eq_mid_gain_${effectIndex}`,
          value: params.mid_gain || 0,
          min: -12,
          max: 12,
          step: 0.5,
          unit: 'dB',
          description: 'Mid frequency gain',
        },
        {
          name: `eq_high_gain_${effectIndex}`,
          value: params.high_gain || 0,
          min: -12,
          max: 12,
          step: 0.5,
          unit: 'dB',
          description: 'High frequency gain',
        }
      )
    }

    // Bitcrush parameters
    if (effect.Bitcrush) {
      const params = effect.Bitcrush.params
      parameters.push(
        {
          name: `bitcrush_depth_${effectIndex}`,
          value: params.bit_depth || 16,
          min: 1,
          max: 16,
          step: 1,
          unit: ' bit',
          description: 'Bit depth reduction',
        },
        {
          name: `bitcrush_rate_${effectIndex}`,
          value: params.rate_reduction || 1,
          min: 1,
          max: 32,
          step: 1,
          unit: 'x',
          description: 'Sample rate reduction',
        },
        {
          name: `bitcrush_mix_${effectIndex}`,
          value: params.mix || 1.0,
          min: 0,
          max: 1,
          step: 0.05,
          unit: '',
          description: 'Dry/wet mix',
        }
      )
    }

    // Reverb parameters
    if (effect.Reverb) {
      const params = effect.Reverb.params
      parameters.push(
        {
          name: `reverb_room_size_${effectIndex}`,
          value: params.room_size || 0.5,
          min: 0,
          max: 1,
          step: 0.05,
          unit: '',
          description: 'Room size',
        },
        {
          name: `reverb_damping_${effectIndex}`,
          value: params.damping || 0.5,
          min: 0,
          max: 1,
          step: 0.05,
          unit: '',
          description: 'High frequency damping',
        },
        {
          name: `reverb_mix_${effectIndex}`,
          value: params.mix || 0.3,
          min: 0,
          max: 1,
          step: 0.05,
          unit: '',
          description: 'Reverb mix',
        }
      )
    }

    // Compression parameters
    if (effect.Compression) {
      const params = effect.Compression.params
      parameters.push(
        {
          name: `comp_threshold_${effectIndex}`,
          value: params.threshold || -20,
          min: -40,
          max: 0,
          step: 1,
          unit: ' dB',
          description: 'Compression threshold',
        },
        {
          name: `comp_ratio_${effectIndex}`,
          value: params.ratio || 4,
          min: 1,
          max: 20,
          step: 0.5,
          unit: ':1',
          description: 'Compression ratio',
        },
        {
          name: `comp_attack_${effectIndex}`,
          value: params.attack_ms || 10,
          min: 0.1,
          max: 100,
          step: 0.5,
          unit: ' ms',
          description: 'Attack time',
        },
        {
          name: `comp_release_${effectIndex}`,
          value: params.release_ms || 100,
          min: 10,
          max: 1000,
          step: 10,
          unit: ' ms',
          description: 'Release time',
        },
        {
          name: `comp_makeup_${effectIndex}`,
          value: params.makeup_gain || 0,
          min: 0,
          max: 24,
          step: 0.5,
          unit: ' dB',
          description: 'Makeup gain',
        }
      )
    }

    // Stereo parameters
    if (effect.Stereo) {
      const params = effect.Stereo.params
      parameters.push(
        {
          name: `stereo_width_${effectIndex}`,
          value: params.width || 1.0,
          min: 0,
          max: 2,
          step: 0.1,
          unit: '',
          description: 'Stereo width',
        },
        {
          name: `stereo_pan_${effectIndex}`,
          value: params.pan || 0,
          min: -1,
          max: 1,
          step: 0.1,
          unit: '',
          description: 'Pan position',
        }
      )
    }

    // Limiter parameters
    if (effect.Limiter) {
      const params = effect.Limiter.params
      parameters.push(
        {
          name: `limiter_threshold_${effectIndex}`,
          value: params.threshold || -0.1,
          min: -12,
          max: 0,
          step: 0.1,
          unit: ' dB',
          description: 'Limiter threshold',
        },
        {
          name: `limiter_release_${effectIndex}`,
          value: params.release_ms || 50,
          min: 1,
          max: 1000,
          step: 5,
          unit: ' ms',
          description: 'Release time',
        }
      )
    }
  })

  return parameters
}

/**
 * Update preset parameters based on parameter changes from UI
 */
export function updatePresetParameters(
  presetData: any,
  parameterName: string,
  value: number
): any {
  if (!presetData || !presetData.effects) {
    return presetData
  }

  // Clone the preset data
  const updatedPreset = JSON.parse(JSON.stringify(presetData))

  // Parse parameter name: type_param_effectIndex
  const parts = parameterName.split('_')
  const effectIndex = parseInt(parts[parts.length - 1])
  const paramType = parts.slice(0, -1).join('_')

  if (isNaN(effectIndex) || effectIndex >= updatedPreset.effects.length) {
    return presetData
  }

  const effect = updatedPreset.effects[effectIndex]

  // Update the appropriate parameter
  if (paramType.startsWith('eq_')) {
    if (effect.EQ) {
      if (paramType === 'eq_low_gain') effect.EQ.params.low_gain = value
      else if (paramType === 'eq_mid_gain') effect.EQ.params.mid_gain = value
      else if (paramType === 'eq_high_gain') effect.EQ.params.high_gain = value
    }
  } else if (paramType.startsWith('bitcrush_')) {
    if (effect.Bitcrush) {
      if (paramType === 'bitcrush_depth') effect.Bitcrush.params.bit_depth = value
      else if (paramType === 'bitcrush_rate') effect.Bitcrush.params.rate_reduction = value
      else if (paramType === 'bitcrush_mix') effect.Bitcrush.params.mix = value
    }
  } else if (paramType.startsWith('reverb_')) {
    if (effect.Reverb) {
      if (paramType === 'reverb_room_size') effect.Reverb.params.room_size = value
      else if (paramType === 'reverb_damping') effect.Reverb.params.damping = value
      else if (paramType === 'reverb_mix') effect.Reverb.params.mix = value
    }
  } else if (paramType.startsWith('comp_')) {
    if (effect.Compression) {
      if (paramType === 'comp_threshold') effect.Compression.params.threshold = value
      else if (paramType === 'comp_ratio') effect.Compression.params.ratio = value
      else if (paramType === 'comp_attack') effect.Compression.params.attack_ms = value
      else if (paramType === 'comp_release') effect.Compression.params.release_ms = value
      else if (paramType === 'comp_makeup') effect.Compression.params.makeup_gain = value
    }
  } else if (paramType.startsWith('stereo_')) {
    if (effect.Stereo) {
      if (paramType === 'stereo_width') effect.Stereo.params.width = value
      else if (paramType === 'stereo_pan') effect.Stereo.params.pan = value
    }
  } else if (paramType.startsWith('limiter_')) {
    if (effect.Limiter) {
      if (paramType === 'limiter_threshold') effect.Limiter.params.threshold = value
      else if (paramType === 'limiter_release') effect.Limiter.params.release_ms = value
    }
  }

  return updatedPreset
}
