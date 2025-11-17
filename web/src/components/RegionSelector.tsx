/**
 * Interactive waveform with region selection
 */

import { useEffect, useRef, useState } from 'react'
import { generateWaveformData } from '../utils/audioUtils'

export interface AudioRegion {
  startTime: number
  endTime: number
}

interface RegionSelectorProps {
  audioBuffer: AudioBuffer | null
  region: AudioRegion | null
  onRegionChange: (region: AudioRegion | null) => void
  color?: string
  height?: number
  disabled?: boolean
}

export function RegionSelector({
  audioBuffer,
  region,
  onRegionChange,
  color = '#a855f7',
  height = 120,
  disabled = false,
}: RegionSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'start' | 'end' | 'move' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)

  // Draw waveform with region overlay
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !audioBuffer) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    // Set canvas size
    canvas.width = rect.width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${height}px`

    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height)

    // Generate waveform data
    const waveformData = generateWaveformData(audioBuffer, Math.floor(rect.width))

    // Draw waveform
    const centerY = height / 2
    const maxAmplitude = Math.max(...waveformData, 0.01)

    ctx.fillStyle = color
    for (let i = 0; i < waveformData.length; i++) {
      const x = (i / waveformData.length) * rect.width
      const amplitude = (waveformData[i] / maxAmplitude) * (centerY - 4)
      ctx.fillRect(x, centerY - amplitude, 1, amplitude * 2)
    }

    // Draw region overlay
    if (region) {
      const duration = audioBuffer.duration
      const startX = (region.startTime / duration) * rect.width
      const endX = (region.endTime / duration) * rect.width

      // Highlight selected region
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)'
      ctx.fillRect(startX, 0, endX - startX, height)

      // Draw region boundaries
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 2

      // Start line
      ctx.beginPath()
      ctx.moveTo(startX, 0)
      ctx.lineTo(startX, height)
      ctx.stroke()

      // End line
      ctx.beginPath()
      ctx.moveTo(endX, 0)
      ctx.lineTo(endX, height)
      ctx.stroke()

      // Draw handles
      const handleSize = 8
      ctx.fillStyle = '#a855f7'

      // Start handle
      ctx.fillRect(startX - handleSize / 2, height / 2 - handleSize / 2, handleSize, handleSize)

      // End handle
      ctx.fillRect(endX - handleSize / 2, height / 2 - handleSize / 2, handleSize, handleSize)
    }
  }, [audioBuffer, region, color, height])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  const getTimeFromX = (x: number): number => {
    const container = containerRef.current
    if (!container || !audioBuffer) return 0

    const rect = container.getBoundingClientRect()
    const relativeX = Math.max(0, Math.min(x - rect.left, rect.width))
    return (relativeX / rect.width) * audioBuffer.duration
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || !audioBuffer) return

    const x = e.clientX
    const time = getTimeFromX(x)

    if (!region) {
      // Start new region
      onRegionChange({ startTime: time, endTime: time })
      setIsDragging(true)
      setDragType('end')
      setDragStartX(x)
    } else {
      // Check if clicking near handles or inside region
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const startX = (region.startTime / audioBuffer.duration) * rect.width + rect.left
      const endX = (region.endTime / audioBuffer.duration) * rect.width + rect.left

      const tolerance = 10

      if (Math.abs(x - startX) < tolerance) {
        // Dragging start handle
        setIsDragging(true)
        setDragType('start')
        setDragStartX(x)
      } else if (Math.abs(x - endX) < tolerance) {
        // Dragging end handle
        setIsDragging(true)
        setDragType('end')
        setDragStartX(x)
      } else if (x > startX && x < endX) {
        // Dragging entire region
        setIsDragging(true)
        setDragType('move')
        setDragStartX(x)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !region || !audioBuffer || disabled) return

    const x = e.clientX
    const time = getTimeFromX(x)
    const duration = audioBuffer.duration

    if (dragType === 'start') {
      // Move start handle
      const newStartTime = Math.max(0, Math.min(time, region.endTime - 0.1))
      onRegionChange({ ...region, startTime: newStartTime })
    } else if (dragType === 'end') {
      // Move end handle
      const newEndTime = Math.max(region.startTime + 0.1, Math.min(time, duration))
      onRegionChange({ ...region, endTime: newEndTime })
    } else if (dragType === 'move') {
      // Move entire region
      const deltaTime = getTimeFromX(x) - getTimeFromX(dragStartX)
      const regionDuration = region.endTime - region.startTime

      let newStartTime = region.startTime + deltaTime
      let newEndTime = region.endTime + deltaTime

      // Clamp to audio bounds
      if (newStartTime < 0) {
        newStartTime = 0
        newEndTime = regionDuration
      } else if (newEndTime > duration) {
        newEndTime = duration
        newStartTime = duration - regionDuration
      }

      onRegionChange({ startTime: newStartTime, endTime: newEndTime })
      setDragStartX(x)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragType(null)
  }

  const handleClearRegion = () => {
    onRegionChange(null)
  }

  if (!audioBuffer) {
    return (
      <div
        ref={containerRef}
        className="relative bg-white/5 rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          No audio loaded
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`relative bg-white/5 rounded-lg overflow-hidden ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'
        }`}
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {region && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <div>
              <span className="text-gray-400">Start:</span>{' '}
              <span className="text-purple-400 font-mono">{formatTime(region.startTime)}</span>
            </div>
            <div>
              <span className="text-gray-400">End:</span>{' '}
              <span className="text-purple-400 font-mono">{formatTime(region.endTime)}</span>
            </div>
            <div>
              <span className="text-gray-400">Duration:</span>{' '}
              <span className="text-purple-400 font-mono">
                {formatTime(region.endTime - region.startTime)}
              </span>
            </div>
          </div>
          <button
            onClick={handleClearRegion}
            disabled={disabled}
            className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            ✕ Clear Region
          </button>
        </div>
      )}

      {!region && (
        <div className="text-xs text-gray-400 text-center">
          Click and drag on the waveform to select a region
        </div>
      )}
    </div>
  )
}
