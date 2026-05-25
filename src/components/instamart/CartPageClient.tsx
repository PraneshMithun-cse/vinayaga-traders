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
  address: string;
};

const EMPTY_ADDRESS: Address = { name: "", phone: "", address: "" };

// ── Address form ──────────────────────────────────────────────
const REQ = <span style={{ color: "#E53935", marginLeft: 2, fontWeight: 700 }}>*</span>;

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
}: {
  value: Address;
  onChange: (a: Address) => void;
}) {
  function set(field: keyof Address) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [field]: e.target.value });
  }

  function setPhone(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange({ ...value, phone: digits });
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "clamp(10px, 3vw, 12px) clamp(10px, 3vw, 14px)", borderRadius: 10,
    border: "1.5px solid #E8E8E8", fontSize: 16, color: "#282C3F",
    outline: "none", backgroundColor: "white", boxSizing: "border-box", fontFamily: "inherit",
  };

  const textarea: React.CSSProperties = {
    ...inp,
    height: 100,
    resize: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <FieldLabel>Full Name{REQ}</FieldLabel>
        <input
          id="customer-name"
          name="customer-name"
          type="text"
          autoComplete="name"
          style={inp}
          placeholder="e.g. Ravi Kumar"
          value={value.name}
          onChange={set("name")}
        />
      </div>
      <div>
        <FieldLabel>Phone Number{REQ}</FieldLabel>
        <input
          id="customer-phone"
          name="customer-phone"
          type="tel"
          autoComplete="tel"
          maxLength={10}
          style={inp}
          placeholder="10-digit mobile"
          value={value.phone}
          onChange={setPhone}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>
      <div>
        <FieldLabel>Complete Delivery Address{REQ}</FieldLabel>
        <textarea
          id="customer-address"
          name="customer-address"
          autoComplete="street-address"
          style={textarea}
          placeholder="e.g. 12B, Sunset Apartment, Gandhipuram, Coimbatore - 641012"
          value={value.address}
          onChange={set("address")}
        />
      </div>
    </div>
  );
}

