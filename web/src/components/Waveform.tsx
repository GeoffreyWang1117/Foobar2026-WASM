/**
 * Waveform visualization component
 */

import { useEffect, useRef } from 'react'
import { generateWaveformData } from '../utils/audioUtils'

interface WaveformProps {
  audioBuffer: AudioBuffer | null
  color?: string
  height?: number
  className?: string
}

export function Waveform({
  audioBuffer,
  color = '#a855f7',
  height = 80,
  className = '',
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !audioBuffer) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height)

    // Generate waveform data
    const waveformData = generateWaveformData(audioBuffer, Math.floor(rect.width))

    // Normalize data
    const max = Math.max(...waveformData, 0.0001)
    const normalized = waveformData.map(v => v / max)

    // Draw waveform
    ctx.fillStyle = color
    const barWidth = rect.width / normalized.length
    const centerY = height / 2

    normalized.forEach((value, i) => {
      const barHeight = value * (height / 2) * 0.9
      const x = i * barWidth
      const y = centerY - barHeight / 2

      ctx.fillRect(x, y, Math.max(barWidth - 0.5, 0.5), barHeight)
    })
  }, [audioBuffer, color, height])

  if (!audioBuffer) {
    return (
      <div
        className={`flex items-center justify-center bg-white/5 rounded-lg ${className}`}
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500 text-sm">No audio loaded</p>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full rounded-lg bg-white/5 ${className}`}
      style={{ height: `${height}px` }}
    />
  )
}
