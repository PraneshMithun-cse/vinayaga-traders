"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  layout?: "horizontal" | "grid";
  onAdd: (product: Product) => void;
}

// Shared pill component — "+" when empty, "− qty +" when in cart
function CartPill({
  qty,
  onTap,
  onMinus,
  size = "md",
}: {
  qty: number;
  onTap: (e: React.MouseEvent) => void;
  onMinus?: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? 30 : 34;
  const btnW = size === "sm" ? 26 : 30;
  const qtyW = size === "sm" ? 20 : 24;
  const fs = size === "sm" ? 14 : 16;
  const plusFs = size === "sm" ? 13 : 15;

  if (qty === 0) {
    return (
      <button
        onClick={onTap}
        aria-label="Add to cart"
        style={{
          width: h,
          height: h,
          borderRadius: 9,
          border: "2px solid #0050FF",
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      >
        <svg width={plusFs} height={plusFs} viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="#0050FF" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "2px solid #0050FF",
        borderRadius: 9,
        backgroundColor: "white",
        overflow: "hidden",
        boxShadow: "0 2px 6px rgba(0,80,255,0.2)",
        flexShrink: 0,
        height: h,
      }}
    >
      <button
        onClick={onMinus ?? onTap}
        style={{
          width: btnW,
          height: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#0050FF",
          fontSize: fs,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        −
      </button>
      <span
        style={{
          width: qtyW,
          textAlign: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#0050FF",
        }}
      >
        {qty}
      </span>
      <button
        onClick={onTap}
        style={{
          width: btnW,
          height: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#0050FF",
          fontSize: fs,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        +
      </button>
    </div>
  );
}

export default function ProductCard({ product, layout = "horizontal", onAdd }: ProductCardProps) {
  const v = product.variants[0];
  const hasDiscount = v.discountPercent > 0;
  const isGrid = layout === "grid";
  const { getProductQty, updateQty } = useCart();
  const cartQty = getProductQty(product.id);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onAdd(product);
  }

  function handleMinus(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    updateQty(product.id, v.id, -1);
  }

  if (isGrid) {
    return (
      <div style={{ backgroundColor: "white", display: "flex", flexDirection: "column" }}>
        <Link href={`/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: 16, overflow: "hidden", backgroundColor: "#F8F8F8", marginBottom: 12, border: "1px solid rgba(0,0,0,0.04)" }}>
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 430px) 50vw, 33vw"
              style={{ objectFit: "cover", opacity: product.outOfStock ? 0.5 : 1 }}
            />
            {product.outOfStock ? (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "#EF4444",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "4px 8px",
                  borderRadius: 6,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                OUT OF STOCK
              </div>
            ) : (
              <div style={{ position: "absolute", top: 8, right: 8 }}>
                <CartPill qty={cartQty} onTap={handleAdd} onMinus={handleMinus} size="md" />
              </div>
            )}
          </div>

          <div style={{ padding: "8px 10px 12px" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#282C3F",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
                lineHeight: 1.35,
                marginBottom: 3,
              }}
            >
              {product.name}
            </div>
            {product.description && (
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(2,6,12,0.45)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                  marginBottom: 6,
                  lineHeight: 1.3,
                }}
              >
                {product.description}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: hasDiscount ? 4 : 0 }}>
              <span style={{ fontSize: 11, color: "rgba(2,6,12,0.55)", fontWeight: 500 }}>{v.weight}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="rgba(2,6,12,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {hasDiscount && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1BA672", marginBottom: 2 }}>
                {v.discountPercent}% OFF
              </div>
            )}
            {hasDiscount && (
              <div style={{ borderTop: "1px dashed #E2E2E7", marginBottom: 4 }} />
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#282C3F" }}>₹{v.price}</span>
              {hasDiscount && (
                <span style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", textDecoration: "line-through" }}>
                  ₹{v.mrp}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Horizontal layout
  return (
    <div style={{ width: 156, flexShrink: 0, backgroundColor: "white" }}>
      <Link href={`/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ position: "relative", width: 156, height: 156, borderRadius: 16, overflow: "hidden", backgroundColor: "#F8F8F8", border: "1px solid rgba(0,0,0,0.04)", marginBottom: 12 }}>
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="156px"
            style={{ objectFit: "cover", opacity: product.outOfStock ? 0.5 : 1 }}
          />
          {product.outOfStock ? (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "#EF4444",
                color: "white",
                fontSize: 8,
                fontWeight: 800,
                padding: "3px 6px",
                borderRadius: 4,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              OUT OF STOCK
            </div>
          ) : (
            <div style={{ position: "absolute", top: 8, right: 8 }}>
              <CartPill qty={cartQty} onTap={handleAdd} onMinus={handleMinus} size="sm" />
            </div>
          )}
          {product.badge && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "rgba(2,6,12,0.7)",
                color: "white",
                fontSize: 9,
                fontWeight: 600,
                padding: "3px 5px",
                borderRadius: "8px 0 0 0",
              }}
            >
              {product.badge}
            </div>
          )}
        </div>

        <div style={{ padding: "0 4px" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#282C3F",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
              lineHeight: 1.3,
              marginBottom: 4,
            }}
          >
            {product.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: hasDiscount ? 4 : 0 }}>
            <span style={{ fontSize: 11, color: "rgba(2,6,12,0.55)", fontWeight: 500 }}>{v.weight}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="rgba(2,6,12,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {hasDiscount && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1BA672", marginBottom: 2 }}>
                {v.discountPercent}% OFF
              </div>
              <div style={{ borderTop: "1px dashed #E2E2E7", marginBottom: 4 }} />
            </>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#282C3F" }}>₹{v.price}</span>
            {hasDiscount && (
              <span style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", textDecoration: "line-through" }}>
                ₹{v.mrp}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
