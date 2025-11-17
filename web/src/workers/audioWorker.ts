/**
 * Web Worker for non-blocking audio processing
 * Handles WASM audio engine operations in a separate thread
 */

import init, { AudioEngine, PresetLib } from 'audio-engine'

let wasmInitialized = false
let audioEngine: AudioEngine | null = null

// Message types
type WorkerMessage =
  | { type: 'init' }
  | { type: 'loadAudio'; data: { audioData: Float32Array; numChannels: number; sampleRate: number } }
  | { type: 'applyPreset'; data: { presetId: string } }
  | { type: 'applyCustomPreset'; data: { presetJson: string } }
  | { type: 'getProcessedAudio' }
  | { type: 'getAvailablePresets' }
  | { type: 'getPresetById'; data: { presetId: string } }
  | { type: 'reset' }

type WorkerResponse =
  | { type: 'initialized'; success: boolean; error?: string }
  | { type: 'audioLoaded'; success: boolean; error?: string }
  | { type: 'presetApplied'; success: boolean; error?: string }
  | { type: 'processedAudio'; data: Float32Array | null; error?: string }
  | { type: 'availablePresets'; data: any[] }
  | { type: 'presetData'; data: any | null }
  | { type: 'reset'; success: boolean }
  | { type: 'error'; error: string }

/**
 * Initialize WASM module
 */
async function initializeWasm(): Promise<void> {
  if (wasmInitialized) return

  try {
    await init()
    wasmInitialized = true
    console.log('[Worker] WASM initialized successfully')
  } catch (error) {
    console.error('[Worker] WASM initialization failed:', error)
    throw error
  }
}

/**
 * Load audio data into engine
 */
function loadAudio(audioData: Float32Array, numChannels: number, sampleRate: number): void {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized')
  }

  // Create new engine instance
  audioEngine = new AudioEngine(sampleRate)
  audioEngine.loadAudio(audioData, numChannels)
  console.log('[Worker] Audio loaded successfully')
}

/**
 * Apply a preset
 */
function applyPreset(presetId: string): void {
  if (!audioEngine) {
    throw new Error('No audio loaded')
  }

  audioEngine.applyPreset(presetId)
  console.log('[Worker] Preset applied:', presetId)
}

/**
 * Apply a custom preset from JSON
 */
function applyCustomPreset(presetJson: string): void {
  if (!audioEngine) {
    throw new Error('No audio loaded')
  }

  audioEngine.applyCustomPreset(presetJson)
  console.log('[Worker] Custom preset applied')
}

/**
 * Get processed audio
 */
function getProcessedAudio(): Float32Array {
  if (!audioEngine) {
    throw new Error('No audio loaded')
  }

  return audioEngine.getProcessedAudio()
}

/**
 * Get available presets
 */
function getAvailablePresets(): any[] {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized')
  }

  const presetsData = PresetLib.getAllPresets()
  return JSON.parse(JSON.stringify(presetsData))
}

/**
 * Get preset by ID
 */
function getPresetById(presetId: string): any | null {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized')
  }

  const presetData = PresetLib.getPresetById(presetId)
  return presetData ? JSON.parse(presetData) : null
}

/**
 * Reset engine
 */
function resetEngine(): void {
  if (audioEngine) {
    audioEngine.reset()
    console.log('[Worker] Engine reset')
  }
}

/**
 * Message handler
 */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data

  try {
    switch (message.type) {
      case 'init': {
        try {
          await initializeWasm()
          const response: WorkerResponse = { type: 'initialized', success: true }
          self.postMessage(response)
        } catch (error) {
          const response: WorkerResponse = {
            type: 'initialized',
            success: false,
            error: String(error),
          }
          self.postMessage(response)
        }
        break
      }

      case 'loadAudio': {
        try {
          const { audioData, numChannels, sampleRate } = message.data
          loadAudio(audioData, numChannels, sampleRate)
          const response: WorkerResponse = { type: 'audioLoaded', success: true }
          self.postMessage(response)
        } catch (error) {
          const response: WorkerResponse = {
            type: 'audioLoaded',
            success: false,
            error: String(error),
          }
          self.postMessage(response)
        }
        break
      }

      case 'applyPreset': {
        try {
          const { presetId } = message.data
          applyPreset(presetId)
          const response: WorkerResponse = { type: 'presetApplied', success: true }
          self.postMessage(response)
        } catch (error) {
          const response: WorkerResponse = {
            type: 'presetApplied',
            success: false,
            error: String(error),
          }
          self.postMessage(response)
        }
        break
      }

      case 'applyCustomPreset': {
        try {
          const { presetJson } = message.data
          applyCustomPreset(presetJson)
          const response: WorkerResponse = { type: 'presetApplied', success: true }
          self.postMessage(response)
        } catch (error) {
          const response: WorkerResponse = {
            type: 'presetApplied',
            success: false,
            error: String(error),
          }
          self.postMessage(response)
        }
        break
      }

      case 'getProcessedAudio': {
        try {
          const processedData = getProcessedAudio()
          const response: WorkerResponse = { type: 'processedAudio', data: processedData }
          self.postMessage(response, { transfer: [processedData.buffer] })
        } catch (error) {
          const response: WorkerResponse = {
            type: 'processedAudio',
            data: null,
            error: String(error),
          }
          self.postMessage(response)
        }
        break
      }

      case 'getAvailablePresets': {
        try {
          const presets = getAvailablePresets()
          const response: WorkerResponse = { type: 'availablePresets', data: presets }
          self.postMessage(response)
        } catch (error) {
          const response: WorkerResponse = { type: 'error', error: String(error) }
          self.postMessage(response)
        }
        break
      }

      case 'getPresetById': {
        try {
          const { presetId } = message.data
          const preset = getPresetById(presetId)
          const response: WorkerResponse = { type: 'presetData', data: preset }
          self.postMessage(response)
        } catch (error) {
          const response: WorkerResponse = { type: 'error', error: String(error) }
          self.postMessage(response)
        }
        break
      }

      case 'reset': {
        try {
          resetEngine()
          const response: WorkerResponse = { type: 'reset', success: true }
          self.postMessage(response)
        } catch (error) {
          const response: WorkerResponse = { type: 'error', error: String(error) }
          self.postMessage(response)
        }
        break
      }

      default: {
        const response: WorkerResponse = {
          type: 'error',
          error: `Unknown message type: ${(message as any).type}`,
        }
        self.postMessage(response)
      }
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      error: `Worker error: ${error}`,
    }
    self.postMessage(response)
  }
})

// Export for TypeScript
export {}
