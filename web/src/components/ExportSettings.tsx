/**
 * Export settings component for format and quality selection
 */

import type { ExportFormat, MP3Bitrate } from '../utils/audioUtils'

export interface ExportSettingsProps {
  format: ExportFormat
  bitrate: MP3Bitrate
  onFormatChange: (format: ExportFormat) => void
  onBitrateChange: (bitrate: MP3Bitrate) => void
  disabled?: boolean
}

export function ExportSettings({
  format,
  bitrate,
  onFormatChange,
  onBitrateChange,
  disabled = false,
}: ExportSettingsProps) {
  const bitrateOptions: MP3Bitrate[] = [128, 192, 256, 320]

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold mb-4">⚙️ Export Settings</h3>

      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onFormatChange('wav')}
              disabled={disabled}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                format === 'wav'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-base mb-1">🎵 WAV</div>
              <div className="text-xs opacity-80">Lossless</div>
            </button>
            <button
              onClick={() => onFormatChange('mp3')}
              disabled={disabled}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                format === 'mp3'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-base mb-1">🎧 MP3</div>
              <div className="text-xs opacity-80">Compressed</div>
            </button>
          </div>
        </div>

        {/* Bitrate Selection (MP3 only) */}
        {format === 'mp3' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              MP3 Bitrate (Quality)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {bitrateOptions.map((br) => (
                <button
                  key={br}
                  onClick={() => onBitrateChange(br)}
                  disabled={disabled}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    bitrate === br
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {br}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {bitrate === 128 && '💾 Good quality, smaller file size'}
              {bitrate === 192 && '✨ High quality, balanced (recommended)'}
              {bitrate === 256 && '🌟 Very high quality, larger file'}
              {bitrate === 320 && '💎 Maximum quality, largest file'}
            </div>
          </div>
        )}

        {/* Format Info */}
        <div className="bg-white/5 rounded-lg p-3 text-xs text-gray-400">
          {format === 'wav' && (
            <div>
              <strong className="text-gray-300">WAV Format:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Lossless audio quality (no compression)</li>
                <li>16-bit PCM encoding</li>
                <li>Larger file size (~10MB per minute)</li>
                <li>Best for professional use</li>
              </ul>
            </div>
          )}
          {format === 'mp3' && (
            <div>
              <strong className="text-gray-300">MP3 Format:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Compressed audio (lossy)</li>
                <li>Much smaller file size</li>
                <li>Compatible with all devices</li>
                <li>
                  {bitrate}kbps bitrate (~
                  {Math.round((bitrate / 8) * 60 / 1000)}MB per minute)
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
