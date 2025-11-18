/**
 * Audio player component with A/B comparison
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { formatDuration } from '../utils/audioUtils'

interface AudioPlayerProps {
  originalBuffer: AudioBuffer | null
  processedBuffer: AudioBuffer | null
}

export function AudioPlayer({ originalBuffer, processedBuffer }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackMode, setPlaybackMode] = useState<'original' | 'processed'>('original')

  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseTimeRef = useRef<number>(0)

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Update duration when buffer changes
  useEffect(() => {
    const buffer = playbackMode === 'original' ? originalBuffer : processedBuffer
    if (buffer) {
      setDuration(buffer.duration)
    }
  }, [originalBuffer, processedBuffer, playbackMode])

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop()
      sourceNodeRef.current = null
    }

    pauseTimeRef.current = 0
    setCurrentTime(0)
    setIsPlaying(false)
  }, [])

  // Stop playback when component unmounts or buffer changes
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop, originalBuffer, processedBuffer, playbackMode])

  const play = useCallback(() => {
    const buffer = playbackMode === 'original' ? originalBuffer : processedBuffer
    if (!buffer || !audioContextRef.current) return

    const ctx = audioContextRef.current

    // Resume audio context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Create and configure source node
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    // Start from pause time
    const offset = pauseTimeRef.current
    source.start(0, offset)
    startTimeRef.current = ctx.currentTime - offset

    sourceNodeRef.current = source

    // Update current time
    const updateTime = () => {
      if (sourceNodeRef.current && audioContextRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current
        setCurrentTime(Math.min(elapsed, duration))

        if (elapsed < duration) {
          requestAnimationFrame(updateTime)
        } else {
          setIsPlaying(false)
          pauseTimeRef.current = 0
          setCurrentTime(0)
        }
      }
    }

    // Handle end of playback
    source.onended = () => {
      if (isPlaying) {
        setIsPlaying(false)
        pauseTimeRef.current = 0
        setCurrentTime(0)
      }
    }

    setIsPlaying(true)
    requestAnimationFrame(updateTime)
  }, [playbackMode, originalBuffer, processedBuffer, duration, isPlaying])

  const pause = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop()
      sourceNodeRef.current = null
    }

    if (audioContextRef.current) {
      pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current
    }

    setIsPlaying(false)
  }, [])

  const seek = useCallback((time: number) => {
    const wasPlaying = isPlaying
    stop()
    pauseTimeRef.current = time
    setCurrentTime(time)
    if (wasPlaying) {
      play()
    }
  }, [isPlaying, stop, play])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    seek(percentage * duration)
  }, [duration, seek])

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, pause, play])

  const switchMode = useCallback((mode: 'original' | 'processed') => {
    const wasPlaying = isPlaying
    stop()
    setPlaybackMode(mode)
    if (wasPlaying) {
      setTimeout(play, 100)
    }
  }, [isPlaying, stop, play])

  const hasAudio = originalBuffer !== null
  const hasProcessed = processedBuffer !== null
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-semibold mb-4">🎵 Audio Player</h2>

      {/* A/B Mode Selector */}
      {hasProcessed && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => switchMode('original')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              playbackMode === 'original'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            🎼 Original
          </button>
          <button
            onClick={() => switchMode('processed')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              playbackMode === 'processed'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            ✨ Processed
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div
        className="relative h-2 bg-white/10 rounded-full mb-4 cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="absolute h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/4 group-hover:scale-125 transition-transform"
          style={{ left: `${progressPercentage}%`, marginLeft: '-8px' }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={stop}
          disabled={!hasAudio}
          className="p-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <rect x="6" y="6" width="8" height="8" />
          </svg>
        </button>

        <button
          onClick={togglePlayPause}
          disabled={!hasAudio}
          className="p-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="5" width="2" height="10" />
              <rect x="12" y="5" width="2" height="10" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 3.7a1 1 0 011.5-.8l9 6a1 1 0 010 1.6l-9 6A1 1 0 016.3 15.3V3.7z" />
            </svg>
          )}
        </button>

        <button
          onClick={() => {
            const time = Math.min(currentTime + 10, duration)
            seek(time)
          }}
          disabled={!hasAudio}
          className="p-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832l7-5a1 1 0 000-1.664l-7-5z" />
            <path d="M13.555 5.168A1 1 0 0012 6v8a1 1 0 001.555.832l7-5a1 1 0 000-1.664l-7-5z" />
          </svg>
        </button>
      </div>

      {!hasAudio && (
        <p className="text-center text-gray-500 text-sm mt-4">
          Upload an audio file to start playing
        </p>
      )}
    </div>
  )
}
