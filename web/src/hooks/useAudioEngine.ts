/**
 * React hook for managing the WASM audio engine
 */

import { useState, useCallback, useRef } from 'react'
import init, { AudioEngine, PresetLib } from 'audio-engine'
import {
  decodeAudioFile,
  audioBufferToFloat32,
  float32ToAudioBuffer,
} from '../utils/audioUtils'

export interface AudioEngineState {
  isInitialized: boolean
  isProcessing: boolean
  error: string | null
  currentPreset: string | null
  currentPresetData: any | null
  originalBuffer: AudioBuffer | null
  processedBuffer: AudioBuffer | null
  availablePresets: any[]
}

export function useAudioEngine() {
  const [state, setState] = useState<AudioEngineState>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    currentPreset: null,
    currentPresetData: null,
    originalBuffer: null,
    processedBuffer: null,
    availablePresets: [],
  })

  const engineRef = useRef<AudioEngine | null>(null)

  /**
   * Initialize the WASM module and audio engine
   */
  const initialize = useCallback(async () => {
    try {
      await init()

      // Load available presets
      const presetsData = PresetLib.getAllPresets()
      const presets = JSON.parse(JSON.stringify(presetsData))

      setState(prev => ({
        ...prev,
        isInitialized: true,
        availablePresets: presets,
        error: null,
      }))

      console.log('Audio engine initialized successfully')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to initialize audio engine: ${error}`,
      }))
      console.error('Initialization error:', error)
    }
  }, [])

  /**
   * Load an audio file
   */
  const loadAudioFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      const audioBuffer = await decodeAudioFile(file)

      // Create new engine instance with the audio's sample rate
      const engine = new AudioEngine(audioBuffer.sampleRate)
      engineRef.current = engine

      // Convert AudioBuffer to interleaved Float32Array
      const interleavedData = audioBufferToFloat32(audioBuffer)

      // Load audio into engine
      engine.loadAudio(interleavedData, audioBuffer.numberOfChannels)

      setState(prev => ({
        ...prev,
        originalBuffer: audioBuffer,
        processedBuffer: null,
        currentPreset: null,
        isProcessing: false,
      }))

      console.log(`Loaded audio: ${file.name}`)
      console.log(`Duration: ${audioBuffer.duration.toFixed(2)}s`)
      console.log(`Sample rate: ${audioBuffer.sampleRate}Hz`)
      console.log(`Channels: ${audioBuffer.numberOfChannels}`)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to load audio: ${error}`,
        isProcessing: false,
      }))
      console.error('Load error:', error)
    }
  }, [])

  /**
   * Apply a style preset
   */
  const applyPreset = useCallback(async (presetId: string) => {
    if (!engineRef.current || !state.originalBuffer) {
      setState(prev => ({
        ...prev,
        error: 'No audio loaded',
      }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      const engine = engineRef.current

      // Apply preset
      engine.applyPreset(presetId)

      // Get preset data for UI
      const presetData = PresetLib.getPresetById(presetId)
      const preset = presetData ? JSON.parse(presetData) : null

      // Get processed audio
      const processedData = engine.getProcessedAudio()

      // Convert back to AudioBuffer
      const processedBuffer = float32ToAudioBuffer(
        processedData,
        state.originalBuffer.numberOfChannels,
        state.originalBuffer.sampleRate
      )

      setState(prev => ({
        ...prev,
        processedBuffer,
        currentPreset: presetId,
        currentPresetData: preset,
        isProcessing: false,
      }))

      console.log(`Applied preset: ${presetId}`)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to apply preset: ${error}`,
        isProcessing: false,
      }))
      console.error('Processing error:', error)
    }
  }, [state.originalBuffer])

  /**
   * Apply a custom preset from JSON
   */
  const applyCustomPreset = useCallback(async (presetJson: string) => {
    if (!engineRef.current || !state.originalBuffer) {
      setState(prev => ({
        ...prev,
        error: 'No audio loaded',
      }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      const engine = engineRef.current
      const presetData = JSON.parse(presetJson)

      // Apply custom preset
      engine.applyCustomPreset(presetJson)

      // Get processed audio
      const processedData = engine.getProcessedAudio()

      // Convert back to AudioBuffer
      const processedBuffer = float32ToAudioBuffer(
        processedData,
        state.originalBuffer.numberOfChannels,
        state.originalBuffer.sampleRate
      )

      setState(prev => ({
        ...prev,
        processedBuffer,
        currentPreset: presetData.id || 'custom',
        currentPresetData: presetData,
        isProcessing: false,
      }))

      console.log(`Applied custom preset`)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to apply custom preset: ${error}`,
        isProcessing: false,
      }))
      console.error('Custom preset error:', error)
    }
  }, [state.originalBuffer])

  /**
   * Reset to original audio
   */
  const reset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset()
    }

    setState(prev => ({
      ...prev,
      processedBuffer: null,
      currentPreset: null,
      currentPresetData: null,
    }))
  }, [])

  /**
   * Extract audio features for analysis
   */
  const extractFeatures = useCallback(async () => {
    if (!engineRef.current) {
      return null
    }

    try {
      const features = engineRef.current.extractFeatures()
      return JSON.parse(JSON.stringify(features))
    } catch (error) {
      console.error('Feature extraction error:', error)
      return null
    }
  }, [])

  return {
    ...state,
    initialize,
    loadAudioFile,
    applyPreset,
    applyCustomPreset,
    reset,
    extractFeatures,
  }
}
