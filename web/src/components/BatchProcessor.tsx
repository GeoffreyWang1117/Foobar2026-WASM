/**
 * Batch file processing component
 */

import { useState } from 'react'

export interface BatchFile {
  id: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  originalBuffer?: AudioBuffer
  processedBuffer?: AudioBuffer
  error?: string
}

interface BatchProcessorProps {
  onFilesAdded: (files: File[]) => void
  batchFiles: BatchFile[]
  onProcessBatch: (presetId: string) => void
  onRemoveFile: (fileId: string) => void
  onClearCompleted: () => void
  onExportAll: () => void
  availablePresets: any[]
  isProcessing: boolean
}

export function BatchProcessor({
  onFilesAdded,
  batchFiles,
  onProcessBatch,
  onRemoveFile,
  onClearCompleted,
  onExportAll,
  availablePresets,
  isProcessing,
}: BatchProcessorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      onFilesAdded(files)
    }
    event.target.value = ''
  }

  const handleProcessBatch = () => {
    if (selectedPreset) {
      onProcessBatch(selectedPreset)
    }
  }

  const pendingCount = batchFiles.filter(f => f.status === 'pending').length
  const processingCount = batchFiles.filter(f => f.status === 'processing').length
  const completedCount = batchFiles.filter(f => f.status === 'completed').length
  const errorCount = batchFiles.filter(f => f.status === 'error').length

  const getStatusIcon = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'processing': return '⚙️'
      case 'completed': return '✅'
      case 'error': return '❌'
    }
  }

  const getStatusColor = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-400'
      case 'processing': return 'text-blue-400'
      case 'completed': return 'text-green-400'
      case 'error': return 'text-red-400'
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <h2 className="text-2xl font-semibold mb-4">📦 Batch Processing</h2>

      {/* Upload Section */}
      <div className="mb-6">
        <label className="block">
          <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-white/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
            <div className="space-y-2">
              <div className="text-3xl">📁</div>
              <p className="text-lg">
                Click to add files or drag & drop
              </p>
              <p className="text-sm text-gray-400">
                Multiple files supported (MP3, WAV, FLAC, OGG)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Statistics */}
      {batchFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-300">{pendingCount}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{processingCount}</div>
            <div className="text-sm text-gray-400">Processing</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{completedCount}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{errorCount}</div>
            <div className="text-sm text-gray-400">Errors</div>
          </div>
        </div>
      )}

      {/* Preset Selection */}
      {batchFiles.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Select Preset for Batch:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availablePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                disabled={isProcessing}
                className={`p-3 rounded-lg text-sm transition-all border ${
                  selectedPreset === preset.id
                    ? 'bg-purple-500/30 border-purple-400'
                    : 'bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-lg mb-1">
                  {preset.id === '8bit' && '🎮'}
                  {preset.id === 'touhou' && '🌸'}
                  {preset.id === 'fm_synthesis' && '🎹'}
                  {preset.id === 'lofi' && '🎧'}
                  {preset.id === 'vaporwave' && '🌊'}
                  {preset.id === 'synthwave' && '🌃'}
                  {preset.id === 'pop80s' && '💿'}
                  {preset.id === 'clean' && '🔊'}
                </div>
                <div className="font-semibold text-xs">{preset.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {batchFiles.length > 0 && (
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={handleProcessBatch}
            disabled={isProcessing || !selectedPreset || pendingCount === 0}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all"
          >
            ✨ Process Batch ({pendingCount} files)
          </button>
          <button
            onClick={onExportAll}
            disabled={isProcessing || completedCount === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all"
          >
            ⬇️ Export All ({completedCount})
          </button>
          <button
            onClick={onClearCompleted}
            disabled={isProcessing || completedCount === 0}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all border border-white/20"
          >
            🗑️ Clear Completed
          </button>
        </div>
      )}

      {/* File List */}
      {batchFiles.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {batchFiles.map((batchFile) => (
            <div
              key={batchFile.id}
              className="bg-white/5 rounded-lg p-4 flex items-center gap-4"
            >
              <div className={`text-2xl ${getStatusColor(batchFile.status)}`}>
                {getStatusIcon(batchFile.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{batchFile.file.name}</div>
                <div className="text-sm text-gray-400">
                  {(batchFile.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                {batchFile.status === 'processing' && (
                  <div className="mt-2">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${batchFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {batchFile.error && (
                  <div className="text-sm text-red-400 mt-1">{batchFile.error}</div>
                )}
              </div>
              <button
                onClick={() => onRemoveFile(batchFile.id)}
                disabled={isProcessing}
                className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {batchFiles.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p>No files added yet. Upload multiple files to start batch processing.</p>
        </div>
      )}
    </div>
  )
}
