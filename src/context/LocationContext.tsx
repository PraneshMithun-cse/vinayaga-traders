"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import axios from "axios";

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

// ─── India Post Pincode lookup via Baileys server proxy ───
// The browser cannot call India Post directly (CORS + expired SSL cert).
// We proxy through the Baileys Express server (port 3002) which calls it server-side.
const PINCODE_API = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.hostname}:3002`
  : "http://localhost:3002";

async function getIndiaPostPincode(localityName: string, district: string): Promise<string> {
  if (!localityName || localityName.length < 3) return "";

  try {
    const res = await fetch(
      `${PINCODE_API}/api/pincode?name=${encodeURIComponent(localityName)}&district=${encodeURIComponent(district)}`
    );
    const data = await res.json();
    return data.pincode || "";
  } catch {
    return "";
  }
}

// ─── Multi-source reverse geocode ───
// Architecture:
//   1. Geoapify → street, area, locality, city (good at address components)
//   2. India Post API → pincode (the ONLY accurate source for Indian pincodes)
//   3. Merge: take address from Geoapify, pincode from India Post
async function reverseGeocode(lat: number, lng: number): Promise<LocationData> {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "c97ed431fa624280ab468734df9fc302";
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}`;
  
  try {
    const res = await axios.get(url);
    const properties = res.data.features?.[0]?.properties;

    if (!properties) {
      throw new Error("No location data found");
    }

    const street: string = properties.street || properties.name || "";
    const area: string = properties.suburb || properties.district || "";
    const locality: string = properties.city_district || properties.county || "";
    const city: string = properties.city || properties.state_district || "";
    const state: string = properties.state || "";
    const formatted: string = properties.formatted || "";

    // ── PINCODE: Use India Post API for 100% accuracy ──
    // We try multiple search terms from most specific to least specific:
    //   1. Street name (e.g. "Thoppampatti road" → "Thoppampatti")
    //   2. Suburb/area name
    //   3. City district / county name
    // The first one that returns a match for our district wins.
    const district = locality || city;
    let pincode = "";

    // Try each candidate in order of specificity
    const candidates = [street, area, locality].filter(Boolean);
    for (const candidate of candidates) {
      if (pincode) break;
      pincode = await getIndiaPostPincode(candidate, district);
    }

    // Fallback to Geoapify pincode if India Post returned nothing
    if (!pincode) {
      pincode = properties.postcode || "";
    }

    // Build a clean display prioritizing Street and Locality
    const displayParts: string[] = [];
    if (street) displayParts.push(street);
    if (locality && locality !== street) displayParts.push(locality);
    if (area && area !== locality && area !== street) displayParts.push(area);
    if (city && !displayParts.includes(city)) displayParts.push(city);
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
      lat: properties.lat ?? lat,
      lng: properties.lon ?? lng,
    };
  } catch (err) {
    throw new Error("Geocoding failed");
  }
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
