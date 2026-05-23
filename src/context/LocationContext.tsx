"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

export type LocationData = {
  street: string;
  area: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  display: string;
  formatted: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
};

type LocationContextType = {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
  setLocationManual: (loc: LocationData) => void;
};

const LocationContext = createContext<LocationContextType | null>(null);

// v5: Google Maps Geocoding — clears ALL old caches
const STORAGE_KEY = "vt_location_v5";

function clearOldCaches() {
  try {
    ["vt_location", "vt_location_v1", "vt_location_v2", "vt_location_v3", "vt_location_v4"].forEach((k) =>
      localStorage.removeItem(k)
    );
  } catch { /* ignore */ }
}

// ─── Get coordinates: GPS first, then IP-based fallback ───
function getCoordinates(): Promise<{ lat: number; lng: number; source: "gps" | "ip" }> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (lat: number, lng: number, source: "gps" | "ip") => {
      if (settled) return;
      settled = true;
      resolve({ lat, lng, source });
    };

    // ── Strategy 1: Browser GPS ──
    if (navigator.geolocation) {
      let bestPosition: GeolocationPosition | null = null;
      let watchId: number | null = null;

      const cleanupWatch = () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
      };

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }
          if (pos.coords.accuracy <= 150) {
            cleanupWatch();
            finish(pos.coords.latitude, pos.coords.longitude, "gps");
          }
        },
        () => {
          // GPS failed — will be handled by timeout/fallback below
          cleanupWatch();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // After 6 seconds: use best GPS fix or fall back to IP
      setTimeout(() => {
        cleanupWatch();
        if (!settled && bestPosition) {
          finish(bestPosition.coords.latitude, bestPosition.coords.longitude, "gps");
        }
      }, 6000);
    }

    // ── Strategy 2: IP-based geolocation (fallback, runs in parallel) ──
    // Kicks in after 7 seconds if GPS hasn't resolved
    setTimeout(async () => {
      if (settled) return;
      try {
        // ipapi.co — free, no key needed, gives lat/lng from IP
        const res = await fetch("https://ipapi.co/json/", {
          headers: { "User-Agent": "VinayagaTraders/1.0" },
        });
        const data = await res.json();
        if (data.latitude && data.longitude) {
          finish(data.latitude, data.longitude, "ip");
        } else {
          throw new Error("No coordinates from IP lookup");
        }
      } catch {
        if (!settled) {
          reject(new Error("Could not determine location. Please search manually."));
        }
      }
    }, 4000); // Start IP lookup after 4s — gives GPS a head start

    // Hard timeout: 12 seconds total
    setTimeout(() => {
      if (!settled) {
        reject(new Error("Location detection timed out. Please search manually."));
      }
    }, 12000);
  });
}

// ─── Reverse geocode via our server-side API route ───
async function reverseGeocode(lat: number, lng: number): Promise<LocationData> {
  const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || "Geocoding failed");
  }

  const street: string = data.street || "";
  const area: string = data.area || "";
  const locality: string = data.locality || "";
  const city: string = data.city || "";
  const state: string = data.state || "";
  const pincode: string = data.pincode || "";
  const formatted: string = data.formatted || "";

  // Build a clean display: "Area, Locality, City"
  const displayParts: string[] = [];
  if (area) displayParts.push(area);
  if (locality && locality !== area) displayParts.push(locality);
  if (city && !displayParts.includes(city)) displayParts.push(city);
  if (displayParts.length === 0 && street) displayParts.push(street);
  if (displayParts.length === 0 && formatted) displayParts.push(formatted.split(",")[0] || "");

  const display = displayParts.length > 0 ? displayParts.join(", ") : formatted || "Unknown";

  return {
    street,
    area,
    locality,
    city,
    state,
    pincode,
    display,
    formatted,
    lat: data.lat ?? lat,
    lng: data.lng ?? lng,
  };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestedRef = useRef(false);

  // On mount: purge old caches, load current
  useEffect(() => {
    clearOldCaches();
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) setLocation(JSON.parse(cached));
    } catch { /* ignore */ }
  }, []);

  const setLocationManual = useCallback((loc: LocationData) => {
    setLocation(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch { /* ignore */ }
  }, []);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCoordinates();
      const loc = await reverseGeocode(pos.lat, pos.lng);
      loc.accuracy = undefined;
      setLocation(loc);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      } catch { /* ignore */ }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not fetch location";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-detect on first load if no cache
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) requestLocation();
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LocationContext.Provider value={{ location, loading, error, requestLocation, setLocationManual }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be inside LocationProvider");
  return ctx;
}
