"use client";

import Image from "next/image";
import { Product, Variant } from "@/data/products";
import { useCart } from "@/context/CartContext";

interface Props {
  product: Product | null;
  onClose: () => void;
}

function DiscountRibbon({ percent }: { percent: number }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}>
      <div
        style={{
          backgroundColor: "#1BA672",
          color: "white",
          width: 38,
          textAlign: "center",
          padding: "4px 2px 3px",
          lineHeight: 1.1,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800 }}>{percent}%</div>
        <div style={{ fontSize: 9, fontWeight: 700 }}>OFF</div>
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "19px solid #1BA672",
          borderRight: "19px solid #1BA672",
          borderBottom: "9px solid transparent",
        }}
      />
    </div>
  );
}

function VariantRow({
  variant,
  product,
  qty,
  onDelta,
}: {
  variant: Variant;
  product: Product;
  qty: number;
  onDelta: (d: number) => void;
})
 {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #E8E8E8",
        borderRadius: 12,
        padding: "12px 12px 12px 8px",
        gap: 10,
        backgroundColor: "white",
      }}
    >
      <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
        {variant.discountPercent > 0 && <DiscountRibbon percent={variant.discountPercent} />}
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={64}
          height={64}
          style={{ objectFit: "contain", width: 64, height: 64 }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#282C3F" }}>{variant.weight}</div>
      </div>

      <div style={{ width: 1, height: 44, backgroundColor: "#E8E8E8", flexShrink: 0 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            {variant.mrp > variant.price && (
              <span style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", textDecoration: "line-through" }}>
                ₹{variant.mrp}
              </span>
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: "#282C3F" }}>₹{variant.price}</span>
          </div>
          {variant.perUnit && (
            <div style={{ fontSize: 10, color: "rgba(2,6,12,0.45)", marginTop: 1 }}>{variant.perUnit}</div>
          )}
        </div>

        {product.outOfStock ? (
          <span
            style={{
              color: "#EF4444",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              padding: "4px 8px",
              backgroundColor: "#FFF0F0",
              borderRadius: 6,
              border: "1px solid #FFC9C9",
            }}
          >
            Out of Stock
          </span>
        ) : qty === 0 ? (
          <button
            onClick={() => onDelta(1)}
            style={{
              color: "#0050FF",
              fontWeight: 700,
              fontSize: 14,
              background: "none",
              border: "none",
              cursor: "pointer",
              minWidth: 40,
              padding: 0,
              letterSpacing: 0.5,
            }}
          >
            ADD
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1.5px solid #0050FF",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => onDelta(-1)}
              style={{
                width: 28,
                height: 28,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#0050FF",
                fontSize: 16,
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
                width: 24,
                textAlign: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#0050FF",
              }}
            >
              {qty}
            </span>
            <button
              onClick={() => onDelta(1)}
              style={{
                width: 28,
                height: 28,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#0050FF",
                fontSize: 16,
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
        )}
      </div>
    </div>
  );
}

export default function VariantModal({ product, onClose }: Props) {
  const { getVariantQty, updateQty } = useCart();

  if (!product) return null;

  const total = product.variants.reduce(
    (sum, v) => sum + getVariantQty(product.id, v.id) * v.price,
    0
  );

  function handleDelta(variant: Variant, d: number) {
    updateQty(product!.id, variant.id, d, {
      productId: product!.id,
      variantId: variant.id,
      productName: product!.name,
      variantWeight: variant.weight,
      price: variant.price,
      mrp: variant.mrp,
      imageUrl: product!.imageUrl,
    });
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(2,6,12,0.55)",
          zIndex: 200,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          backgroundColor: "white",
          borderRadius: "20px 20px 0 0",
          zIndex: 201,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "20px 16px 0", overflowY: "auto", flex: 1 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#282C3F",
              margin: "0 0 16px",
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
            {product.variants.map((v) => (
              <VariantRow
                key={v.id}
                variant={v}
                product={product}
                qty={getVariantQty(product.id, v.id)}
                onDelta={(d) => handleDelta(v, d)}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#0050FF",
            padding: "14px 20px",
            gap: 16,
          }}
        >
          <span style={{ flex: 1, color: "white", fontWeight: 700, fontSize: 14 }}>
            {total > 0 ? `Item total : ₹${total}` : "Select variants to add"}
          </span>
          <button
            onClick={onClose}
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: 15,
              background: "none",
              border: "none",
              cursor: "pointer",
              letterSpacing: 0.5,
            }}
          >
            {total > 0 ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </>
  );
}
