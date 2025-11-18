/**
 * PWA Update Notification Component
 * Shows notification when new Service Worker version is available
 */

import { useState, useEffect } from 'react'

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Listen for Service Worker update events
    const handleUpdate = () => {
      console.log('[PWA] New version available')
      setShowUpdate(true)
    }

    window.addEventListener('sw-update-available', handleUpdate)

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)

    try {
      // Get the registration
      const registration = await navigator.serviceWorker.getRegistration()

      if (registration && registration.waiting) {
        // Tell the waiting SW to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Reload the page to use new Service Worker
          window.location.reload()
        })
      }
    } catch (error) {
      console.error('[PWA] Update error:', error)
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-2xl border border-white/20 p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🆕</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              Update Available
            </h3>
            <p className="text-sm text-white/90 mb-4">
              A new version of the app is available. Reload to update.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    Updating...
                  </span>
                ) : (
                  '🔄 Update Now'
                )}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isUpdating}
                className="px-4 py-2 text-white/80 hover:text-white font-medium transition-colors disabled:opacity-50"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isUpdating}
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
