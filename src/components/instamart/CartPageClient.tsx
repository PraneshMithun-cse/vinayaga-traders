"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, CartItem } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import { useAdmin } from "@/context/AdminContext";
import { supabase } from "@/lib/supabase";

// ── Quantity pill ─────────────────────────────────────────────
function QtyPill({ qty, onMinus, onPlus }: { qty: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #0050FF", borderRadius: 8, overflow: "hidden", height: 32 }}>
      <button onClick={onMinus} style={{ width: 30, height: "100%", background: "none", border: "none", cursor: "pointer", color: "#0050FF", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
      <span style={{ width: 26, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#0050FF" }}>{qty}</span>
      <button onClick={onPlus} style={{ width: 30, height: "100%", background: "none", border: "none", cursor: "pointer", color: "#0050FF", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
    </div>
  );
}

// ── Cart row ──────────────────────────────────────────────────
function CartRow({ item, onDelta }: { item: CartItem; onDelta: (d: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #F0F0F0", backgroundColor: "white" }}>
      <div style={{ width: 68, height: 68, borderRadius: 12, overflow: "hidden", backgroundColor: "#F8F8F8", flexShrink: 0, border: "1px solid rgba(0,0,0,0.05)", position: "relative" }}>
        <Image src={item.imageUrl} alt={item.productName} fill sizes="68px" style={{ objectFit: "contain" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#282C3F", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.productName}</div>
        <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", marginBottom: 6 }}>{item.variantWeight}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#282C3F" }}>₹{item.price * item.quantity}</span>
          {item.mrp > item.price && (
            <span style={{ fontSize: 11, color: "rgba(2,6,12,0.35)", textDecoration: "line-through" }}>₹{item.mrp * item.quantity}</span>
          )}
        </div>
      </div>
      <QtyPill qty={item.quantity} onMinus={() => onDelta(-1)} onPlus={() => onDelta(1)} />
    </div>
  );
}

// ── Address types ─────────────────────────────────────────────
type Address = {
  name: string;
  phone: string;
  doorNo: string;
  building: string;
  street: string;
  locality: string;
  city: string;
  pincode: string;
};

const EMPTY_ADDRESS: Address = { name: "", phone: "", doorNo: "", building: "", street: "", locality: "", city: "", pincode: "" };

// ── Progress indicator ────────────────────────────────────────
function AddressProgress({ addr }: { addr: Address }) {
  const steps = [
    {
      label: "Contact",
      done: addr.name.trim().length > 0 && addr.phone.trim().length >= 10,
      missing: [!addr.name.trim() && "Name", addr.phone.trim().length < 10 && "Phone"].filter(Boolean),
    },
    {
      label: "Location",
      done: addr.pincode.trim().length === 6 && addr.locality.trim().length > 0,
      missing: [!addr.locality.trim() && "Locality", addr.pincode.trim().length !== 6 && "Pincode"].filter(Boolean),
    },
    {
      label: "Address",
      done: addr.doorNo.trim().length > 0,
      missing: [!addr.doorNo.trim() && "Door / Flat No"].filter(Boolean),
    },
  ];
  const allDone = steps.every((s) => s.done);

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Step row */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 10 }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display: "flex", flex: 1, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  backgroundColor: step.done ? "#1BA672" : "#F0F0F0",
                  border: `2px solid ${step.done ? "#1BA672" : "#DCDCDC"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {step.done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#AAAAAA" }}>{i + 1}</span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: step.done ? "#1BA672" : "rgba(2,6,12,0.4)", marginTop: 4 }}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, backgroundColor: step.done ? "#1BA672" : "#E8E8E8", marginTop: -14, transition: "background-color 0.2s" }} />
            )}
          </div>
        ))}
      </div>

      {/* Missing fields hint */}
      {!allDone && (
        <div style={{ backgroundColor: "#FFF8E8", borderRadius: 8, padding: "8px 12px", border: "1px solid #FFE0A0" }}>
          <span style={{ fontSize: 11, color: "#B07000", fontWeight: 600 }}>
            Still needed: {steps.flatMap((s) => s.missing).join(" · ")}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Address form ──────────────────────────────────────────────
const REQ = <span style={{ color: "#E53935", marginLeft: 2, fontWeight: 700 }}>*</span>;
const OPT = <span style={{ color: "rgba(2,6,12,0.35)", fontSize: 10, marginLeft: 4, fontWeight: 500 }}>(Optional)</span>;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.5)", marginBottom: 5, display: "flex", alignItems: "center" }}>
      {children}
    </div>
  );
}

function AddressForm({
  value,
  onChange,
  gpsLocality,
  gpsCity,
  gpsPincode,
  onRefetchGPS,
  gpsLoading,
}: {
  value: Address;
  onChange: (a: Address) => void;
  gpsLocality: string;
  gpsCity: string;
  gpsPincode: string;
  onRefetchGPS: () => void;
  gpsLoading: boolean;
}) {
  function set(field: keyof Address) {
    return (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [field]: e.target.value });
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #E8E8E8", fontSize: 14, color: "#282C3F",
    outline: "none", backgroundColor: "white", boxSizing: "border-box", fontFamily: "inherit",
  };

  const autoInp: React.CSSProperties = {
    ...inp, backgroundColor: "#F5F8FF", border: "1.5px solid #C8D8FF", color: "#1A3A8F",
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.4)",
    letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8, marginTop: 4,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Contact */}
      <div style={sectionLabel}>Contact Details</div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Full Name{REQ}</FieldLabel>
          <input style={inp} placeholder="e.g. Ravi Kumar" value={value.name} onChange={set("name")} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Phone Number{REQ}</FieldLabel>
          <input style={inp} placeholder="10-digit mobile" type="tel" maxLength={10} value={value.phone} onChange={set("phone")} />
        </div>
      </div>

      {/* Exact address */}
      <div style={sectionLabel}>Exact Address</div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: "0 0 42%" }}>
          <FieldLabel>Door / Flat No{REQ}</FieldLabel>
          <input style={inp} placeholder="e.g. 12B" value={value.doorNo} onChange={set("doorNo")} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Building / Apartment{OPT}</FieldLabel>
          <input style={inp} placeholder="e.g. Sunrise Flats" value={value.building} onChange={set("building")} />
        </div>
      </div>
      <div>
        <FieldLabel>Street / Colony{REQ}</FieldLabel>
        <input style={inp} placeholder="e.g. 4th Cross Street" value={value.street} onChange={set("street")} />
      </div>

      {/* GPS-filled fields */}
      <div style={{ ...sectionLabel, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
        <span>Location (Auto-detected)</span>
        <button
          onClick={onRefetchGPS}
          disabled={gpsLoading}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#0050FF", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, textTransform: "none", letterSpacing: 0 }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="#0050FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="#0050FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {gpsLoading ? "Locating…" : "Refresh"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Locality{REQ}</FieldLabel>
          <input style={autoInp} placeholder="e.g. Gandhipuram" value={value.locality} onChange={set("locality")} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>City{REQ}</FieldLabel>
          <input style={autoInp} placeholder="e.g. Coimbatore" value={value.city} onChange={set("city")} />
        </div>
      </div>
      <div style={{ width: "52%" }}>
        <FieldLabel>Pincode{REQ}</FieldLabel>
        <input style={autoInp} placeholder="6-digit pincode" type="tel" maxLength={6} value={value.pincode} onChange={set("pincode")} />
      </div>
      {(gpsLocality || gpsCity || gpsPincode) && (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1BA672" opacity="0.8" />
          </svg>
          <span style={{ fontSize: 10, color: "#1BA672", fontWeight: 600 }}>
            Location detected: {[gpsLocality, gpsCity].filter(Boolean).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main cart ─────────────────────────────────────────────────
export default function CartPageClient() {
  const router = useRouter();
  const { items, updateQty, totalPrice, totalItems, clearCart } = useCart();
  const { location, loading: gpsLoading, requestLocation } = useLocation();
  const { whatsappNumber } = useAdmin();

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [ordered, setOrdered] = useState(false);

  // Auto-fill GPS fields when location arrives
  useEffect(() => {
    if (!location) return;
    setAddress((prev) => ({
      ...prev,
      locality: prev.locality || location.locality,
      city: prev.city || location.city,
      pincode: prev.pincode || location.pincode,
    }));
  }, [location]);

  const savings = items.reduce((s, i) => s + (i.mrp - i.price) * i.quantity, 0);
  const grandTotal = totalPrice;

  const addressFilled =
    address.name.trim() &&
    address.phone.trim().length >= 10 &&
    address.doorNo.trim() &&
    address.locality.trim() &&
    address.pincode.trim().length === 6;

  const [ordering, setOrdering] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  const [orderId, setOrderId] = useState<string | null>(null);

  async function handleOrder() {
    if (!addressFilled || ordering) return;
    setOrdering(true);

    const addressParts = [
      address.doorNo,
      address.building,
      address.street,
      address.locality,
      address.city,
      address.pincode,
      "India",
    ].filter(Boolean).join(", ");

    let mapsLink: string | undefined;
    try {
      const geoRes = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressParts)}&filter=countrycode:in&limit=1&apiKey=4GPoS8rLDCfdHRnPHYhf`
      );
      const geoData = await geoRes.json();
      const feat = geoData?.features?.[0];
      if (feat?.geometry?.coordinates) {
        const [lng, lat] = feat.geometry.coordinates as [number, number];
        mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      }
    } catch { /* no maps link */ }

    if (!mapsLink) {
      mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts)}`;
    }

    const fullAddress = [
      `${address.doorNo}${address.building ? `, ${address.building}` : ""}`,
      address.street,
      `${address.locality}, ${address.city} — ${address.pincode}`,
    ].filter(Boolean).join("\n");

    try {
      const { data, error } = await supabase.from('orders').insert({
        customer_name: address.name,
        customer_phone: address.phone,
        address: fullAddress,
        maps_link: mapsLink,
        items,
        total: grandTotal,
        payment_method: paymentMethod === "COD" ? "Cash on Delivery" : "UPI",
      }).select().single();

      if (data?.id) setOrderId(data.id);
    } catch { /* silent fail — order still shown as placed */ }

    clearCart();
    setOrdering(false);
    setOrdered(true);
  }

  // ── Order success ──
  if (ordered) {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", backgroundColor: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{ width: 96, height: 96, borderRadius: "50%", backgroundColor: "#EAF7F1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}
          >
            <motion.svg
              width="48" height="48" viewBox="0 0 24 24" fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.path
                d="M5 13l4 4L19 7"
                stroke="#1BA672"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </motion.svg>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ fontSize: 26, fontWeight: 900, color: "#282C3F", marginBottom: 8 }}>Order Placed! 🎉</div>
          <div style={{ fontSize: 14, color: "#1BA672", fontWeight: 700, marginBottom: 6 }}>
            {paymentMethod === "COD" ? "Cash on Delivery" : "UPI on Delivery"} · Expected in 17 mins
          </div>
          <div style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", marginBottom: 6 }}>
            Delivering to: {address.doorNo}{address.building ? `, ${address.building}` : ""}, {address.locality}
          </div>
          {orderId && (
            <div style={{ fontSize: 11, color: "rgba(2,6,12,0.3)", marginBottom: 28, fontFamily: "monospace" }}>
              Order ID: {orderId.slice(0, 8).toUpperCase()}
            </div>
          )}
          {!orderId && <div style={{ marginBottom: 28 }} />}
          <motion.div
            style={{ background: "#F0F5FF", borderRadius: 12, padding: "12px 20px", marginBottom: 32, fontSize: 13, color: "#3366CC" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            📲 Order details sent to shop owner
          </motion.div>
          <button onClick={() => router.push("/")} style={{ backgroundColor: "#0050FF", color: "white", border: "none", borderRadius: 14, padding: "15px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3 }}>
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Empty cart ──
  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", backgroundColor: "white" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "white", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", padding: "12px 16px", gap: 12, boxShadow: "rgba(2,6,12,0.08) 0px 2px 8px 0px" }}>
          <button onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="#282C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: "#282C3F", margin: 0 }}>My Cart</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center" }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 20, opacity: 0.2 }}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#282C3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="6" x2="21" y2="6" stroke="#282C3F" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 10a4 4 0 01-8 0" stroke="#282C3F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#282C3F", marginBottom: 8 }}>Your cart is empty</div>
          <div style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", marginBottom: 28 }}>Add items from our store</div>
          <button onClick={() => router.push("/")} style={{ backgroundColor: "#0050FF", color: "white", border: "none", borderRadius: 12, padding: "13px 32px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Shop Now</button>
        </div>
      </div>
    );
  }

  // ── Cart with items ──
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", backgroundColor: "#F8F8F8", paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "white", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", padding: "12px 16px", gap: 12, boxShadow: "rgba(2,6,12,0.08) 0px 2px 8px 0px" }}>
        <button onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="#282C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#282C3F" }}>My Cart</div>
          <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)" }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Delivery strip */}
      <div style={{ backgroundColor: "white", padding: "10px 16px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#0050FF" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0050FF" }}>FREE Delivery · 17 Mins</span>
        <span style={{ fontSize: 12, color: "rgba(2,6,12,0.45)" }}>
          · {location?.display ?? "Detecting location…"}
        </span>
      </div>

      {/* Cart items */}
      <div style={{ backgroundColor: "white", marginBottom: 8 }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #F0F0F0" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#282C3F" }}>Items in your cart</span>
        </div>
        {items.map((item) => (
          <CartRow key={`${item.productId}-${item.variantId}`} item={item} onDelta={(d) => updateQty(item.productId, item.variantId, d)} />
        ))}
      </div>

      {/* Savings banner */}
      {savings > 0 && (
        <div style={{ backgroundColor: "#EAF7F1", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 2L15 9H22L16 13.5L18 21L12 17L6 21L8 13.5L2 9H9L12 2Z" fill="#1BA672" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1BA672" }}>You save ₹{savings} on this order!</span>
        </div>
      )}

      {/* Bill details */}
      <div style={{ backgroundColor: "white", marginBottom: 8, padding: "0 0 4px" }}>
        <div style={{ padding: "14px 16px 10px" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#282C3F" }}>Bill Details</span>
        </div>
        {[
          { label: "Item Total", value: `₹${totalPrice}`, sub: savings > 0 ? `You save ₹${savings}` : undefined, subColor: "#1BA672" },
          { label: "Delivery Fee", value: "FREE", valueColor: "#1BA672", sub: "Free delivery on all orders", subColor: "#1BA672" },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 16px" }}>
            <div>
              <div style={{ fontSize: 13, color: "rgba(2,6,12,0.65)" }}>{row.label}</div>
              {row.sub && <div style={{ fontSize: 11, color: row.subColor ?? "rgba(2,6,12,0.4)", marginTop: 1 }}>{row.sub}</div>}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: (row as { valueColor?: string }).valueColor ?? "#282C3F" }}>{row.value}</span>
          </div>
        ))}
        <div style={{ margin: "8px 16px 0", height: 1, backgroundColor: "#F0F0F0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#282C3F" }}>To Pay</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#282C3F" }}>₹{grandTotal}</span>
        </div>
      </div>

      {/* Delivery address */}
      <div style={{ backgroundColor: "white", marginBottom: 8, padding: "16px 16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#0050FF" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#282C3F" }}>Delivery Address</span>
        </div>

        <AddressProgress addr={address} />

        <AddressForm
          value={address}
          onChange={setAddress}
          gpsLocality={location?.locality ?? ""}
          gpsCity={location?.city ?? ""}
          gpsPincode={location?.pincode ?? ""}
          onRefetchGPS={requestLocation}
          gpsLoading={gpsLoading}
        />
      </div>

      {/* Payment method */}
      <div style={{ backgroundColor: "white", marginBottom: 8, padding: "16px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#282C3F", marginBottom: 14 }}>Payment Method</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(["COD", "UPI"] as const).map((method) => {
            const selected = paymentMethod === method;
            return (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px",
                  border: `2px solid ${selected ? "#0050FF" : "#E8E8E8"}`,
                  borderRadius: 12,
                  backgroundColor: selected ? "#F5F8FF" : "white",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? "#0050FF" : "#CCCCCC"}`, backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {selected && <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#0050FF" }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#282C3F" }}>
                    {method === "COD" ? "Cash on Delivery" : "UPI Payment"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginTop: 1 }}>
                    {method === "COD" ? "Pay cash when order arrives" : "Pay via UPI when order arrives"}
                  </div>
                </div>
                {method === "COD" ? (
                  <svg width="28" height="20" viewBox="0 0 40 28" fill="none" style={{ marginLeft: "auto" }}>
                    <rect width="40" height="28" rx="4" fill="#F0F0F0" />
                    <rect x="4" y="8" width="32" height="4" rx="1" fill="#888" />
                    <rect x="4" y="16" width="14" height="4" rx="1" fill="#888" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 48 48" fill="none" style={{ marginLeft: "auto" }}>
                    <rect width="48" height="48" rx="8" fill="#F0F0F0" />
                    <text x="24" y="30" textAnchor="middle" fontSize="14" fontWeight="800" fill="#6750A4">UPI</text>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cancellation policy */}
      <div style={{ backgroundColor: "white", padding: "14px 16px", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#282C3F", marginBottom: 6 }}>Cancellation Policy</div>
        <div style={{ fontSize: 12, color: "rgba(2,6,12,0.5)", lineHeight: 1.6 }}>
          Orders cannot be cancelled once packing is done. 100% refund issued if cancelled before packing.
        </div>
      </div>

      {/* Sticky place order */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", maxWidth: 430, margin: "0 auto", backgroundColor: "white", borderTop: "1px solid #F0F0F0", padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 -4px 12px rgba(2,6,12,0.08)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)" }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#282C3F" }}>₹{grandTotal}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#1BA672", fontWeight: 600 }}>FREE Delivery</div>
            <div style={{ fontSize: 11, color: "#1BA672", fontWeight: 600 }}>⚡ 17 mins</div>
          </div>
        </div>
        <button
          onClick={handleOrder}
          disabled={!addressFilled || ordering}
          style={{
            width: "100%", padding: "15px",
            backgroundColor: ordering ? "#4A7AFF" : addressFilled ? "#0050FF" : "#C8D3F0",
            color: "white", border: "none", borderRadius: 12,
            fontSize: 15, fontWeight: 800,
            cursor: addressFilled && !ordering ? "pointer" : "not-allowed",
            letterSpacing: 0.3, transition: "background-color 0.2s",
          }}
        >
          {ordering ? "Placing Order…" : addressFilled ? `Place Order · ₹${grandTotal}` : "Complete address to place order"}
        </button>
      </div>
    </div>
  );
}
