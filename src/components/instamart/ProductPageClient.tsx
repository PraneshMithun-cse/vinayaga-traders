"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product, PRODUCTS } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useAdmin } from "@/context/AdminContext";
import VariantModal from "./VariantModal";

const CAT_DESCRIPTIONS: Record<string, string> = {
  "spice-powders": "Freshly ground and packed to preserve aroma and flavour. Perfect for everyday cooking.",
  "pickle": "Traditionally made with fresh ingredients and hand-selected spices. Great with rice and rotis.",
  "dry-chips": "Sun-dried and crispy. Ideal for quick frying as a side dish or snack.",
  "spices": "Handpicked whole spices for authentic flavour. Best used fresh for maximum aroma.",
  "flour": "Stone-ground for texture and nutrition. Ideal for traditional recipes and daily cooking.",
  "pulses": "High in protein and fibre — a staple ingredient for dals, curries, and sundal.",
  "masala-bulk": "Home-style blended masala made in small batches. Rich, aromatic, and authentic.",
  "seeds": "Premium quality seeds and legumes. Fresh stock sourced directly from farmers.",
  "oil": "Quality cooking oil for healthy everyday cooking. Carefully processed and packed fresh.",
  "soya": "High-protein soya chunks. Versatile and easy to cook in curries and biryanis.",
  "millets": "Ancient grain packed with nutrients. Gluten-free and great for healthy everyday eating.",
  "sugar": "Pure and natural sweetener. Ideal for cooking, sweets, and beverages.",
};

function CartPillHeader() {
  const { totalItems, totalPrice } = useCart();
  const router = useRouter();
  if (totalItems === 0) return null;
  return (
    <button
      onClick={() => router.push("/cart")}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        backgroundColor: "#0050FF", border: "none", borderRadius: 10,
        padding: "6px 10px", cursor: "pointer", flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "white", lineHeight: 1 }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "white", lineHeight: 1.2 }}>₹{totalPrice}</span>
      </div>
    </button>
  );
}

function SuggestedCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const cheapest = product.variants.reduce((a, b) => (a.price < b.price ? a : b));
  const { getProductQty } = useCart();
  const qty = getProductQty(product.id);
  return (
    <Link href={`/product/${product.slug}`} style={{ textDecoration: "none", flexShrink: 0, width: 130 }}>
      <div style={{ backgroundColor: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #F0F0F0" }}>
        <div style={{ position: "relative", height: 110, backgroundColor: "#F8F8F8" }}>
          <Image src={product.imageUrl} alt={product.name} fill sizes="130px" style={{ objectFit: "contain", padding: 8, opacity: product.outOfStock ? 0.5 : 1 }} />
          {product.outOfStock ? (
            <div
              style={{
                position: "absolute", bottom: 6, right: 6,
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: "#EF4444",
                color: "white",
                fontSize: 8,
                fontWeight: 800,
              }}
            >
              OOS
            </div>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
              style={{
                position: "absolute", bottom: 6, right: 6,
                width: qty > 0 ? "auto" : 28, height: 28,
                minWidth: 28,
                borderRadius: qty > 0 ? 8 : 8,
                border: "1.5px solid #0050FF",
                backgroundColor: qty > 0 ? "#0050FF" : "white",
                color: qty > 0 ? "white" : "#0050FF",
                fontSize: qty > 0 ? 12 : 20, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                padding: qty > 0 ? "0 8px" : 0,
              }}
            >
              {qty > 0 ? qty : "+"}
            </button>
          )}
        </div>
        <div style={{ padding: "8px 8px 10px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#282C3F", lineHeight: 1.3, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {product.name}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#282C3F" }}>₹{cheapest.price}</div>
          {cheapest.mrp > cheapest.price && (
            <div style={{ fontSize: 10, color: "rgba(2,6,12,0.4)", textDecoration: "line-through" }}>₹{cheapest.mrp}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductPageClient({ product: rawProduct }: { product: Product }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const router = useRouter();
  const { getProductQty } = useCart();
  const { applyOverride } = useAdmin();

  const product = applyOverride(rawProduct);
  const v = product.variants[0];
  const hasDiscount = v.discountPercent > 0;
  const images = product.images.length > 0 ? product.images : [product.imageUrl];
  const productQty = getProductQty(product.id);

  const description = product.description ?? CAT_DESCRIPTIONS[product.categorySlug] ?? "Fresh quality product sourced directly. Carefully packed to retain freshness.";

  const suggested = useMemo(() => {
    return PRODUCTS
      .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
      .map(applyOverride)
      .filter((p) => !p.disabled)
      .slice(0, 10);
  }, [product.categorySlug, product.id, applyOverride]);

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", backgroundColor: "#F8F8F8", paddingBottom: 100 }}>
      {/* Sticky nav */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          backgroundColor: "white", borderBottom: "1px solid #F0F0F0",
          display: "flex", alignItems: "center", padding: "10px 16px", gap: 10,
          boxShadow: "rgba(2, 6, 12, 0.08) 0px 2px 8px 0px",
        }}
      >
        <button
          onClick={() => { if (window.history.length > 1) router.back(); else router.push("/"); }}
          style={{ background: "none", border: "none", padding: 4, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }}
          aria-label="Back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="#282C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#282C3F", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {product.name}
        </h1>
        <CartPillHeader />
      </div>

      {/* Image card */}
      <div style={{ padding: "16px 16px 0" }}>
        <div
          style={{
            backgroundColor: "white", borderRadius: 16,
            boxShadow: "0 1px 8px rgba(2,6,12,0.08)",
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 280, padding: 20,
          }}
        >
          {hasDiscount && (
            <div style={{ position: "absolute", top: 12, left: 12, backgroundColor: "#1BA672", color: "white", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 800 }}>
              {v.discountPercent}% OFF
            </div>
          )}
          <Image src={images[imgIdx]} alt={product.name} width={240} height={240} style={{ objectFit: "contain", maxHeight: 240 }} priority />
        </div>
      </div>

      {images.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "10px 0 4px" }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setImgIdx(i)} style={{ width: i === imgIdx ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i === imgIdx ? "#0050FF" : "#D4D4D4", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s" }} />
          ))}
        </div>
      )}

      {/* Product info card */}
      <div style={{ backgroundColor: "white", marginTop: 10, padding: "16px 16px 0", borderRadius: "0 0 0 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#0050FF", letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" }}>
          {product.categoryName} · Express Delivery
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#282C3F", margin: "0 0 12px", lineHeight: 1.3 }}>
          {product.name}
        </h2>

        {/* Variants row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid #F0F0F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 13, color: "rgba(2,6,12,0.55)", fontWeight: 500 }}>{v.weight}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="rgba(2,6,12,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {product.variants.length > 1 && (
            <button
              onClick={() => setModalOpen(true)}
              style={{ background: "none", border: "1px solid #E8E8E8", borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 700, color: "#0050FF", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              {product.variants.length} options
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="#0050FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Price row */}
        <div style={{ padding: "14px 0 16px", borderBottom: "1px solid #F0F0F0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#282C3F" }}>₹{v.price}</span>
            {hasDiscount && (
              <span style={{ fontSize: 14, color: "rgba(2,6,12,0.4)", textDecoration: "line-through" }}>₹{v.mrp}</span>
            )}
            {hasDiscount && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1BA672", backgroundColor: "#EAF7F1", padding: "2px 8px", borderRadius: 20 }}>
                Save ₹{v.mrp - v.price}
              </span>
            )}
          </div>
          {v.perUnit && <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginTop: 2 }}>{v.perUnit}</div>}
        </div>

        {/* Description */}
        <div style={{ padding: "14px 0 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#282C3F", marginBottom: 6 }}>About this item</div>
          <p style={{ fontSize: 13, color: "rgba(2,6,12,0.65)", lineHeight: 1.6, margin: 0 }}>{description}</p>
        </div>

        {/* Delivery info strip */}
        <div style={{ display: "flex", gap: 16, paddingBottom: 16, borderTop: "1px solid #F0F0F0", paddingTop: 14 }}>
          {[
            { icon: "⚡", label: "Express", sub: "Delivery" },
            { icon: "✓", label: "Fresh", sub: "Quality assured" },
            { icon: "↩", label: "Easy", sub: "Returns" },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#282C3F" }}>{item.label}</span>
              <span style={{ fontSize: 10, color: "rgba(2,6,12,0.45)" }}>{item.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Similar products */}
      {suggested.length > 0 && (
        <div style={{ marginTop: 10, backgroundColor: "white", padding: "16px 0 16px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#282C3F", paddingLeft: 16, marginBottom: 12 }}>
            More from {product.categoryName}
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingLeft: 16, paddingRight: 16, scrollbarWidth: "none" }}>
            {suggested.map((p) => (
              <SuggestedCard key={p.id} product={p} onAdd={() => setActiveProduct(p)} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky ADD button */}
      <div
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, backgroundColor: "white",
          borderTop: "1px solid #F0F0F0", padding: "12px 16px",
          boxShadow: "0 -4px 12px rgba(2,6,12,0.08)", zIndex: 40,
          display: "flex", gap: 10,
        }}
      >
        {product.outOfStock ? (
          <button
            disabled
            style={{
              flex: 1, padding: "14px",
              backgroundColor: "#EAEAEA", color: "#EF4444",
              border: "1px solid #FFD3D3", borderRadius: 12,
              fontSize: 15, fontWeight: 800, cursor: "not-allowed", letterSpacing: 0.5,
            }}
          >
            OUT OF STOCK
          </button>
        ) : (
          <>
            {productQty > 0 && (
              <Link
                href="/cart"
                style={{
                  flex: "0 0 auto", padding: "14px 20px",
                  backgroundColor: "#F0F4FF", color: "#0050FF",
                  border: "1.5px solid #0050FF", borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#0050FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="3" y1="6" x2="21" y2="6" stroke="#0050FF" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M16 10a4 4 0 01-8 0" stroke="#0050FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Cart ({productQty})
              </Link>
            )}
            <button
              onClick={() => setModalOpen(true)}
              style={{
                flex: 1, padding: "14px",
                backgroundColor: "#0050FF", color: "white",
                border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
              }}
            >
              {productQty > 0 ? "Add More" : "ADD TO CART"}
            </button>
          </>
        )}
      </div>

      <VariantModal product={modalOpen ? product : null} onClose={() => setModalOpen(false)} />
      <VariantModal product={activeProduct} onClose={() => setActiveProduct(null)} />
    </div>
  );
}
