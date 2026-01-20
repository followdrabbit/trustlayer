/**
 * Device Fingerprinting Service
 *
 * Collects device characteristics for security analysis and fraud detection.
 * Used for:
 * - Identifying returning users across sessions
 * - Detecting suspicious device changes
 * - Risk scoring in audit logs
 * - Session tracking and anomaly detection
 *
 * Privacy considerations:
 * - Only collects non-PII device attributes
 * - Fingerprint is hashed before storage
 * - Used only for security purposes
 * - Compliant with GDPR/LGPD requirements
 */

import type { DeviceInfo } from './types';

// ============================================================================
// Types
// ============================================================================

export interface DeviceFingerprint {
  hash: string;
  components: FingerprintComponents;
  deviceInfo: DeviceInfo;
  confidence: number; // 0-100, how confident we are in the fingerprint
  createdAt: string;
}

export interface FingerprintComponents {
  // Browser characteristics
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  vendor: string;
  cookiesEnabled: boolean;
  doNotTrack: string | null;

  // Screen characteristics
  screenWidth: number;
  screenHeight: number;
  screenColorDepth: number;
  screenPixelRatio: number;
  availWidth: number;
  availHeight: number;

  // Timezone
  timezone: string;
  timezoneOffset: number;

  // Hardware
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  maxTouchPoints: number;

  // Canvas fingerprint (hashed)
  canvasHash: string;

  // WebGL fingerprint
  webglVendor: string;
  webglRenderer: string;

  // Audio fingerprint (hashed)
  audioHash: string;

  // Font detection (hashed list)
  fontsHash: string;

  // Browser features
  plugins: string[];
  mimeTypes: string[];

  // Storage availability
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;

  // Connection info
  connectionType: string | undefined;
  connectionDownlink: number | undefined;
}

export interface FingerprintMatch {
  fingerprint: DeviceFingerprint;
  similarity: number; // 0-100
  isMatch: boolean;
  changedComponents: string[];
}

// ============================================================================
// Device Fingerprinting Service
// ============================================================================

export class DeviceFingerprintService {
  private cachedFingerprint: DeviceFingerprint | null = null;

  /**
   * Generate a device fingerprint
   */
  async generateFingerprint(): Promise<DeviceFingerprint> {
    // Return cached if available and recent (within 5 minutes)
    if (this.cachedFingerprint) {
      const cacheAge = Date.now() - new Date(this.cachedFingerprint.createdAt).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        return this.cachedFingerprint;
      }
    }

    const components = await this.collectComponents();
    const hash = await this.hashComponents(components);
    const deviceInfo = this.extractDeviceInfo(components);
    const confidence = this.calculateConfidence(components);

    const fingerprint: DeviceFingerprint = {
      hash,
      components,
      deviceInfo,
      confidence,
      createdAt: new Date().toISOString(),
    };

