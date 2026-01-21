
import { supabase } from '../lib/supabase';

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export const locationService = {
  async getCurrentPosition(): Promise<GeoCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          console.warn("Geolocation access denied or failed. Using fallback.", err);
          resolve({ lat: 12.9716, lng: 77.5946 }); // Example: Bangalore
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  },

  /**
   * Continuous telemetry watch for workers
   */
  watchPosition(callback: (coords: GeoCoords) => void) {
    if (!navigator.geolocation) return null;

    return navigator.geolocation.watchPosition(
      (pos) => {
        callback({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => console.error("Telemetry Stream Failure:", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  },

  async updateWorkerTelemetry(workerId: string, coords: GeoCoords) {
    const { error } = await supabase.rpc('update_worker_location', {
      p_worker_id: workerId,
      p_lat: coords.lat,
      p_lng: coords.lng
    });
    if (error) throw error;
  },

  async getWorkerLiveLocation(workerId: string): Promise<GeoCoords | null> {
    const { data, error } = await supabase.rpc('get_worker_location', {
      p_worker_id: workerId
    });
    if (error) return null;
    return data;
  },

  formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  }
};