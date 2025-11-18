/**
 * PWA utilities for Service Worker registration and installation
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[PWA] Service Worker registered successfully:', registration.scope)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[PWA] New service worker available')
              window.dispatchEvent(new CustomEvent('sw-update-available'))
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error)
      return null
    }
  } else {
    console.log('[PWA] Service Worker not supported')
    return null
  }
}

/**
 * Unregister Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const result = await registration.unregister()
        console.log('[PWA] Service Worker unregistered:', result)
        return result
      }
    } catch (error) {
      console.error('[PWA] Service Worker unregistration failed:', error)
    }
  }
  return false
}

/**
 * Setup install prompt listener
 */
export function setupInstallPrompt(
  onPromptAvailable: (prompt: BeforeInstallPromptEvent) => void
): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    console.log('[PWA] Install prompt available')
    onPromptAvailable(deferredPrompt)
  })

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully')
    deferredPrompt = null
  })
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available')
    return 'unavailable'
  }

  try {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('[PWA] User choice:', outcome)
    deferredPrompt = null
    return outcome
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error)
    return 'unavailable'
  }
}

/**
 * Check if app is installed
 */
export function isAppInstalled(): boolean {
  // Check if running as standalone app
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Check iOS standalone mode
  if ((window.navigator as NavigatorStandalone).standalone === true) {
    return true
  }

  return false
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))
    console.log('[PWA] All caches cleared')
  }

  // Also send message to service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
  }
}

/**
 * Get cache size estimate
 */
export async function getCacheSize(): Promise<{ usage: number; quota: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    } catch (error) {
      console.error('[PWA] Failed to get cache size:', error)
    }
  }
  return null
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