    this.cachedFingerprint = fingerprint;
    return fingerprint;
  }

  /**
   * Get just the device info (for quick access)
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const fingerprint = await this.generateFingerprint();
    return fingerprint.deviceInfo;
  }

  /**
   * Compare two fingerprints for similarity
   */
  compareFingerprints(
    fp1: DeviceFingerprint,
    fp2: DeviceFingerprint
  ): FingerprintMatch {
    const changedComponents: string[] = [];
    let matchScore = 0;
    let totalWeight = 0;

    // Component weights for similarity calculation
    const weights: Record<string, number> = {
      userAgent: 15,
      platform: 10,
      screenWidth: 5,
      screenHeight: 5,
      timezone: 10,
      language: 5,
      hardwareConcurrency: 5,
      deviceMemory: 5,
      canvasHash: 15,
      webglVendor: 10,
      webglRenderer: 10,
      fontsHash: 5,
    };

    for (const [key, weight] of Object.entries(weights)) {
      totalWeight += weight;
      const v1 = (fp1.components as any)[key];
      const v2 = (fp2.components as any)[key];

      if (v1 === v2) {
        matchScore += weight;
      } else {
        changedComponents.push(key);
      }
    }

    const similarity = Math.round((matchScore / totalWeight) * 100);

    return {
      fingerprint: fp2,
      similarity,
      isMatch: similarity >= 70, // 70% threshold for match
      changedComponents,
    };
  }

  /**
   * Calculate risk score based on fingerprint changes
   */
  calculateRiskScore(
    currentFp: DeviceFingerprint,
    previousFp: DeviceFingerprint | null
  ): number {
    if (!previousFp) {
      return 20; // New device, moderate risk
    }

    const match = this.compareFingerprints(previousFp, currentFp);

    if (match.isMatch) {
      return 0; // Same device, no risk
    }

    // Calculate risk based on what changed
    let risk = 0;

    // High-risk changes
    const highRiskChanges = ['timezone', 'platform', 'webglRenderer'];
    for (const change of match.changedComponents) {
      if (highRiskChanges.includes(change)) {
        risk += 25;
      }
    }

    // Medium-risk changes
    const mediumRiskChanges = ['userAgent', 'canvasHash', 'fontsHash'];
    for (const change of match.changedComponents) {
      if (mediumRiskChanges.includes(change)) {
        risk += 15;
      }
    }

    // Low-risk changes (can happen legitimately)
    const lowRiskChanges = ['screenWidth', 'screenHeight', 'language'];
    for (const change of match.changedComponents) {
      if (lowRiskChanges.includes(change)) {
        risk += 5;
      }
    }

    // Cap at 100
    return Math.min(100, risk);
  }

  // ============================================================================
  // Private Methods - Component Collection
  // ============================================================================

  private async collectComponents(): Promise<FingerprintComponents> {
    const nav = navigator;
    const screen = window.screen;

    // Collect all components
    const components: FingerprintComponents = {
      // Browser characteristics
      userAgent: nav.userAgent,
      language: nav.language,
      languages: [...(nav.languages || [])],
      platform: nav.platform,
      vendor: nav.vendor,
      cookiesEnabled: nav.cookieEnabled,
      doNotTrack: nav.doNotTrack,

      // Screen characteristics
      screenWidth: screen.width,
      screenHeight: screen.height,
      screenColorDepth: screen.colorDepth,
      screenPixelRatio: window.devicePixelRatio || 1,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,

      // Timezone
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),

      // Hardware
      hardwareConcurrency: nav.hardwareConcurrency || 1,
      deviceMemory: (nav as any).deviceMemory,
      maxTouchPoints: nav.maxTouchPoints || 0,

      // Canvas fingerprint
      canvasHash: await this.getCanvasFingerprint(),

      // WebGL fingerprint
      ...this.getWebGLInfo(),

      // Audio fingerprint
      audioHash: await this.getAudioFingerprint(),

      // Font detection
      fontsHash: await this.getFontsFingerprint(),

      // Browser features
      plugins: this.getPlugins(),
      mimeTypes: this.getMimeTypes(),

      // Storage availability
      localStorage: this.hasLocalStorage(),
      sessionStorage: this.hasSessionStorage(),
      indexedDB: this.hasIndexedDB(),

      // Connection info
      connectionType: (nav as any).connection?.effectiveType,
      connectionDownlink: (nav as any).connection?.downlink,
    };

    return components;
  }

  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'unavailable';

      canvas.width = 200;
      canvas.height = 50;

      // Draw various shapes and text
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('TrustLayer,fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('TrustLayer,fingerprint', 4, 17);

      // Get data URL and hash it
      const dataUrl = canvas.toDataURL();
      return await this.hashString(dataUrl);
    } catch {
      return 'error';
    }
  }

  private getWebGLInfo(): { webglVendor: string; webglRenderer: string } {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        return { webglVendor: 'unavailable', webglRenderer: 'unavailable' };
      }

      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return { webglVendor: 'unknown', webglRenderer: 'unknown' };
      }

      return {
        webglVendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
        webglRenderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown',
      };
    } catch {
      return { webglVendor: 'error', webglRenderer: 'error' };
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return 'unavailable';

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      const processor = context.createScriptProcessor(4096, 1, 1);

      gain.gain.value = 0; // Mute
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(processor);
      processor.connect(gain);
      gain.connect(context.destination);
      oscillator.start(0);

      // Get frequency data
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);

      // Cleanup
      oscillator.stop();
      context.close();

      // Hash the frequency data
      const dataStr = Array.from(frequencyData.slice(0, 30)).join(',');
      return await this.hashString(dataStr);
    } catch {
      return 'error';
    }
  }

  private async getFontsFingerprint(): Promise<string> {
    // Common fonts to check
    const fonts = [
      'Arial',
      'Arial Black',
      'Calibri',
      'Cambria',
      'Comic Sans MS',
      'Consolas',
      'Courier',
      'Courier New',
      'Georgia',
      'Helvetica',
      'Impact',
      'Lucida Console',
      'Lucida Sans Unicode',
      'Microsoft Sans Serif',
      'Monaco',
      'Palatino Linotype',
      'Tahoma',
      'Times',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
    ];

    const detected: string[] = [];

    for (const font of fonts) {
      if (this.isFontAvailable(font)) {
        detected.push(font);
      }
    }

    return await this.hashString(detected.join(','));
  }

  private isFontAvailable(font: string): boolean {
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const baseFonts = ['monospace', 'sans-serif', 'serif'];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Get baseline widths
    const baseWidths: Record<string, number> = {};
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} ${baseFont}`;
      baseWidths[baseFont] = ctx.measureText(testString).width;
    }

    // Test against base fonts
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} '${font}', ${baseFont}`;
      const width = ctx.measureText(testString).width;
      if (width !== baseWidths[baseFont]) {
        return true;
      }
    }

    return false;
  }

  private getPlugins(): string[] {
    try {
      return Array.from(navigator.plugins || [])
        .slice(0, 10)
        .map(p => p.name);
    } catch {
      return [];
    }
  }

  private getMimeTypes(): string[] {
    try {
      return Array.from(navigator.mimeTypes || [])
        .slice(0, 10)
        .map(m => m.type);
    } catch {
      return [];
    }
  }

  private hasLocalStorage(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private hasSessionStorage(): boolean {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private hasIndexedDB(): boolean {
    try {
      return !!window.indexedDB;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Private Methods - Processing
  // ============================================================================

  private async hashComponents(components: FingerprintComponents): Promise<string> {
    // Create a stable string representation
    const str = JSON.stringify({
      userAgent: components.userAgent,
      platform: components.platform,
      language: components.language,
      timezone: components.timezone,
      screenWidth: components.screenWidth,
      screenHeight: components.screenHeight,
      hardwareConcurrency: components.hardwareConcurrency,
      deviceMemory: components.deviceMemory,
      canvasHash: components.canvasHash,
      webglVendor: components.webglVendor,
      webglRenderer: components.webglRenderer,
      audioHash: components.audioHash,
      fontsHash: components.fontsHash,
    });

    return this.hashString(str);
  }

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private extractDeviceInfo(components: FingerprintComponents): DeviceInfo {
    const ua = components.userAgent.toLowerCase();

    // Detect device type
    let type: DeviceInfo['type'] = 'desktop';
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      type = 'mobile';
    } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
      type = 'tablet';
    }

    // Detect OS
    let os = 'Unknown';
    if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
    else if (/windows nt/i.test(ua)) os = 'Windows';
    else if (/mac os x/i.test(ua)) os = 'macOS';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/chrome os/i.test(ua)) os = 'Chrome OS';

    // Detect browser
    let browser = 'Unknown';
    if (/edg\//i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua) && /safari/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';
    else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';

    return {
      type,
      os,
      browser,
      screenResolution: `${components.screenWidth}x${components.screenHeight}`,
    };
  }

  private calculateConfidence(components: FingerprintComponents): number {
    let confidence = 100;

    // Reduce confidence for missing/error components
    if (components.canvasHash === 'error' || components.canvasHash === 'unavailable') {
      confidence -= 20;
    }
    if (components.webglVendor === 'unavailable' || components.webglVendor === 'error') {
      confidence -= 15;
    }
    if (components.audioHash === 'error' || components.audioHash === 'unavailable') {
      confidence -= 10;
    }
    if (components.fontsHash === 'error') {
      confidence -= 10;
    }
    if (!components.deviceMemory) {
      confidence -= 5;
    }
    if (components.plugins.length === 0) {
      confidence -= 5;
    }

    return Math.max(0, confidence);
  }

  /**
   * Clear cached fingerprint
   */
  clearCache(): void {
    this.cachedFingerprint = null;
  }
}

// Singleton instance
export const deviceFingerprint = new DeviceFingerprintService();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get device fingerprint hash (quick access)
 */
export async function getDeviceFingerprintHash(): Promise<string> {
  const fp = await deviceFingerprint.generateFingerprint();
  return fp.hash;
}

/**
 * Get device info (quick access)
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  return deviceFingerprint.getDeviceInfo();
}

/**
 * Check if current device matches a stored fingerprint hash
 */
export async function matchesStoredFingerprint(storedHash: string): Promise<boolean> {
  const fp = await deviceFingerprint.generateFingerprint();
  return fp.hash === storedHash;
}
