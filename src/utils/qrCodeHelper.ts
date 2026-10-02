import QRCode from 'qrcode';
import { Device } from '../types';

export interface MachineQRPayload {
  type: 'EDM_ASSET_TAG';
  deviceId: string;
  code: string;
  model: string;
  brand: string;
  factoryUrl: string;
}

/**
 * Creates standard QR content string for a machine
 */
export function generateMachineQRContent(device: Device): string {
  // Format as clean identifiable string or JSON
  return JSON.stringify({
    type: 'EDM_ASSET_TAG',
    deviceId: device.id,
    code: device.code,
    model: device.model,
    brand: device.brand,
    factoryUrl: `${window.location.origin}?device=${device.id}`,
  });
}

/**
 * Generates high-res QR code PNG data URL for printing or digital display
 */
export async function generateMachineQRDataUrl(device: Device): Promise<string> {
  const content = generateMachineQRContent(device);
  try {
    return await QRCode.toDataURL(content, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR Data URL:', err);
    return '';
  }
}

/**
 * Parses raw text from a scanned QR code to identify which device it represents
 */
export function parseScannedMachineQR(rawText: string, devices: Device[]): Device | null {
  if (!rawText) return null;
  const clean = rawText.trim();

  // 1. Try parsing JSON
  try {
    const parsed = JSON.parse(clean);
    if (parsed.deviceId) {
      const match = devices.find((d) => d.id === parsed.deviceId);
      if (match) return match;
    }
    if (parsed.code) {
      const match = devices.find((d) => d.code.toUpperCase() === parsed.code.toUpperCase());
      if (match) return match;
    }
  } catch {
    // Not valid JSON, continue with pattern matching
  }

  // 2. Try match exact device id or code directly (e.g. "dev-01", "EDM-W01")
  const exactCode = devices.find(
    (d) =>
      clean.toUpperCase() === d.code.toUpperCase() ||
      clean.toLowerCase() === d.id.toLowerCase()
  );
  if (exactCode) return exactCode;

  // 3. Search inside string for known machine codes or device IDs
  for (const device of devices) {
    if (clean.includes(device.id) || clean.toUpperCase().includes(device.code.toUpperCase())) {
      return device;
    }
  }

  return null;
}
