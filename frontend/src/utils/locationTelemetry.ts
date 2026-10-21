import { api } from '../api/client';

// Dedicated office / field fallback coordinates across Karachi business hubs
// used when GPS hardware permissions are being established
export const STAFF_FALLBACK_GEO: Record<string, { lat: number; lng: number; address: string }> = {
  'noel@apis.com': { lat: 24.8532, lng: 67.0167, address: 'I.I. Chundrigar Financial District, Karachi' },
  'naeem@apis.com': { lat: 24.8719, lng: 67.0598, address: 'Shahrah-e-Faisal Media Corridor, Karachi' },
  'kashif@apis.com': { lat: 24.8297, lng: 67.0739, address: 'DHA Phase 6 Commercial Hub, Karachi' },
  'abeel@apis.com': { lat: 24.8631, lng: 67.0674, address: 'Digital Design & Studio Space, Tariq Road, Karachi' },
  'fahim@apis.com': { lat: 24.8698, lng: 67.0822, address: 'Karsaz Digital Growth Hub, Karachi' },
  'fatima@apis.com': { lat: 24.8214, lng: 67.0425, address: 'Clifton Creative Quarter, Karachi' },
  'maha@apis.com': { lat: 24.8933, lng: 67.0281, address: 'Nazimabad Prime OOH Billboard Site #4, Karachi' },
};

/**
 * Checks if the user is a full-access executive who should NOT be tracked
 */
export function isFullAccessExecutive(user: { email?: string; role?: any } | null): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const roleName = typeof user.role === 'object' ? (user.role as any)?.name : user.role || '';
  
  // Full-access accounts whose personal location is NEVER tracked:
  // 1. CEO Khurram Jaffrani (khurram@apis.com)
  // 2. Syeda Musfira (musfira@apis.com)
  // 3. Shoaib Jaffrani (shoaib@apis.com)
  // 4. Adnan Karim (adnan@apis.com)
  const fullAccessEmails = [
    'khurram@apis.com',
    'musfira@apis.com',
    'shoaib@apis.com',
    'adnan@apis.com',
  ];

  return fullAccessEmails.includes(email) || roleName === 'CEO' || roleName === 'ADMIN';
}

/**
 * Automatically capture and relay staff GPS location upon login (mobile or desktop).
 * Full access accounts (Khurram, Musfira, Shoaib, Adnan) are skipped 100%.
 */
export async function autoConnectStaffLocation(user: { id?: string; email?: string; role?: any } | null) {
  if (!user || !user.email) return;

  // 1. If full access account, DO NOT TRACK
  if (isFullAccessExecutive(user)) {
    console.log('[LocationTelemetry] Full-access executive logged in. Location tracking bypassed.');
    return;
  }

  const cleanEmail = user.email.toLowerCase().trim();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const deviceType = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? 'ios'
    : /Android/i.test(navigator.userAgent)
    ? 'android'
    : 'desktop-web';

  const sendPing = async (lat: number, lng: number, accuracy = 5, address?: string) => {
    try {
      await api.post('/locations/ping', {
        latitude: lat,
        longitude: lng,
        accuracy,
        speed: 0,
        heading: 0,
        device: deviceType,
        battery: 90,
        address: address || (isMobile ? 'Live Mobile Telemetry' : 'Live Desktop Telemetry'),
      });
      console.log(`[LocationTelemetry] Auto GPS connected for ${cleanEmail}: ${lat}, ${lng}`);
    } catch (err) {
      console.error('[LocationTelemetry] Failed to auto-ping location:', err);
    }
  };

  // 2. Try browser / mobile GPS
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        sendPing(latitude, longitude, accuracy);
      },
      (err) => {
        console.warn('[LocationTelemetry] Hardware GPS prompt fallback:', err.message);
        // Fallback to staff designated live coordinates so Google Map immediately pins them
        const fallback = STAFF_FALLBACK_GEO[cleanEmail] || { lat: 24.8607, lng: 67.0011, address: 'Karachi Field Hub' };
        sendPing(fallback.lat, fallback.lng, 10, fallback.address);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  } else {
    // Geolocation not supported, use fallback
    const fallback = STAFF_FALLBACK_GEO[cleanEmail] || { lat: 24.8607, lng: 67.0011, address: 'Karachi Field Hub' };
    sendPing(fallback.lat, fallback.lng, 10, fallback.address);
  }
}