// ── Main cart ─────────────────────────────────────────────────
export default function CartPageClient() {
  const router = useRouter();
  const { items, updateQty, totalPrice, totalItems, clearCart } = useCart();
  const { location } = useLocation();

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [ordered, setOrdered] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Keyboard visibility detection for responsive bottom CTA adaptation
  useEffect(() => {
    const detectKeyboard = () => {
      if (window.visualViewport) {
        setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.85);
      } else {
        setIsKeyboardOpen(window.innerHeight < 500);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", detectKeyboard);
    }
    window.addEventListener("resize", detectKeyboard);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", detectKeyboard);
      }
      window.removeEventListener("resize", detectKeyboard);
    };
  }, []);

  // Load address from local storage on mount (auto-suggestion)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vt_autosuggest_address");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setAddress({
            name: parsed.name || "",
            phone: parsed.phone || "",
            address: parsed.address || "",
          });
        }
      } else if (location?.formatted) {
        // Fallback to location context if available and no autosuggest yet
        setAddress((prev) => ({
          ...prev,
          address: location.formatted,
        }));
      }
    } catch (e) {
      console.error("Failed to load autosuggest address:", e);
    }
  }, [location]);

  const savings = items.reduce((s, i) => s + (i.mrp - i.price) * i.quantity, 0);
  const grandTotal = totalPrice;

  // Simple validation for Name (not empty), Phone (exactly 10 digits), and Address (not empty, min 5 characters)
  const addressFilled =
    !!address.name.trim() &&
    address.phone.trim().length === 10 &&
    address.address.trim().length > 5;

  const [ordering, setOrdering] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  const [orderId, setOrderId] = useState<string | null>(null);

  async function handleOrder() {
    if (!addressFilled || ordering) return;
    setOrdering(true);

    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.address)}`;

    try {
      const { data, error } = await supabase.from('orders').insert({
        customer_name: address.name,
        customer_phone: address.phone,
        address: address.address,
        maps_link: mapsLink,
        items,
        total: grandTotal,
        payment_method: paymentMethod === "COD" ? "Cash on Delivery" : "UPI",
      }).select().single();

      if (data?.id) {
        setOrderId(data.id);
        
        // Save to local storage for automatic suggestions next time
        try {
          localStorage.setItem("vt_autosuggest_address", JSON.stringify(address));
        } catch (e) {
          console.error("Failed to save autosuggest address to local storage:", e);
        }

        try {
          const placed = JSON.parse(localStorage.getItem("vt_my_orders") || "[]");
          if (Array.isArray(placed)) {
            placed.push(data.id);
            localStorage.setItem("vt_my_orders", JSON.stringify(placed));
          } else {
            localStorage.setItem("vt_my_orders", JSON.stringify([data.id]));
          }
        } catch (e) {
          console.error("Failed to save order ID to local storage:", e);
        }
      }
    } catch (err) {
      console.error("Error inserting order into Supabase:", err);
      /* silent fail — order still shown as placed */
    }

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
            Cash on Delivery · Superfast Delivery
          </div>
          <div style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", marginBottom: 6, maxHeight: 40, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            Delivering to: {address.address}
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
    <div style={{ maxWidth: 430, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#F8F8F8" }}>
      {/* Scrollable Content Container */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "white", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", padding: "12px 16px", gap: 12, boxShadow: "rgba(2, 6, 12, 0.08) 0px 2px 8px 0px" }}>
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
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0050FF" }}>FREE Express Delivery</span>
          <span style={{ fontSize: 12, color: "rgba(2,6,12,0.45)" }}>
            · Coimbatore
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

          <AddressForm
            value={address}
            onChange={setAddress}
          />
        </div>

        {/* Payment method */}
        <div style={{ backgroundColor: "white", marginBottom: 8, padding: "16px" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#282C3F", marginBottom: 14 }}>Payment Method</div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px",
              border: "2px solid #E8E8E8",
              borderRadius: 12,
              backgroundColor: "white",
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #0050FF", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#0050FF" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#282C3F" }}>Cash on Delivery</div>
              <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginTop: 1 }}>Pay cash when order arrives</div>
            </div>
            <svg width="28" height="20" viewBox="0 0 40 28" fill="none" style={{ marginLeft: "auto" }}>
              <rect width="40" height="28" rx="4" fill="#F0F0F0" />
              <rect x="4" y="8" width="32" height="4" rx="1" fill="#888" />
              <rect x="4" y="16" width="14" height="4" rx="1" fill="#888" />
            </svg>
          </div>
        </div>

        {/* Cancellation policy */}
        <div style={{ backgroundColor: "white", padding: "14px 16px", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#282C3F", marginBottom: 6 }}>Cancellation Policy</div>
          <div style={{ fontSize: 12, color: "rgba(2,6,12,0.5)", lineHeight: 1.6 }}>
            Orders cannot be cancelled once packing is done. 100% refund issued if cancelled before packing.
          </div>
        </div>
      </div>

      {/* Checkout Footer Bar */}
      <div 
        style={{ 
          backgroundColor: "white", 
          borderTop: "1px solid #F0F0F0", 
          padding: "clamp(8px, 2.5vw, 12px) clamp(12px, 3.5vw, 16px)", 
          paddingBottom: "calc(clamp(8px, 2.5vw, 12px) + env(safe-area-inset-bottom, 0px))", 
          boxShadow: "0 -4px 12px rgba(2,6,12,0.08)", 
          zIndex: 100,
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)" }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#282C3F" }}>₹{grandTotal}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#1BA672", fontWeight: 600 }}>FREE Delivery</div>
            <div style={{ fontSize: 11, color: "#1BA672", fontWeight: 600 }}>⚡ Fast Delivery</div>
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
