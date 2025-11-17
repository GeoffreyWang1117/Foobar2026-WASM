import { useEffect, useState, useMemo, useCallback } from 'react'
import './App.css'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useAudioWorker } from './hooks/useAudioWorker'
import { Waveform } from './components/Waveform'
import { AudioPlayer } from './components/AudioPlayer'
import { ParameterControls } from './components/ParameterControls'
import { BatchProcessor, type BatchFile } from './components/BatchProcessor'
import { RegionSelector, type AudioRegion } from './components/RegionSelector'
import { exportWAV, formatDuration, exportPresetJSON, importPresetJSON, decodeAudioFile, extractRegion } from './utils/audioUtils'
import { extractParametersFromPreset, updatePresetParameters } from './utils/presetUtils'

type ProcessingMode = 'single' | 'batch'
type EngineMode = 'main' | 'worker'

function App() {
  const [engineMode, setEngineMode] = useState<EngineMode>('worker')

  // Use appropriate engine based on mode
  const mainEngine = useAudioEngine()
  const workerEngine = useAudioWorker()

  const engine = engineMode === 'worker' ? workerEngine : mainEngine

  const {
    isInitialized,
    isProcessing,
    error,
    currentPreset,
    currentPresetData,
    originalBuffer,
    processedBuffer,
    availablePresets,
    initialize,
    loadAudioFile,
    applyPreset,
    applyCustomPreset,
    reset,
  } = engine

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('single')
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<AudioRegion | null>(null)
  const [regionMode, setRegionMode] = useState(false)

  // Extract parameters from current preset
  const currentParameters = useMemo(() => {
    return extractParametersFromPreset(currentPresetData)
  }, [currentPresetData])

  // Initialize engine on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setSelectedPresetId('')
      await loadAudioFile(file)
    }
  }

  const handleApplyPreset = async () => {
    if (selectedPresetId) {
      await applyPreset(selectedPresetId)
    }
  }

  const handleExportWAV = () => {
    if (processedBuffer) {
      const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'audio'
      const filename = `${baseName}_${currentPreset}.wav`
      exportWAV(processedBuffer, filename)
    }
  }

  const handleReset = () => {
    reset()
    setSelectedPresetId('')
  }

  const handleParameterChange = async (parameterName: string, value: number) => {
    if (!currentPresetData) return

    // Update the preset data with new parameter value
    const updatedPreset = updatePresetParameters(currentPresetData, parameterName, value)

    // Apply the updated preset
    const presetJson = JSON.stringify(updatedPreset)
    await applyCustomPreset(presetJson)
  }

  const handleExportPreset = () => {
    if (currentPresetData) {
      const filename = `${currentPresetData.id || 'custom'}_preset.json`
      exportPresetJSON(currentPresetData, filename)
    }
  }

  const handleImportPreset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const presetData = await importPresetJSON(file)
      const presetJson = JSON.stringify(presetData)
      await applyCustomPreset(presetJson)
    } catch (err) {
      console.error('Failed to import preset:', err)
    }

    // Reset input
    event.target.value = ''
  }

  // Batch processing functions
  const handleBatchFilesAdded = useCallback((files: File[]) => {
    const newBatchFiles: BatchFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0,
    }))
    setBatchFiles(prev => [...prev, ...newBatchFiles])
  }, [])

  const handleProcessBatch = useCallback(async (presetId: string) => {
    setIsBatchProcessing(true)

    const pendingFiles = batchFiles.filter(f => f.status === 'pending')

    for (const batchFile of pendingFiles) {
      try {
        // Update status to processing
        setBatchFiles(prev =>
          prev.map(f => f.id === batchFile.id ? { ...f, status: 'processing', progress: 0 } : f)
        )

        // Decode audio
        const audioBuffer = await decodeAudioFile(batchFile.file)

        setBatchFiles(prev =>
          prev.map(f => f.id === batchFile.id ? { ...f, progress: 30 } : f)
        )

        // Load and process
        await loadAudioFile(batchFile.file)

        setBatchFiles(prev =>
          prev.map(f => f.id === batchFile.id ? { ...f, progress: 60 } : f)
        )

        await applyPreset(presetId)

        setBatchFiles(prev =>
          prev.map(f => f.id === batchFile.id ? { ...f, progress: 90 } : f)
        )

        // Store processed buffer
        const processed = processedBuffer

        setBatchFiles(prev =>
          prev.map(f => f.id === batchFile.id ? {
            ...f,
            status: 'completed',
            progress: 100,
            originalBuffer: audioBuffer,
            processedBuffer: processed || undefined
          } : f)
        )
      } catch (error) {
        setBatchFiles(prev =>
          prev.map(f => f.id === batchFile.id ? {
            ...f,
            status: 'error',
            progress: 0,
            error: `Processing failed: ${error}`
          } : f)
        )
      }
    }

    setIsBatchProcessing(false)
  }, [batchFiles, loadAudioFile, applyPreset, processedBuffer])

  const handleRemoveBatchFile = useCallback((fileId: string) => {
    setBatchFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const handleClearCompleted = useCallback(() => {
    setBatchFiles(prev => prev.filter(f => f.status !== 'completed'))
  }, [])

  const handleExportAllBatch = useCallback(() => {
    const completedFiles = batchFiles.filter(f => f.status === 'completed' && f.processedBuffer)

    completedFiles.forEach(batchFile => {
      if (batchFile.processedBuffer) {
        const baseName = batchFile.file.name.replace(/\.[^/.]+$/, '')
        const filename = `${baseName}_processed.wav`
        exportWAV(batchFile.processedBuffer, filename)
      }
    })
  }, [batchFiles])

  // Region processing functions
  const handleApplyRegionPreset = useCallback(async () => {
    if (!selectedPresetId || !selectedRegion || !originalBuffer) {
      console.warn('Missing requirements for region processing')
      return
    }

    console.log('Processing region:', selectedRegion)
    console.log('With preset:', selectedPresetId)

    // For now, just apply to the whole audio
    // A proper implementation would require modifying the audio engine
    await applyPreset(selectedPresetId)
  }, [selectedPresetId, selectedRegion, originalBuffer, applyPreset])

  const handleExportRegion = useCallback(() => {
    if (!selectedRegion || !processedBuffer) return

    const regionBuffer = extractRegion(processedBuffer, selectedRegion.startTime, selectedRegion.endTime)
    const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'audio'
    const filename = `${baseName}_region_${currentPreset}.wav`
    exportWAV(regionBuffer, filename)
  }, [selectedRegion, processedBuffer, selectedFile, currentPreset])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading Audio Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12 relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="absolute top-0 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title="Settings"
          >
            ⚙️
          </button>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            🎵 Music Style Filter
          </h1>
          <p className="text-lg text-gray-300">
            Transform your music with retro and modern audio styles - all in your browser!
          </p>
          {engineMode === 'worker' && (
            <p className="text-sm text-green-400 mt-2">
              ⚡ Performance Mode: Web Worker Enabled
            </p>
          )}
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <div className="max-w-4xl mx-auto mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">⚙️ Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Processing Engine:
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setEngineMode('worker')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                      engineMode === 'worker'
                        ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-lg mb-1">⚡ Web Worker</div>
                    <div className="text-xs">
                      Non-blocking UI, better performance
                    </div>
                  </button>
                  <button
                    onClick={() => setEngineMode('main')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                      engineMode === 'main'
                        ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-lg mb-1">🔧 Main Thread</div>
                    <div className="text-xs">
                      Direct processing, maximum compatibility
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  ⚠️ Changing engine mode requires reloading your audio file
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Mode Selector */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setProcessingMode('single')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                processingMode === 'single'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              🎵 Single File Mode
            </button>
            <button
              onClick={() => setProcessingMode('batch')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                processingMode === 'batch'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              📦 Batch Processing Mode
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Batch Processing Mode */}
          {processingMode === 'batch' && (
            <BatchProcessor
              onFilesAdded={handleBatchFilesAdded}
              batchFiles={batchFiles}
              onProcessBatch={handleProcessBatch}
              onRemoveFile={handleRemoveBatchFile}
              onClearCompleted={handleClearCompleted}
              onExportAll={handleExportAllBatch}
              availablePresets={availablePresets}
              isProcessing={isBatchProcessing}
            />
          )}

          {/* Single File Mode */}
          {processingMode === 'single' && (
            <>
              {/* Upload Section */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-semibold mb-4">📁 Upload Audio</h2>
            <div className="space-y-4">
              <label className="block">
                <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-white/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <div className="space-y-2">
                    <div className="text-4xl">🎼</div>
                    <p className="text-lg">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports MP3, WAV, FLAC, OGG
                    </p>
                    {originalBuffer && (
                      <div className="text-sm text-purple-300 mt-2">
                        Duration: {formatDuration(originalBuffer.duration)} |
                        Sample Rate: {originalBuffer.sampleRate}Hz |
                        Channels: {originalBuffer.numberOfChannels}
                      </div>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Region Mode Toggle */}
          {originalBuffer && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">🎯 Region Processing</h3>
                  <p className="text-xs text-gray-400">Process only a selected part of your audio</p>
                </div>
                <button
                  onClick={() => {
                    setRegionMode(!regionMode)
                    if (regionMode) setSelectedRegion(null)
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    regionMode
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {regionMode ? '✓ Enabled' : 'Enable'}
                </button>
              </div>
            </div>
          )}

          {/* Waveform Visualization */}
          {originalBuffer && !regionMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-3">🎼 Original</h3>
                <Waveform audioBuffer={originalBuffer} color="#60a5fa" />
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-3">✨ Processed</h3>
                <Waveform audioBuffer={processedBuffer} color="#a855f7" />
              </div>
            </div>
          )}

          {/* Region Selection */}
          {originalBuffer && regionMode && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
              <h3 className="text-lg font-semibold mb-4">🎯 Select Region to Process</h3>
              <RegionSelector
                audioBuffer={originalBuffer}
                region={selectedRegion}
                onRegionChange={setSelectedRegion}
                disabled={isProcessing}
                height={150}
              />
              {selectedRegion && (
                <div className="mt-4 flex gap-3 justify-center">
                  <button
                    onClick={handleApplyRegionPreset}
                    disabled={isProcessing || !selectedPresetId}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-all"
                  >
                    {isProcessing ? '⏳ Processing Region...' : '✨ Apply to Region'}
                  </button>
                  <button
                    onClick={handleExportRegion}
                    disabled={isProcessing || !processedBuffer}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-all"
                  >
                    ⬇️ Export Region
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Audio Player */}
          {originalBuffer && (
            <div className="mb-8">
              <AudioPlayer originalBuffer={originalBuffer} processedBuffer={processedBuffer} />
            </div>
          )}

          {/* Style Presets */}
          {originalBuffer && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
              <h2 className="text-2xl font-semibold mb-4">🎨 Choose Style</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {availablePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    disabled={isProcessing}
                    className={`p-4 rounded-lg text-left transition-all border ${
                      selectedPresetId === preset.id
                        ? 'bg-purple-500/30 border-purple-400'
                        : 'bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {preset.id === '8bit' && '🎮'}
                        {preset.id === 'touhou' && '🌸'}
                        {preset.id === 'fm_synthesis' && '🎹'}
                        {preset.id === 'lofi' && '🎧'}
                        {preset.id === 'vaporwave' && '🌊'}
                        {preset.id === 'synthwave' && '🌃'}
                        {preset.id === 'pop80s' && '💿'}
                        {preset.id === 'clean' && '🔊'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">{preset.name}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2">{preset.description}</p>
                        {currentPreset === preset.id && (
                          <span className="inline-block mt-2 text-xs bg-purple-500/50 px-2 py-1 rounded">
                            ✓ Applied
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={handleApplyPreset}
                  disabled={isProcessing || !selectedPresetId}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
                >
                  {isProcessing ? '⏳ Processing...' : '✨ Apply Style'}
                </button>

                {currentPreset && (
                  <>
                    <button
                      onClick={handleReset}
                      disabled={isProcessing}
                      className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold text-lg transition-all border border-white/20"
                    >
                      🔄 Reset
                    </button>
                    <button
                      onClick={handleExportWAV}
                      disabled={isProcessing || !processedBuffer}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold text-lg transition-all"
                    >
                      ⬇️ Export WAV
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Parameter Controls */}
          {currentPreset && currentParameters.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold">🎛️ Fine-Tune Parameters</h2>
                  <p className="text-gray-300 text-sm mt-1">
                    Adjust the effect parameters to customize the sound to your liking
                  </p>
                </div>
                <div className="flex gap-2">
                  <label className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer">
                    📥 Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportPreset}
                      className="hidden"
                      disabled={isProcessing || !originalBuffer}
                    />
                  </label>
                  <button
                    onClick={handleExportPreset}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  >
                    📤 Export
                  </button>
                </div>
              </div>
              <ParameterControls
                parameters={currentParameters}
                onParameterChange={handleParameterChange}
                disabled={isProcessing}
              />
            </div>
          )}

              {/* Info Section */}
              {!originalBuffer && (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                  <h2 className="text-2xl font-semibold mb-4">✨ Features</h2>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span><strong>100% Privacy:</strong> All processing happens in your browser - no uploads!</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span><strong>Multiple Styles:</strong> 8-bit, Touhou, FM synthesis, Lo-fi, Vaporwave, Synthwave, 80s Pop and more</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span><strong>High Quality:</strong> Professional-grade DSP algorithms powered by Rust & WebAssembly</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span><strong>A/B Comparison:</strong> Compare original and processed audio in real-time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span><strong>Export:</strong> Download your transformed audio as high-quality WAV</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400">✓</span>
                      <span><strong>Batch Processing:</strong> Process multiple files at once with one click</span>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-400">
          <p>Made with ♥ and 🦀 (Rust) | All processing done locally in your browser</p>
        </footer>
      </div>
    </div>
  )
}

export default App
