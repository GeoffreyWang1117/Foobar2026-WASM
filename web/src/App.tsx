import { useState } from 'react'
import './App.css'

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }

  const handleProcessAudio = async () => {
    if (!audioFile) return

    setIsLoading(true)
    try {
      // TODO: Load WASM module and process audio
      console.log('Processing audio:', audioFile.name)

      // This is where you would:
      // 1. Load the WASM module
      // 2. Decode the audio file
      // 3. Process it through the engine
      // 4. Play/export the result

      alert('Audio processing will be implemented when WASM module is integrated!')
    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setIsLoading(false)
    }
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

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
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
                  />
                  <div className="space-y-2">
                    <div className="text-4xl">🎼</div>
                    <p className="text-lg">
                      {audioFile ? audioFile.name : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports MP3, WAV, FLAC, OGG
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Style Presets */}
          {audioFile && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
              <h2 className="text-2xl font-semibold mb-4">🎨 Choose Style</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: '8bit', name: '8-bit Chiptune', emoji: '🎮', desc: 'Classic NES/Famicom sound' },
                  { id: 'touhou', name: 'Touhou-like', emoji: '🌸', desc: 'Bright electronic sound' },
                  { id: 'fm_synthesis', name: 'FM/PC-98 Style', emoji: '🎹', desc: 'FM synthesis character' },
                  { id: 'lofi', name: 'Lo-fi Hip Hop', emoji: '🎧', desc: 'Warm and nostalgic' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    className="bg-white/5 hover:bg-white/15 rounded-lg p-4 text-left transition-all border border-white/10 hover:border-white/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{preset.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-lg">{preset.name}</h3>
                        <p className="text-sm text-gray-400">{preset.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {audioFile && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleProcessAudio}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
                >
                  {isLoading ? '⏳ Processing...' : '✨ Apply Style'}
                </button>
                <button className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-lg font-semibold text-lg transition-all border border-white/20">
                  ⬇️ Export WAV
                </button>
              </div>
            </div>
          )}

          {/* Info Section */}
          {!audioFile && (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4">✨ Features</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span><strong>100% Privacy:</strong> All processing happens in your browser - no uploads!</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span><strong>Multiple Styles:</strong> 8-bit, Touhou, FM synthesis, Lo-fi and more</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span><strong>High Quality:</strong> Professional-grade DSP algorithms powered by Rust & WebAssembly</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">✓</span>
                  <span><strong>Customizable:</strong> Create and save your own filter presets</span>
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
