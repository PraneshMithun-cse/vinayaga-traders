"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLocation, LocationData } from "@/context/LocationContext";
import { supabase } from "@/lib/supabase";

const SEARCH_SUGGESTIONS = ["Toor Dal", "Turmeric", "Cashews", "Basmati Rice", "Cumin Seeds", "Besan", "Sesame Oil"];

// ─── India Post Pincode lookup via Baileys server proxy ───
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

async function geoapifyResultToLocation(r: any, query: string): Promise<LocationData> {
  const userPincodeMatch = query.match(/\b[1-9][0-9]{5}\b/);
  const userPincode = userPincodeMatch ? userPincodeMatch[0] : null;

  const street = r.street || r.name || "";
  const area = r.suburb || r.district || "";
  const locality = r.city_district || r.county || "";
  const city = r.city || r.state_district || "";
  const state = r.state || "";
  const formatted = r.formatted || "";

  // Pincode: user-typed > India Post verified > Geoapify fallback
  let pincode = "";
  if (userPincode) {
    pincode = userPincode;
  } else {
    const district = locality || city;
    const candidates = [street, area, locality].filter(Boolean);
    for (const candidate of candidates) {
      if (pincode) break;
      pincode = await getIndiaPostPincode(candidate, district);
    }
    if (!pincode) pincode = r.postcode || "";
  }

  const displayParts: string[] = [];
  if (street) displayParts.push(street);
  if (locality && locality !== street) displayParts.push(locality);
  if (area && area !== locality && area !== street) displayParts.push(area);
  if (city && !displayParts.includes(city)) displayParts.push(city);
  if (displayParts.length === 0 && formatted) displayParts.push(formatted.split(",")[0] || "");

  return {
    street,
    area,
    locality,
    city,
    state,
    pincode,
    display: displayParts.length > 0 ? displayParts.join(", ") : formatted || "Unknown",
    formatted,
    lat: r.lat,
    lng: r.lon,
  };
}

