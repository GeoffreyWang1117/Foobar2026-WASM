import { useEffect, useState, useMemo } from 'react'
import './App.css'
import { useAudioEngine } from './hooks/useAudioEngine'
import { Waveform } from './components/Waveform'
import { AudioPlayer } from './components/AudioPlayer'
import { ParameterControls } from './components/ParameterControls'
import { exportWAV, formatDuration, exportPresetJSON, importPresetJSON } from './utils/audioUtils'
import { extractParametersFromPreset, updatePresetParameters } from './utils/presetUtils'

function App() {
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
  } = useAudioEngine()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('')

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
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            🎵 Music Style Filter
          </h1>
          <p className="text-lg text-gray-300">
            Transform your music with retro and modern audio styles - all in your browser!
          </p>
        </header>

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
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

          {/* Waveform Visualization */}
          {originalBuffer && (
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
              </ul>
            </div>
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
