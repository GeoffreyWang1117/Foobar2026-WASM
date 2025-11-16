/**
 * Audio utilities for file decoding, format conversion, and WAV export
 */

/**
 * Decode an audio file to AudioBuffer using Web Audio API
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new AudioContext()

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    return audioBuffer
  } catch (error) {
    throw new Error(`Failed to decode audio file: ${error}`)
  }
}

/**
 * Convert AudioBuffer to interleaved Float32Array for WASM processing
 */
export function audioBufferToFloat32(buffer: AudioBuffer): Float32Array {
  const numChannels = buffer.numberOfChannels
  const length = buffer.length
  const interleaved = new Float32Array(length * numChannels)

  // Interleave channels
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = buffer.getChannelData(ch)
      interleaved[i * numChannels + ch] = channelData[i]
    }
  }

  return interleaved
}

/**
 * Convert interleaved Float32Array back to AudioBuffer
 */
export function float32ToAudioBuffer(
  interleavedData: Float32Array,
  numChannels: number,
  sampleRate: number
): AudioBuffer {
  const length = interleavedData.length / numChannels
  const audioContext = new AudioContext()
  const audioBuffer = audioContext.createBuffer(numChannels, length, sampleRate)

  // De-interleave channels
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      channelData[i] = interleavedData[i * numChannels + ch]
    }
  }

  return audioBuffer
}

/**
 * Export AudioBuffer as WAV file
 */
export function exportWAV(audioBuffer: AudioBuffer, filename: string): void {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const length = audioBuffer.length

  // Calculate buffer size
  const bytesPerSample = 2 // 16-bit
  const dataLength = length * numberOfChannels * bytesPerSample
  const bufferLength = 44 + dataLength // WAV header is 44 bytes

  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // Write WAV header
  let offset = 0

  // "RIFF" chunk descriptor
  writeString(view, offset, 'RIFF'); offset += 4
  view.setUint32(offset, bufferLength - 8, true); offset += 4
  writeString(view, offset, 'WAVE'); offset += 4

  // "fmt " sub-chunk
  writeString(view, offset, 'fmt '); offset += 4
  view.setUint32(offset, 16, true); offset += 4 // Sub-chunk size
  view.setUint16(offset, 1, true); offset += 2 // Audio format (1 = PCM)
  view.setUint16(offset, numberOfChannels, true); offset += 2
  view.setUint32(offset, sampleRate, true); offset += 4
  view.setUint32(offset, sampleRate * numberOfChannels * bytesPerSample, true); offset += 4 // Byte rate
  view.setUint16(offset, numberOfChannels * bytesPerSample, true); offset += 2 // Block align
  view.setUint16(offset, 16, true); offset += 2 // Bits per sample

  // "data" sub-chunk
  writeString(view, offset, 'data'); offset += 4
  view.setUint32(offset, dataLength, true); offset += 4

  // Write interleaved audio data
  const volume = 0.8 // Prevent clipping
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numberOfChannels; ch++) {
      const sample = audioBuffer.getChannelData(ch)[i] * volume
      const clampedSample = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, clampedSample * 0x7FFF, true)
      offset += 2
    }
  }

  // Create and download blob
  const blob = new Blob([arrayBuffer], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate waveform data for visualization (downsampled)
 */
export function generateWaveformData(
  audioBuffer: AudioBuffer,
  targetSamples: number = 1000
): number[] {
  const channelData = audioBuffer.getChannelData(0) // Use first channel
  const blockSize = Math.floor(channelData.length / targetSamples)
  const waveformData: number[] = []

  for (let i = 0; i < targetSamples; i++) {
    const start = i * blockSize
    const end = start + blockSize
    let sum = 0

    for (let j = start; j < end && j < channelData.length; j++) {
      sum += Math.abs(channelData[j])
    }

    waveformData.push(sum / blockSize)
  }

  return waveformData
}
