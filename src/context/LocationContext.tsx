"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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

export type GeocoderAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GeocoderResult = {
  address_components: GeocoderAddressComponent[];
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  place_id?: string;
};

const LocationContext = createContext<LocationContextType | null>(null);

const STORAGE_KEY = "vt_location_v7";

function clearOldCaches() {
  try {
    ["vt_location", "vt_location_v1", "vt_location_v2", "vt_location_v3", "vt_location_v4", "vt_location_v5", "vt_location_v6"].forEach(
      (k) => localStorage.removeItem(k)
    );
  } catch {
    /* ignore */
  }
}

// ─── India Post Pincode lookup via Baileys server proxy ───
const PINCODE_API =
  typeof window !== "undefined"
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

// ─── Helper: Extract component from geocoder result ───
function extractComponent(components: GeocoderAddressComponent[], type: string): string {
  const comp = components.find((c) => c.types.includes(type));
  return comp?.long_name || "";
}

// ─── Convert geocoder result to LocationData ───
export async function geocoderResultToLocation(
  result: GeocoderResult,
  userQuery?: string
): Promise<LocationData> {
  const components = result.address_components || [];

  const street =
    extractComponent(components, "route") ||
    extractComponent(components, "premise") ||
    "";
  const area =
    extractComponent(components, "sublocality_level_1") ||
    extractComponent(components, "sublocality") ||
    extractComponent(components, "neighborhood") ||
    "";
  const locality =
    extractComponent(components, "sublocality_level_2") ||
    extractComponent(components, "administrative_area_level_3") ||
    area ||
    "";
  const city =
    extractComponent(components, "locality") ||
    extractComponent(components, "administrative_area_level_2") ||
    "";
  const state = extractComponent(components, "administrative_area_level_1") || "";
  const formatted = result.formatted_address || "";

  // Pincode: user-typed > geocoder > India Post fallback
  let pincode = "";
  const userPincodeMatch = userQuery?.match(/\b[1-9][0-9]{5}\b/);
  if (userPincodeMatch) {
    pincode = userPincodeMatch[0];
  } else {
    pincode = extractComponent(components, "postal_code") || "";
    if (!pincode) {
      const district = locality || city;
      const candidates = [street, area, locality].filter(Boolean);
      for (const candidate of candidates) {
        if (pincode) break;
        pincode = await getIndiaPostPincode(candidate, district);
      }
    }
  }

  const displayParts: string[] = [];
  if (area) displayParts.push(area);
  if (street && street !== area) displayParts.push(street);
  if (city && !displayParts.includes(city)) displayParts.push(city);
  if (displayParts.length === 0 && formatted) displayParts.push(formatted.split(",")[0] || "");

  // geometry.location is a plain object from REST API {lat, lng}
  const lat = result.geometry?.location?.lat;
  const lng = result.geometry?.location?.lng;

  return {
    street,
    area,
    locality,
    city,
    state,
    pincode,
    display: displayParts.length > 0 ? displayParts.join(", ") : formatted || "Unknown",
    formatted,
    lat,
    lng,
  };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: purge old caches, load current
  useEffect(() => {
    clearOldCaches();
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) setLocation(JSON.parse(cached));
    } catch {
      /* ignore */
    }
  }, []);

  const setLocationManual = useCallback((loc: LocationData) => {
    setLocation(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      /* ignore */
    }
  }, []);

  const requestLocation = useCallback(async () => {
    // Disabled auto-fetching per user request. This will just be a no-op if called.
    setLoading(false);
    setError("Auto-fetching is disabled. Please enter your location manually.");
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