function LocationModal({
  onClose,
  onUseGPS,
  onSelectAddress,
  loading,
  currentLocation,
  error,
}: {
  onClose: () => void;
  onUseGPS: () => void;
  onSelectAddress: (loc: LocationData) => void;
  loading: boolean;
  currentLocation: LocationData | null;
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "c97ed431fa624280ab468734df9fc302";
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&apiKey=${apiKey}&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 350);
  }

  async function handleSelect(r: any) {
    const loc = await geoapifyResultToLocation(r, query);
    onSelectAddress(loc);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(2,6,12,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "white", borderRadius: 20,
          padding: "28px 24px 24px",
          width: "100%", maxWidth: 430,
          position: "relative",
          boxShadow: "0 24px 64px rgba(2,6,12,0.22)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "#F2F2F2", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 34, height: 34,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#282C3F" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Title + map graphic */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#282C3F", margin: 0, lineHeight: 1.2, paddingRight: 16 }}>
            Change your<br />location?
          </h2>
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            backgroundColor: "#EEF0FF", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
              {/* wavy map lines */}
              <path d="M10 28 Q22 16 38 26 Q52 36 66 20" stroke="#C8CCFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M10 42 Q24 34 38 44 Q52 54 66 38" stroke="#C8CCFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M10 56 Q24 50 38 58 Q52 66 66 54" stroke="#C8CCFF" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* pin shadow */}
              <ellipse cx="38" cy="56" rx="6" ry="3" fill="#3D5AFE" opacity="0.18" />
              {/* pin body */}
              <path d="M38 18 C30 18 23 25 23 33.5 C23 44 38 56 38 56 C38 56 53 44 53 33.5 C53 25 46 18 38 18Z" fill="#3D5AFE" />
              <circle cx="38" cy="33.5" r="7" fill="white" />
              <circle cx="38" cy="33.5" r="3.5" fill="#3D5AFE" />
            </svg>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div style={{ textAlign: "center", padding: "16px 0 12px", color: "#3D5AFE", fontSize: 13, fontWeight: 600 }}>
            <div style={{ display: "inline-block", width: 20, height: 20, border: "2.5px solid #E0E0FF", borderTopColor: "#3D5AFE", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 8, verticalAlign: "middle" }} />
            Detecting your location…
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div style={{
            padding: "10px 14px", marginBottom: 12,
            backgroundColor: "#FFF3F0", border: "1px solid #FFD0C0",
            borderRadius: 10, fontSize: 12, color: "#C0392B", textAlign: "center",
          }}>
            {error}. Please click the button below or search manually.
          </div>
        )}

        {/* GPS detected result — shown as a "use this" row */}
        {currentLocation && !loading && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => onSelectAddress(currentLocation)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                backgroundColor: "#F0F4FF", border: "1.5px solid #C0D0FF",
                borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="3" fill="#3D5AFE" />
                <circle cx="12" cy="12" r="7" stroke="#3D5AFE" strokeWidth="1.8" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#3D5AFE" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3D5AFE", marginBottom: 1 }}>GPS detected</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#282C3F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentLocation.display}
                </div>
                {currentLocation.pincode && (
                  <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginTop: 1 }}>Pincode: {currentLocation.pincode}</div>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3D5AFE", flexShrink: 0 }}>Use →</div>
            </button>
            <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", textAlign: "center", marginTop: 7, marginBottom: 2 }}>
              GPS not accurate? Type your area below
            </div>
          </div>
        )}

        {/* Search input */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10,
              border: "1.5px solid #E0E0E0", borderRadius: 12,
              padding: "13px 16px",
              backgroundColor: "white",
              transition: "border-color 0.15s",
            }}
          >
            {searching ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="9" stroke="#0050FF" strokeWidth="2.5" strokeDasharray="28 56" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7" stroke="rgba(2,6,12,0.38)" strokeWidth="2" />
                <path d="M20 20l-3-3" stroke="rgba(2,6,12,0.38)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={handleQueryChange}
              placeholder="Search for an area or address"
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 14, color: "#282C3F", backgroundColor: "transparent",
                fontFamily: "inherit",
              }}
            />
            {query.length > 0 && (
              <button
                onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="rgba(2,6,12,0.4)" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {results.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
              backgroundColor: "white", borderRadius: 12, zIndex: 10,
              boxShadow: "0 8px 32px rgba(2,6,12,0.14)",
              border: "1px solid #E8E8E8",
              maxHeight: 280, overflowY: "auto",
            }}>
              {results.map((r, idx) => {
                const mainLabel = r.area || r.locality || r.street || r.formatted.split(",")[0]?.trim() || "";
                const subLabel = [r.city, r.state, r.pincode].filter(Boolean).join(", ");
                return (
                  <button
                    key={`${r.lat}-${r.lng}-${idx}`}
                    onClick={() => handleSelect(r)}
                    style={{
                      width: "100%", display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 14px", background: "none", border: "none", cursor: "pointer",
                      borderBottom: "1px solid #F5F5F5", textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F9FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#3D5AFE" opacity="0.8" />
                    </svg>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#282C3F", lineHeight: 1.3 }}>{mainLabel}</div>
                      {subLabel && <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginTop: 2 }}>{subLabel}</div>}
                      {r.pincode && <div style={{ fontSize: 10, color: "rgba(2,6,12,0.35)", marginTop: 1 }}>Pincode: {r.pincode}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Use current location button */}
        <button
          onClick={onUseGPS}
          disabled={loading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            backgroundColor: loading ? "#4A7AFF" : "#3D5AFE",
            color: "white", border: "none", borderRadius: 12,
            padding: "15px 20px", fontSize: 15, fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            marginBottom: 18, transition: "background-color 0.15s",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="white" />
            <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.8" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {loading ? "Detecting location…" : currentLocation ? "Re-detect GPS location" : "Use current location"}
        </button>

        {/* OR divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 0, borderTop: "1.5px dashed #DCDCDC" }} />
          <span style={{ fontSize: 12, color: "rgba(2,6,12,0.4)", fontWeight: 700, letterSpacing: 0.5 }}>OR</span>
          <div style={{ flex: 1, height: 0, borderTop: "1.5px dashed #DCDCDC" }} />
        </div>

        {/* Login link */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(2,6,12,0.55)" }}>
            <span
              onClick={() => {}}
              style={{ color: "#3D5AFE", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
            >
              Login
            </span>
            {" "}to see your saved addresses
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Header() {
  const [searchIdx, setSearchIdx] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false);
  const [waitingForGPS, setWaitingForGPS] = useState(false);
  const router = useRouter();
  const { totalItems, totalPrice } = useCart();
  const { location, loading, error, requestLocation, setLocationManual } = useLocation();
  const prevLoadingRef = useRef(loading);

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchIdx((i) => (i + 1) % SEARCH_SUGGESTIONS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Close modal once GPS resolves
  useEffect(() => {
    if (waitingForGPS && prevLoadingRef.current && !loading && location) {
      setWaitingForGPS(false);
      setShowLocationModal(false);
    }
    prevLoadingRef.current = loading;
  }, [loading, location, waitingForGPS]);

  function handleUseGPS() {
    setWaitingForGPS(true);
    requestLocation();
  }

  function handleSelectAddress(loc: LocationData) {
    setLocationManual(loc);
    setShowLocationModal(false);
  }

  return (
    <>
      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onUseGPS={handleUseGPS}
          onSelectAddress={handleSelectAddress}
          loading={loading}
          currentLocation={location}
          error={error}
        />
      )}

      <div
        className="sticky top-0 z-50 bg-white w-full"
        style={{ boxShadow: "rgba(2, 6, 12, 0.08) 0px 2px 8px 0px" }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex", alignItems: "center",
            padding: "10px 16px 8px", gap: 10,
            backgroundColor: "white", borderBottom: "1px solid #F0F0F0",
          }}
        >
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            <Image
              src="/vinayaga-logo.png"
              alt="Vinayaga Traders"
              width={85}
              height={85}
              style={{ objectFit: "contain", display: "block", borderRadius: 8 }}
              priority
            />
          </div>

          {/* Delivery info → opens modal */}
          <button
            onClick={() => setShowLocationModal(true)}
            style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
            aria-label="Change location"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#0050FF" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0050FF" }}>Express Delivery</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 1 }}>
              {loading ? (
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(2,6,12,0.4)", fontStyle: "italic" }}>
                  Locating…
                </span>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: 12, fontWeight: 600, color: "#282C3F",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160,
                    }}
                  >
                    {location?.display ?? "Tap to set location"}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="#282C3F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </div>
          </button>

          {/* Sign In */}
          <button
            onClick={() => router.push("/admin")}
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", flexShrink: 0 }}
            aria-label="Sign in"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#282C3F" strokeWidth="1.8" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#282C3F" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* My Orders */}
          <button
            onClick={() => setShowMyOrdersModal(true)}
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", flexShrink: 0 }}
            aria-label="My Orders"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6-4h6" stroke="#282C3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Cart */}
          {totalItems === 0 ? (
            <button
              onClick={() => router.push("/cart")}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", flexShrink: 0 }}
              aria-label="Cart"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#282C3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="6" x2="21" y2="6" stroke="#282C3F" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 10a4 4 0 01-8 0" stroke="#282C3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => router.push("/cart")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                backgroundColor: "#0050FF", border: "none", borderRadius: 10,
                padding: "6px 10px", cursor: "pointer", flexShrink: 0,
              }}
              aria-label="View cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "white", lineHeight: 1 }}>
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "white", lineHeight: 1.2 }}>
                  ₹{totalPrice}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Search bar */}
        <div style={{ padding: "8px 16px 10px" }}>
          <div
            onClick={() => router.push("/search")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              backgroundColor: "#F2F2F2", border: "1px solid #E8E8E8",
              borderRadius: 10, padding: "10px 12px", cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" stroke="rgba(2,6,12,0.5)" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="rgba(2,6,12,0.5)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", fontWeight: 500, userSelect: "none" }}>
              {`Search for "${SEARCH_SUGGESTIONS[searchIdx]}"`}
            </span>
          </div>
        </div>
      </div>

      {showMyOrdersModal && (
        <MyOrdersModal onClose={() => setShowMyOrdersModal(false)} />
      )}
    </>
  );
}

interface OrderItem {
  productName: string;
  variantWeight: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  items: OrderItem[];
}

function MyOrdersModal({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const placedIds = JSON.parse(localStorage.getItem("vt_my_orders") || "[]");
      if (!Array.isArray(placedIds) || placedIds.length === 0) {
        setLoading(false);
        return;
      }

      supabase
        .from("orders")
        .select("*")
        .in("id", placedIds)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (data) {
            setOrders(data as Order[]);
          }
          setLoading(false);
        });
    } catch {
      setLoading(false);
    }
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B",
    confirmed: "#3B82F6",
    packed: "#8B5CF6",
    delivered: "#22C55E",
    cancelled: "#EF4444",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(2, 6, 12, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          backgroundColor: "#F8F8F8",
          borderRadius: "24px 24px 0 0",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 32px rgba(2,6,12,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", backgroundColor: "white", borderBottom: "1px solid #F0F0F0" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#282C3F" }}>My Orders</div>
            <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginTop: 2 }}>Placed on this device</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              fontSize: 20,
              fontWeight: 600,
              color: "rgba(2,6,12,0.45)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(2,6,12,0.45)" }}>Loading order history…</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#282C3F", marginBottom: 4 }}>No orders yet</div>
              <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)" }}>Orders placed from this phone will show up here!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((order) => (
                <div key={order.id} style={{ backgroundColor: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #EDEDED" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", fontFamily: "monospace", marginBottom: 2 }}>ID: {order.id.slice(0, 8).toUpperCase()}</div>
                      <div style={{ fontSize: 11, color: "rgba(2,6,12,0.35)" }}>{new Date(order.created_at).toLocaleDateString("en-IN")}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 20,
                        backgroundColor: STATUS_COLORS[order.status] + "20",
                        color: STATUS_COLORS[order.status],
                        textTransform: "uppercase",
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div style={{ margin: "10px 0", height: 1, backgroundColor: "#F5F5F5" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#282C3F" }}>
                        <span>
                          {item.productName} <span style={{ color: "rgba(2,6,12,0.45)" }}>({item.variantWeight})</span> × {item.quantity}
                        </span>
                        <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ margin: "10px 0", height: 1, backgroundColor: "#F5F5F5" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "rgba(2,6,12,0.5)", fontWeight: 500 }}>{order.payment_method}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#282C3F" }}>Total: ₹{order.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
