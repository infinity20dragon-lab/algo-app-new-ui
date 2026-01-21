/**
 * Utility functions for getting app settings from localStorage
 */

/**
 * Get the configured idle volume level for speakers
 * @returns The idle volume in dB (default: -45)
 */
export function getIdleVolume(): number {
  if (typeof window === "undefined") {
    return -45; // Server-side default
  }

  const saved = localStorage.getItem("algoapp-idle-volume");
  if (saved) {
    const parsed = parseInt(saved);
    // Validate range
    if (parsed >= -60 && parsed <= 0) {
      return parsed;
    }
  }

  return -45; // Default
}

/**
 * Get the idle volume as a string with "dB" suffix (for Algo API)
 * @returns The idle volume as a string like "-45dB"
 */
export function getIdleVolumeString(): string {
  return `${getIdleVolume()}dB`;
}

/**
 * Get the default volume for new distributions
 * @returns The default volume (0-100)
 */
export function getDefaultVolume(): number {
  if (typeof window === "undefined") {
    return 50; // Server-side default
  }

  const saved = localStorage.getItem("algoapp-default-volume");
  if (saved) {
    const parsed = parseInt(saved);
    // Validate range
    if (parsed >= 0 && parsed <= 100) {
      return parsed;
    }
  }

  return 50; // Default
}
