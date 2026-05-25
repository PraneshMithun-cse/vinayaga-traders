"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

const SEARCH_SUGGESTIONS = ["Toor Dal", "Turmeric", "Cashews", "Basmati Rice", "Cumin Seeds", "Besan", "Sesame Oil"];

export default function Header() {
  const [searchIdx, setSearchIdx] = useState(0);
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false);
  const router = useRouter();
  const { totalItems, totalPrice } = useCart();

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchIdx((i) => (i + 1) % SEARCH_SUGGESTIONS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div
        className="sticky top-0 z-50 bg-white w-full"
        style={{ boxShadow: "rgba(2, 6, 12, 0.08) 0px 2px 8px 0px" }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "clamp(6px, 2vw, 10px) clamp(10px, 3vw, 16px) clamp(4px, 1.5vw, 8px)",
            gap: "clamp(6px, 2vw, 10px)",
            backgroundColor: "white",
            borderBottom: "1px solid #F0F0F0",
          }}
        >
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            <Image
              src="/vinayaga-logo.png"
              alt="Vinayaga Traders"
              width={85}
              height={85}
              style={{
                objectFit: "contain",
                display: "block",
                borderRadius: 8,
                width: "clamp(60px, 18vw, 85px)",
                height: "auto",
              }}
              priority
            />
          </div>

          {/* Spacer to push controls to the right */}
          <div style={{ flex: 1 }} />

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
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6-4h6"
                stroke="#282C3F"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
                <path
                  d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                  stroke="#282C3F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="3" y1="6" x2="21" y2="6" stroke="#282C3F" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 10a4 4 0 01-8 0" stroke="#282C3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => router.push("/cart")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#0050FF",
                border: "none",
                borderRadius: 10,
                padding: "6px 10px",
                cursor: "pointer",
                flexShrink: 0,
              }}
              aria-label="View cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "white", lineHeight: 1 }}>
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "white", lineHeight: 1.2 }}>₹{totalPrice}</span>
              </div>
            </button>
          )}
        </div>

        {/* Search bar */}
        <div style={{ padding: "clamp(6px, 2vw, 8px) clamp(10px, 3vw, 16px) clamp(6px, 2vw, 10px)" }}>
          <div
            onClick={() => router.push("/search")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#F2F2F2",
              border: "1px solid #E8E8E8",
              borderRadius: 10,
              padding: "clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 12px)",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" stroke="rgba(2,6,12,0.5)" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="rgba(2,6,12,0.5)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span
              style={{
                fontSize: "clamp(12px, 3.2vw, 13px)",
                color: "rgba(2,6,12,0.45)",
                fontWeight: 500,
                userSelect: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {`Search for "${SEARCH_SUGGESTIONS[searchIdx]}"`}
            </span>
          </div>
        </div>
      </div>

      {showMyOrdersModal && <MyOrdersModal onClose={() => setShowMyOrdersModal(false)} />}
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
        .then(({ data }) => {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            backgroundColor: "white",
            borderBottom: "1px solid #F0F0F0",
          }}
        >
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
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", WebkitOverflowScrolling: "touch" }}>
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
                <div
                  key={order.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 16,
                    padding: "clamp(12px, 3.5vw, 16px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    border: "1px solid #EDEDED",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", fontFamily: "monospace", marginBottom: 2 }}>
                        ID: {order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(2,6,12,0.35)" }}>
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </div>
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
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
                          {item.productName}{" "}
                          <span style={{ color: "rgba(2,6,12,0.45)" }}>({item.variantWeight})</span> × {item.quantity}
                        </span>
                        <span style={{ fontWeight: 600, flexShrink: 0 }}>₹{item.price * item.quantity}</span>
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
