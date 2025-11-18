/**
 * PWA Install Prompt Component
 * Shows banner when app can be installed as PWA
 */

import { useState, useEffect } from 'react'
import {
  isAppInstalled,
  isInstallPromptAvailable,
  showInstallPrompt,
  setupInstallPrompt,
} from '../utils/pwa'

export function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isAppInstalled() || dismissed) {
      setShowBanner(false)
      return
    }

    // Setup listener for install prompt
    setupInstallPrompt(() => {
      setShowBanner(true)
    })

    // Check if prompt is already available
    if (isInstallPromptAvailable()) {
      setShowBanner(true)
    }
  }, [dismissed])

  const handleInstall = async () => {
    setIsInstalling(true)

    try {
      const outcome = await showInstallPrompt()

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted installation')
        setShowBanner(false)
      } else if (outcome === 'dismissed') {
        console.log('[PWA] User dismissed installation')
        setDismissed(true)
        setShowBanner(false)
      } else {
        console.log('[PWA] Install prompt not available')
      }
    } catch (error) {
      console.error('[PWA] Install error:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setShowBanner(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl border border-white/20 p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">📱</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              Install Music Style Filter
            </h3>
            <p className="text-sm text-white/90 mb-4">
              Install this app for offline access and a better experience!
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-white text-purple-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                    Installing...
                  </span>
                ) : (
                  '✨ Install'
                )}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isInstalling}
                className="px-4 py-2 text-white/80 hover:text-white font-medium transition-colors disabled:opacity-50"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isInstalling}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
