/**
 * React hook for managing audio processing via Web Worker
 * Provides non-blocking audio processing for better UI performance
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  audioBufferToFloat32,
  float32ToAudioBuffer,
} from '../utils/audioUtils'

export interface AudioWorkerState {
  isInitialized: boolean
  isProcessing: boolean
  error: string | null
  currentPreset: string | null
  currentPresetData: any | null
  originalBuffer: AudioBuffer | null
  processedBuffer: AudioBuffer | null
  availablePresets: any[]
}

export function useAudioWorker() {
  const [state, setState] = useState<AudioWorkerState>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    currentPreset: null,
    currentPresetData: null,
    originalBuffer: null,
    processedBuffer: null,
    availablePresets: [],
  })

  const workerRef = useRef<Worker | null>(null)
  const originalBufferRef = useRef<AudioBuffer | null>(null)

  /**
   * Initialize the Web Worker
   */
  const initialize = useCallback(async () => {
    try {
      // Create worker
      const worker = new Worker(new URL('../workers/audioWorker.ts', import.meta.url), {
        type: 'module',
      })

      workerRef.current = worker

      // Setup message handler
      return new Promise<void>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          const response = event.data

          if (response.type === 'initialized') {
            if (response.success) {
              // Get available presets
              worker.postMessage({ type: 'getAvailablePresets' })
            } else {
              setState(prev => ({
                ...prev,
                error: `Failed to initialize worker: ${response.error}`,
              }))
              reject(new Error(response.error))
            }
          } else if (response.type === 'availablePresets') {
            setState(prev => ({
              ...prev,
              isInitialized: true,
              availablePresets: response.data,
              error: null,
            }))
            console.log('Audio worker initialized successfully')
            resolve()
          } else if (response.type === 'error') {
            setState(prev => ({
              ...prev,
              error: response.error,
            }))
            reject(new Error(response.error))
          }
        }

        worker.addEventListener('message', handleMessage, { once: false })

        // Initialize WASM in worker
        worker.postMessage({ type: 'init' })

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Worker initialization timeout'))
        }, 10000)
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to create worker: ${error}`,
      }))
      console.error('Worker creation error:', error)
    }
  }, [])

  /**
   * Load an audio file
   */
  const loadAudioFile = useCallback(async (file: File) => {
    if (!workerRef.current) {
      setState(prev => ({ ...prev, error: 'Worker not initialized' }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      // Decode audio in main thread (Web Audio API is not available in worker)
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      originalBufferRef.current = audioBuffer

      // Convert to interleaved Float32Array
      const interleavedData = audioBufferToFloat32(audioBuffer)

      // Send to worker
      const worker = workerRef.current
      return new Promise<void>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          const response = event.data

          if (response.type === 'audioLoaded') {
            if (response.success) {
              setState(prev => ({
                ...prev,
                originalBuffer: audioBuffer,
                processedBuffer: null,
                currentPreset: null,
                currentPresetData: null,
                isProcessing: false,
              }))
              console.log(`Loaded audio: ${file.name}`)
              resolve()
            } else {
              setState(prev => ({
                ...prev,
                error: `Failed to load audio: ${response.error}`,
                isProcessing: false,
              }))
              reject(new Error(response.error))
            }
            worker.removeEventListener('message', handleMessage)
          }
        }

        worker.addEventListener('message', handleMessage)

        worker.postMessage({
          type: 'loadAudio',
          data: {
            audioData: interleavedData,
            numChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
          },
        }, { transfer: [interleavedData.buffer] })

        // Timeout after 30 seconds
        setTimeout(() => {
          worker.removeEventListener('message', handleMessage)
          reject(new Error('Load audio timeout'))
        }, 30000)
      })
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
    if (!workerRef.current || !originalBufferRef.current) {
      setState(prev => ({ ...prev, error: 'No audio loaded' }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      const worker = workerRef.current
      const originalBuffer = originalBufferRef.current

      return new Promise<void>((resolve, reject) => {
        let presetApplied = false
        let presetData: any = null

        const handleMessage = (event: MessageEvent) => {
          const response = event.data

          if (response.type === 'presetApplied' && !presetApplied) {
            if (response.success) {
              presetApplied = true
              // Get preset data
              worker.postMessage({ type: 'getPresetById', data: { presetId } })
              // Get processed audio
              worker.postMessage({ type: 'getProcessedAudio' })
            } else {
              setState(prev => ({
                ...prev,
                error: `Failed to apply preset: ${response.error}`,
                isProcessing: false,
              }))
              worker.removeEventListener('message', handleMessage)
              reject(new Error(response.error))
            }
          } else if (response.type === 'presetData') {
            presetData = response.data
          } else if (response.type === 'processedAudio') {
            if (response.data) {
              const processedBuffer = float32ToAudioBuffer(
                response.data,
                originalBuffer.numberOfChannels,
                originalBuffer.sampleRate
              )

              setState(prev => ({
                ...prev,
                processedBuffer,
                currentPreset: presetId,
                currentPresetData: presetData,
                isProcessing: false,
              }))

              console.log(`Applied preset: ${presetId}`)
              worker.removeEventListener('message', handleMessage)
              resolve()
            } else {
              setState(prev => ({
                ...prev,
                error: `Failed to get processed audio: ${response.error}`,
                isProcessing: false,
              }))
              worker.removeEventListener('message', handleMessage)
              reject(new Error(response.error || 'No processed data'))
            }
          }
        }

        worker.addEventListener('message', handleMessage)

        worker.postMessage({
          type: 'applyPreset',
          data: { presetId },
        })

        // Timeout after 60 seconds
        setTimeout(() => {
          worker.removeEventListener('message', handleMessage)
          setState(prev => ({ ...prev, isProcessing: false }))
          reject(new Error('Apply preset timeout'))
        }, 60000)
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to apply preset: ${error}`,
        isProcessing: false,
      }))
      console.error('Processing error:', error)
    }
  }, [])

  /**
   * Apply a custom preset from JSON
   */
  const applyCustomPreset = useCallback(async (presetJson: string) => {
    if (!workerRef.current || !originalBufferRef.current) {
      setState(prev => ({ ...prev, error: 'No audio loaded' }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      const worker = workerRef.current
      const originalBuffer = originalBufferRef.current
      const presetData = JSON.parse(presetJson)

      return new Promise<void>((resolve, reject) => {
        let presetApplied = false

        const handleMessage = (event: MessageEvent) => {
          const response = event.data

          if (response.type === 'presetApplied' && !presetApplied) {
            if (response.success) {
              presetApplied = true
              // Get processed audio
              worker.postMessage({ type: 'getProcessedAudio' })
            } else {
              setState(prev => ({
                ...prev,
                error: `Failed to apply custom preset: ${response.error}`,
                isProcessing: false,
              }))
              worker.removeEventListener('message', handleMessage)
              reject(new Error(response.error))
            }
          } else if (response.type === 'processedAudio') {
            if (response.data) {
              const processedBuffer = float32ToAudioBuffer(
                response.data,
                originalBuffer.numberOfChannels,
                originalBuffer.sampleRate
              )

              setState(prev => ({
                ...prev,
                processedBuffer,
                currentPreset: presetData.id || 'custom',
                currentPresetData: presetData,
                isProcessing: false,
              }))

              console.log('Applied custom preset')
              worker.removeEventListener('message', handleMessage)
              resolve()
            } else {
              setState(prev => ({
                ...prev,
                error: `Failed to get processed audio: ${response.error}`,
                isProcessing: false,
              }))
              worker.removeEventListener('message', handleMessage)
              reject(new Error(response.error || 'No processed data'))
            }
          }
        }

        worker.addEventListener('message', handleMessage)

        worker.postMessage({
          type: 'applyCustomPreset',
          data: { presetJson },
        })

        // Timeout after 60 seconds
        setTimeout(() => {
          worker.removeEventListener('message', handleMessage)
          setState(prev => ({ ...prev, isProcessing: false }))
          reject(new Error('Apply custom preset timeout'))
        }, 60000)
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to apply custom preset: ${error}`,
        isProcessing: false,
      }))
      console.error('Custom preset error:', error)
    }
  }, [])

  /**
   * Reset to original audio
   */
  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'reset' })
    }

    setState(prev => ({
      ...prev,
      processedBuffer: null,
      currentPreset: null,
      currentPresetData: null,
    }))
  }, [])

  /**
   * Extract audio features (placeholder for AI)
   */
  const extractFeatures = useCallback(async () => {
    // This would require implementing feature extraction in the worker
    console.warn('Feature extraction not implemented in worker mode')
    return null
  }, [])

  /**
   * Cleanup worker on unmount
   */
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
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
