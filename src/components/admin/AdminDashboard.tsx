"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAdmin, ProductOverride } from "@/context/AdminContext";
import { PRODUCTS, Product, Variant, CATEGORY_SLUGS } from "@/data/products";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  "spice-powders": "Spice Powders",
  "pickle": "Pickle",
  "dry-chips": "Dry Chips & Vathal",
  "spices": "Spices",
  "flour": "Flour & Rava",
  "pulses": "Pulses & Dal",
  "masala-bulk": "Masala (Bulk)",
  "seeds": "Seeds & Samiya",
  "oil": "Oil",
  "soya": "Soya",
  "millets": "Millets",
  "sugar": "Sugar & Jaggery",
};

// ─────────────────────────────────────────────────────────────
// Shared UI atoms
// ─────────────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontSize: 10, fontWeight: 700, color, backgroundColor: bg, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{label}</span>;
}

function Toggle({ on, onChange, color = "#1BA672" }: { on: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? color : "#D1D5DB", position: "relative", cursor: "pointer", transition: "background-color 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", backgroundColor: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

const INP: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E8E8E8",
  fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", backgroundColor: "white",
};

// ─────────────────────────────────────────────────────────────
// Image upload button (file → base64 data URL)
// ─────────────────────────────────────────────────────────────
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      <div
        style={{
          width: 64, height: 64, borderRadius: 10, border: "2px dashed #D1D5DB",
          backgroundColor: "#F8F8F8", overflow: "hidden", flexShrink: 0,
          position: "relative", cursor: "pointer",
        }}
        onClick={() => fileRef.current?.click()}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 2 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" /><polyline points="17 8 12 3 7 8" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="3" x2="12" y2="15" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" /></svg>
            <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600 }}>UPLOAD</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ display: "block", width: "100%", padding: "8px 12px", backgroundColor: "#EEF2FF", color: "#0050FF", border: "1px solid #C7D7FF", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 6 }}
        >
          Choose Image
        </button>
        <input
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="or paste image URL"
          style={{ ...INP, fontSize: 12, padding: "7px 10px" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dynamic variant rows (used in both Add and Edit)
// ─────────────────────────────────────────────────────────────
type DraftVariant = { weight: string; price: string; mrp: string };

function VariantRows({ variants, onChange }: { variants: DraftVariant[]; onChange: (v: DraftVariant[]) => void }) {
  function update(i: number, field: keyof DraftVariant, val: string) {
    const next = variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v);
    onChange(next);
  }
  function add() { onChange([...variants, { weight: "", price: "", mrp: "" }]); }
  function remove(i: number) { onChange(variants.filter((_, idx) => idx !== i)); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.5)" }}>VARIANTS *</span>
        <button type="button" onClick={add} style={{ fontSize: 12, fontWeight: 700, color: "#0050FF", background: "none", border: "1px solid #0050FF", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
          + Add Variant
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {variants.map((v, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "nowrap" }}>
              <input style={{ ...INP, flex: 2, minWidth: 70 }} placeholder="Weight (100g)" value={v.weight} onChange={(e) => update(i, "weight", e.target.value)} />
              <input style={{ ...INP, flex: 1, minWidth: 50 }} type="number" placeholder="Price ₹" value={v.price} onChange={(e) => update(i, "price", e.target.value)} />
              <input style={{ ...INP, flex: 1, minWidth: 50 }} type="number" placeholder="MRP ₹" value={v.mrp} onChange={(e) => update(i, "mrp", e.target.value)} />
            </div>
            {variants.length > 1 && (
              <button type="button" onClick={() => remove(i)} style={{ width: 28, height: 28, borderRadius: 6, background: "#FEF2F2", border: "none", color: "#B91C1C", cursor: "pointer", fontSize: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Variant editor for existing product (incl. extra variants)
// ─────────────────────────────────────────────────────────────
function ExistingVariantEditor({ productId, variant, isExtra }: { productId: string; variant: Variant; isExtra?: boolean }) {
  const { setVariantOverride, removeExtraVariant, overrides } = useAdmin();
  const vo = overrides[productId]?.variants?.[variant.id] ?? {};
  const [price, setPrice] = useState(String(vo.price ?? variant.price));
  const [mrp, setMrp] = useState(String(vo.mrp ?? variant.mrp));
  const [weight, setWeight] = useState(vo.weight ?? variant.weight);

  function save() {
    const p = parseFloat(price);
    const m = parseFloat(mrp);
    if (!isNaN(p) && !isNaN(m)) setVariantOverride(productId, variant.id, { price: p, mrp: m, weight });
  }

  return (
    <div style={{ backgroundColor: "#F8F8F8", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 80px", minWidth: 70 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(2,6,12,0.45)", marginBottom: 3 }}>WEIGHT</div>
          <input value={weight} onChange={(e) => setWeight(e.target.value)} style={{ ...INP, padding: "7px 8px" }} />
        </div>
        <div style={{ flex: "1 1 60px", minWidth: 55 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(2,6,12,0.45)", marginBottom: 3 }}>PRICE ₹</div>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ ...INP, padding: "7px 8px" }} />
        </div>
        <div style={{ flex: "1 1 60px", minWidth: 55 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(2,6,12,0.45)", marginBottom: 3 }}>MRP ₹</div>
          <input type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} style={{ ...INP, padding: "7px 8px" }} />
        </div>
        <button onClick={save} style={{ padding: "8px 12px", backgroundColor: "#0050FF", color: "white", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save</button>
        {isExtra && (
          <button onClick={() => removeExtraVariant(productId, variant.id)} style={{ padding: "8px 10px", backgroundColor: "#FEF2F2", color: "#B91C1C", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Remove</button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Product row (expandable)
// ─────────────────────────────────────────────────────────────
function ProductRow({ product }: { product: Product & { outOfStock?: boolean; disabled?: boolean } }) {
  const { setOverride, addExtraVariant, overrides, removeNewProduct, newProducts } = useAdmin();
  const [open, setOpen] = useState(false);
  const [imgVal, setImgVal] = useState(product.imageUrl);
  const ov = overrides[product.id] ?? {};
  const isNew = newProducts.some((p) => p.id === product.id);
  const extraVariants = ov.extraVariants ?? [];

  function addVariant() {
    const id = `${product.id}-extra-${Date.now()}`;
    addExtraVariant(product.id, { id, weight: "New", price: 0, mrp: 0, discountPercent: 0 });
  }

  function toggleOOS(e: React.MouseEvent) {
    e.stopPropagation();
    setOverride(product.id, { outOfStock: !product.outOfStock });
  }

  return (
    <div style={{ backgroundColor: "white", borderRadius: 12, marginBottom: 8, overflow: "hidden", border: `1px solid ${product.outOfStock ? "#FCD34D" : product.disabled ? "#FECACA" : "#E8E8E8"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
        <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", backgroundColor: "#F8F8F8", flexShrink: 0, position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#282C3F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
          <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginTop: 1 }}>{CATEGORY_LABELS[product.categorySlug] ?? product.categorySlug}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            {product.disabled && <Badge label="HIDDEN" color="#B91C1C" bg="#FEF2F2" />}
            {product.outOfStock && !product.disabled && <Badge label="OUT OF STOCK" color="#92400E" bg="#FEF3C7" />}
            {!product.disabled && !product.outOfStock && <Badge label="ACTIVE" color="#166534" bg="#DCFCE7" />}
            {isNew && <Badge label="NEW" color="#1D4ED8" bg="#DBEAFE" />}
            <Badge label={`${product.variants.length} var`} color="#6B7280" bg="#F3F4F6" />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#282C3F" }}>₹{product.variants[0]?.price ?? 0}</div>
            <div style={{ fontSize: 10, color: "rgba(2,6,12,0.4)" }}>{product.variants[0]?.weight}</div>
          </div>
          <button
            onClick={toggleOOS}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              backgroundColor: product.outOfStock ? "#D97706" : "#FEF3C7",
              color: product.outOfStock ? "white" : "#92400E",
            }}
          >
            {product.outOfStock ? "In Stock" : "Out of Stock"}
          </button>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid #F0F0F0", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Toggles */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <Toggle on={!product.disabled} onChange={(v) => setOverride(product.id, { disabled: !v })} color="#1BA672" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Visible in store</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <Toggle on={!!product.outOfStock} onChange={(v) => setOverride(product.id, { outOfStock: v })} color="#F59E0B" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Out of Stock</span>
            </label>
          </div>

          {/* Image */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.5)", marginBottom: 8 }}>PRODUCT IMAGE</div>
            <ImageUpload value={imgVal} onChange={(url) => { setImgVal(url); setOverride(product.id, { imageUrl: url }); }} />
          </div>

          {/* Variants */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.5)" }}>VARIANTS & PRICING</span>
              <button onClick={addVariant} style={{ fontSize: 12, fontWeight: 700, color: "#0050FF", background: "none", border: "1px solid #0050FF", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                + Add Variant
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {product.variants.filter((v) => !extraVariants.find((e) => e.id === v.id)).map((v) => (
                <ExistingVariantEditor key={v.id} productId={product.id} variant={v} />
              ))}
              {extraVariants.map((v) => (
                <ExistingVariantEditor key={v.id} productId={product.id} variant={v} isExtra />
              ))}
            </div>
          </div>

          {isNew && (
            <button onClick={() => removeNewProduct(product.id)} style={{ padding: "10px", backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Delete Product
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Add Product
// ─────────────────────────────────────────────────────────────
function AddProductPanel() {
  const { addProduct } = useAdmin();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("spice-powders");
  const [imageUrl, setImageUrl] = useState("");
  const [variants, setVariants] = useState<DraftVariant[]>([{ weight: "", price: "", mrp: "" }]);
  const [done, setDone] = useState(false);

  function handleAdd() {
    if (!name.trim() || !variants[0].weight || !variants[0].price) return;
    const id = `admin-${Date.now()}`;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const builtVariants: Variant[] = variants
      .filter((v) => v.weight && v.price)
      .map((v, i) => {
        const price = parseFloat(v.price) || 0;
        const mrp = parseFloat(v.mrp) || price;
        return { id: `${id}-v${i + 1}`, weight: v.weight, price, mrp, discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0 };
      });

    const defaultImg = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80";
    addProduct({
      id, slug, name,
      imageUrl: imageUrl || defaultImg,
      images: [imageUrl || defaultImg],
      categorySlug: category,
      categoryName: CATEGORY_LABELS[category] ?? category,
      deliveryMins: 17,
      variants: builtVariants,
    });
    setName(""); setCategory("spice-powders"); setImageUrl("");
    setVariants([{ weight: "", price: "", mrp: "" }]);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  const inpL: React.CSSProperties = { ...INP, padding: "12px 14px", fontSize: 14 };

  return (
    <div style={{ backgroundColor: "white", borderRadius: 12, padding: 20, border: "1px solid #E8E8E8" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#282C3F", marginBottom: 18 }}>Add New Product</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.5)", display: "block", marginBottom: 5 }}>PRODUCT NAME *</label>
          <input style={inpL} placeholder="e.g. Nattu Ellu" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.5)", display: "block", marginBottom: 5 }}>CATEGORY *</label>
          <select style={{ ...inpL, backgroundColor: "white" }} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_SLUGS.map((s) => <option key={s} value={s}>{CATEGORY_LABELS[s] ?? s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.5)", display: "block", marginBottom: 8 }}>PRODUCT IMAGE</label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>
        <VariantRows variants={variants} onChange={setVariants} />
        {done && <div style={{ backgroundColor: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", fontWeight: 700 }}>Product added!</div>}
        <button onClick={handleAdd} style={{ padding: "14px", backgroundColor: "#0050FF", color: "white", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          Add Product
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bulk Actions
// ─────────────────────────────────────────────────────────────
function BulkActions() {
  const { setOverride, newProducts, importedProducts, resetToDefault } = useAdmin();
  const [confirm, setConfirm] = useState<string | null>(null);
  const allProducts = [...(importedProducts ?? PRODUCTS), ...newProducts];

  function bulkSet(patch: ProductOverride) {
    allProducts.forEach((p) => setOverride(p.id, patch));
    setConfirm(null);
  }

  const actions = [
    { key: "enable-all", label: "Enable All Products", desc: "Make all products visible in store", color: "#166534", bg: "#DCFCE7", patch: { disabled: false } },
    { key: "disable-all", label: "Disable All Products", desc: "Hide all products from store", color: "#B91C1C", bg: "#FEF2F2", patch: { disabled: true } },
    { key: "oos-all", label: "Mark All Out of Stock", desc: "Show products but mark unavailable", color: "#92400E", bg: "#FEF3C7", patch: { outOfStock: true } },
    { key: "in-stock-all", label: "Mark All In Stock", desc: "Remove out-of-stock flag from all", color: "#1D4ED8", bg: "#DBEAFE", patch: { outOfStock: false } },
  ];

  const [resetConfirm, setResetConfirm] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#282C3F", marginBottom: 4 }}>Bulk Actions</div>

      {/* Reset to default */}
      <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #E8E8E8", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#282C3F" }}>Reset to Default Products</div>
            <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", marginTop: 2 }}>Clear Excel import and use the current product catalog (152 products with correct prices)</div>
          </div>
          {resetConfirm ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setResetConfirm(false)} style={{ padding: "7px 14px", backgroundColor: "#F4F4F4", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { resetToDefault(); setResetConfirm(false); }} style={{ padding: "7px 14px", backgroundColor: "#D97706", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Confirm Reset</button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ padding: "8px 16px", backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Reset</button>
          )}
        </div>
      </div>

      {actions.map((a) => (
        <div key={a.key} style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #E8E8E8", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#282C3F" }}>{a.label}</div>
              <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", marginTop: 2 }}>{a.desc}</div>
            </div>
            {confirm === a.key ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirm(null)} style={{ padding: "7px 14px", backgroundColor: "#F4F4F4", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => bulkSet(a.patch)} style={{ padding: "7px 14px", backgroundColor: a.color, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Confirm</button>
              </div>
            ) : (
              <button onClick={() => setConfirm(a.key)} style={{ padding: "8px 16px", backgroundColor: a.bg, color: a.color, border: `1px solid ${a.color}30`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Run</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WhatsApp Settings
// ─────────────────────────────────────────────────────────────
function WhatsAppSettings() {
  const { whatsappNumber, setWhatsappNumber } = useAdmin();
  const [draftNum, setDraftNum] = useState(whatsappNumber);
  const [saved, setSaved] = useState(false);
  const [waStatus, setWaStatus] = useState<"unknown" | "connected" | "disconnected" | "qr">("unknown");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const res = await fetch("/api/notify");
        const d = await res.json() as { connected?: boolean; ready?: boolean; hasQR?: boolean };
        const connected = d.connected ?? d.ready ?? false;

        if (connected) {
          setWaStatus("connected");
          setQrImage(null);
          return;
        }

        if (d.hasQR) {
          const qrRes = await fetch("/api/notify?action=qr");
          const qd = await qrRes.json() as { qr?: string; connected?: boolean };
          if (qd.connected) { setWaStatus("connected"); setQrImage(null); }
          else if (qd.qr) { setWaStatus("qr"); setQrImage(qd.qr); }
        } else {
          setWaStatus("disconnected");
          setQrImage(null);
        }
      } catch {
        setWaStatus("disconnected");
      }
    }

    poll();
    timer = setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, []);

  function save() {
    const num = draftNum.replace(/\D/g, "");
    if (num.length < 10) return;
    setWhatsappNumber(num);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function sendTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "✅ Vinayaga Traders — WhatsApp connected via Baileys! Orders will arrive here automatically.",
          phone: draftNum.replace(/\D/g, ""),
        }),
      });
      const d = await res.json() as { ok?: boolean; error?: string };
      setTestResult(d.ok ? "success" : `failed: ${d.error ?? "server error"}`);
    } catch {
      setTestResult("failed: cannot reach WA server");
    }
    setTesting(false);
  }

  const statusColor = waStatus === "connected" ? "#22C55E" : waStatus === "qr" ? "#F59E0B" : waStatus === "disconnected" ? "#EF4444" : "#D1D5DB";
  const statusText = waStatus === "connected" ? "Connected ✓" : waStatus === "qr" ? "Scan QR Code" : waStatus === "disconnected" ? "Not running" : "Checking…";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Server status */}
      <div style={{ backgroundColor: "white", borderRadius: 12, padding: 20, border: "1px solid #E8E8E8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.554 4.107 1.523 5.827L0 24l6.338-1.492A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.375l-.36-.213-3.727.877.892-3.625-.235-.373A9.818 9.818 0 112 12c0-5.415 4.403-9.818 9.818-9.818h.182C17.597 2.182 22 6.585 22 12s-4.403 9.818-9.818 9.818z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#282C3F" }}>WhatsApp Bot (Baileys)</div>
            <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", marginTop: 1 }}>No puppeteer · No browser · Pure WebSocket</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColor }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{statusText}</span>
          </div>
        </div>

        {/* QR Code display */}
        {waStatus === "qr" && qrImage && (
          <div style={{ textAlign: "center", marginBottom: 18, padding: "20px", backgroundColor: "#FFFBEB", borderRadius: 12, border: "2px dashed #F59E0B" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 12 }}>
              📱 Open WhatsApp → Linked Devices → Link a Device → Scan this QR
            </div>
            <img src={qrImage} alt="WhatsApp QR Code" style={{ width: 200, height: 200, borderRadius: 8, border: "4px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }} />
            <div style={{ fontSize: 11, color: "#92400E", marginTop: 10 }}>QR refreshes automatically · Scan within 60 seconds</div>
          </div>
        )}

        {waStatus === "connected" && (
          <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>WhatsApp Connected!</div>
              <div style={{ fontSize: 11, color: "#15803D" }}>All new orders will be auto-sent to your WhatsApp</div>
            </div>
          </div>
        )}

        {waStatus === "disconnected" && (
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 4 }}>Server not running</div>
            <div style={{ fontSize: 12, color: "#B91C1C" }}>Start the WhatsApp server to receive orders</div>
          </div>
        )}

        {/* Phone number */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.5)", marginBottom: 6 }}>ORDER NOTIFICATIONS NUMBER</div>
          <input
            value={draftNum}
            onChange={(e) => setDraftNum(e.target.value)}
            placeholder="919655566602"
            type="tel"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 15, color: "#282C3F", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
          <div style={{ fontSize: 11, color: "rgba(2,6,12,0.4)", marginTop: 4 }}>Include country code (e.g. 919655566602 for +91 96555 66602)</div>
        </div>

        {saved && <div style={{ backgroundColor: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", fontWeight: 700, marginBottom: 12 }}>✓ Saved!</div>}
        {testResult && (
          <div style={{ backgroundColor: testResult === "success" ? "#DCFCE7" : "#FEF2F2", border: `1px solid ${testResult === "success" ? "#86EFAC" : "#FECACA"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: testResult === "success" ? "#166534" : "#B91C1C", fontWeight: 600, marginBottom: 12 }}>
            {testResult === "success" ? "✅ Test sent! Check WhatsApp." : `❌ ${testResult}`}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} style={{ flex: 1, padding: "12px", backgroundColor: "#25D366", color: "white", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            Save Number
          </button>
          <button onClick={sendTest} disabled={testing || waStatus !== "connected"} style={{ flex: 1, padding: "12px", backgroundColor: waStatus === "connected" ? "#0050FF" : "#D1D5DB", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: waStatus === "connected" ? "pointer" : "not-allowed" }}>
            {testing ? "Sending…" : "Send Test"}
          </button>
        </div>
      </div>

      {/* How to start */}
      <div style={{ backgroundColor: "white", borderRadius: 12, padding: 20, border: "1px solid #E8E8E8" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#282C3F", marginBottom: 14 }}>Start WhatsApp Bot</div>
        <div style={{ backgroundColor: "#1E1E1E", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
          <code style={{ fontSize: 13, color: "#4ADE80", fontFamily: "monospace" }}>node baileys-server.mjs</code>
        </div>
        {[
          { n: "1", text: "Open terminal in project folder and run command above" },
          { n: "2", text: "If QR appears here in admin panel, scan with WhatsApp on your phone" },
          { n: "3", text: "Session saves to auth_info_baileys/ — next start is instant" },
          { n: "4", text: "Use PM2 (npm install -g pm2) for auto-start on Mac boot" },
        ].map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#25D366", color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{s.n}</div>
            <div style={{ fontSize: 13, color: "rgba(2,6,12,0.65)", lineHeight: 1.5 }}>{s.text}</div>
          </div>
        ))}
        <div style={{ backgroundColor: "#ECFDF5", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#065F46", fontWeight: 600 }}>
          Baileys uses WebSocket directly — no Chrome/puppeteer needed. No lock file errors.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Orders tab
// ─────────────────────────────────────────────────────────────
type DBOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  maps_link?: string;
  items: { productName: string; variantWeight: string; quantity: number; price: number }[];
  total: number;
  payment_method: string;
  status: string;
  wa_sent: boolean;
  created_at: string;
};

function OrdersTab() {
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clearState, setClearState] = useState<"idle" | "confirm">("idle");

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data as DBOrder[]);
        setLoading(false);
      });
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B", confirmed: "#3B82F6", packed: "#8B5CF6", delivered: "#22C55E", cancelled: "#EF4444",
  };

  async function handleClearAll() {
    if (clearState === "idle") {
      setClearState("confirm");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('orders').delete().neq('customer_name', '_none_');
      if (!error) {
        setOrders([]);
      } else {
        console.error("Error clearing orders:", error);
        alert("Failed to clear orders in database: " + error.message);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error clearing orders: " + err.message);
    }
    setClearState("idle");
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: "rgba(2,6,12,0.4)" }}>Loading orders…</div>;
  if (!orders.length) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#282C3F", marginBottom: 4 }}>No orders yet</div>
      <div style={{ fontSize: 13, color: "rgba(2,6,12,0.45)" }}>Orders will appear here when customers place them</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", fontWeight: 600 }}>{orders.length} order{orders.length !== 1 ? "s" : ""} total</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button 
            onClick={handleClearAll} 
            style={{ 
              background: "none", 
              border: "1px solid " + (clearState === "confirm" ? "#DC2626" : "rgba(2,6,12,0.2)"), 
              borderRadius: 6,
              padding: "4px 10px",
              color: clearState === "confirm" ? "#DC2626" : "#4B5563", 
              fontWeight: 700, 
              fontSize: 12, 
              cursor: "pointer",
              backgroundColor: clearState === "confirm" ? "#FEF2F2" : "transparent"
            }}
          >
            {clearState === "confirm" ? "⚠️ Click to Confirm Clear" : "🗑️ Clear All"}
          </button>
          {clearState === "confirm" && (
            <button 
              onClick={() => setClearState("idle")} 
              style={{ background: "none", border: "none", color: "#4B5563", fontWeight: 600, fontSize: 11, cursor: "pointer" }}
            >
              Cancel
            </button>
          )}
          <button onClick={() => { setLoading(true); supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({data}) => { if(data) setOrders(data as DBOrder[]); setLoading(false); }); }} style={{ background: "none", border: "none", color: "#0050FF", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>↻ Refresh</button>
        </div>
      </div>
      {orders.map((order) => (
        <div key={order.id} style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #E8E8E8", overflow: "hidden" }}>
          <div onClick={() => setExpanded(expanded === order.id ? null : order.id)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#282C3F" }}>{order.customer_name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, backgroundColor: STATUS_COLORS[order.status] + "20", color: STATUS_COLORS[order.status] }}>{order.status}</span>
                {order.wa_sent && <span style={{ fontSize: 10, color: "#25D366", fontWeight: 700 }}>✓ WA</span>}
              </div>
              <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)" }}>{order.customer_phone} · {order.payment_method}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#282C3F" }}>₹{order.total}</div>
              <div style={{ fontSize: 10, color: "rgba(2,6,12,0.35)" }}>{new Date(order.created_at).toLocaleDateString("en-IN")}</div>
            </div>
          </div>
          {expanded === order.id && (
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F0F0F0" }}>
              <div style={{ fontSize: 12, color: "rgba(2,6,12,0.55)", marginTop: 12, marginBottom: 8, lineHeight: 1.6 }}>📍 {order.address}</div>
              {order.maps_link && <a href={order.maps_link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#0050FF", fontWeight: 600, display: "block", marginBottom: 10 }}>🗺️ Open in Maps</a>}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#282C3F" }}>
                    <span>{item.productName} ({item.variantWeight}) × {item.quantity}</span>
                    <span style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {order.status !== "delivered" && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const { error } = await supabase
                        .from("orders")
                        .update({ status: "delivered" })
                        .eq("id", order.id);
                      if (!error) {
                        setOrders((prev) =>
                          prev.map((o) =>
                            o.id === order.id ? { ...o, status: "delivered" } : o
                          )
                        );
                      }
                    } catch (err) {
                      console.error("Failed to update order status:", err);
                    }
                  }}
                  style={{
                    marginTop: 14,
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#22C55E",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  ✓ Mark as Delivered
                </button>
              )}

              <div style={{ marginTop: 8, fontSize: 11, color: "rgba(2,6,12,0.35)", fontFamily: "monospace" }}>ID: {order.id}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
interface RevenueGroup {
  period: string;
  ordersCount: number;
  totalRevenue: number;
  averageValue: number;
  timestamp: number;
}

function RevenueTab() {
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "rev-desc" | "rev-asc">("date-desc");
  const [groupBy, setGroupBy] = useState<"weekly" | "monthly">("monthly");

  useEffect(() => {
    supabase.from('orders').select('*')
      .then(({ data }) => {
        if (data) setOrders(data as DBOrder[]);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRev = orders.reduce((sum, o) => sum + o.total, 0);
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    const deliveredRev = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const avgVal = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;
    return { totalOrders, totalRev, deliveredOrdersCount: deliveredOrders.length, deliveredRev, avgVal };
  }, [orders]);

  const aggregatedData = useMemo(() => {
    const groups: Record<string, { totalRevenue: number; ordersCount: number; timestamp: number }> = {};

    orders.forEach(o => {
      const date = new Date(o.created_at);
      let key = "";
      let timestamp = date.getTime();

      if (groupBy === "monthly") {
        key = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      } else {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(date.setDate(diff));
        key = `Week of ${startOfWeek.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
        timestamp = startOfWeek.getTime();
      }

      if (!groups[key]) {
        groups[key] = { totalRevenue: 0, ordersCount: 0, timestamp };
      }
      groups[key].totalRevenue += o.total;
      groups[key].ordersCount += 1;
    });

    const result: RevenueGroup[] = Object.entries(groups).map(([period, data]) => ({
      period,
      ordersCount: data.ordersCount,
      totalRevenue: data.totalRevenue,
      averageValue: Math.round(data.totalRevenue / data.ordersCount),
      timestamp: data.timestamp,
    }));

    return result.sort((a, b) => {
      if (sortBy === "date-desc") return b.timestamp - a.timestamp;
      if (sortBy === "date-asc") return a.timestamp - b.timestamp;
      if (sortBy === "rev-desc") return b.totalRevenue - a.totalRevenue;
      if (sortBy === "rev-asc") return a.totalRevenue - b.totalRevenue;
      return 0;
    });
  }, [orders, groupBy, sortBy]);

  const maxRevenue = useMemo(() => {
    if (aggregatedData.length === 0) return 1;
    return Math.max(...aggregatedData.map(d => d.totalRevenue), 1);
  }, [aggregatedData]);

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: "rgba(2,6,12,0.4)" }}>Calculating revenue metrics…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, border: "1px solid #E8E8E8", textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Sales Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#166534", marginTop: 4 }}>₹{stats.totalRev.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 11, color: "rgba(2,6,12,0.5)", marginTop: 2 }}>From {stats.totalOrders} total orders</div>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, border: "1px solid #E8E8E8", textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Delivered Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0050FF", marginTop: 4 }}>₹{stats.deliveredRev.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 11, color: "rgba(2,6,12,0.5)", marginTop: 2 }}>{stats.deliveredOrdersCount} delivered orders</div>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, border: "1px solid #E8E8E8", textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Average Order Value</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#282C3F", marginTop: 4 }}>₹{stats.avgVal.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 11, color: "rgba(2,6,12,0.5)", marginTop: 2 }}>Average per order</div>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, border: "1px solid #E8E8E8", textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(2,6,12,0.4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Orders Count</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#8B5CF6", marginTop: 4 }}>{stats.totalOrders} Orders</div>
          <div style={{ fontSize: 11, color: "rgba(2,6,12,0.5)", marginTop: 2 }}>Pending, Packed & Delivered</div>
        </div>
      </div>

      {/* Control panel */}
      <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, border: "1px solid #E8E8E8", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, backgroundColor: "#F3F4F6", padding: 3, borderRadius: 8 }}>
            <button onClick={() => setGroupBy("monthly")} style={{ border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, backgroundColor: groupBy === "monthly" ? "white" : "transparent", color: groupBy === "monthly" ? "#0050FF" : "#6B7280", boxShadow: groupBy === "monthly" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>Monthly</button>
            <button onClick={() => setGroupBy("weekly")} style={{ border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, backgroundColor: groupBy === "weekly" ? "white" : "transparent", color: groupBy === "weekly" ? "#0050FF" : "#6B7280", boxShadow: groupBy === "weekly" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>Weekly</button>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(2,6,12,0.5)", fontWeight: 700 }}>Sort By:</span>
            <select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E8E8E8", fontSize: 12, fontWeight: 600, color: "#282C3F", backgroundColor: "white", outline: "none", cursor: "pointer" }}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="rev-desc">Highest Revenue</option>
              <option value="rev-asc">Lowest Revenue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate lists */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {aggregatedData.length === 0 ? (
          <div style={{ backgroundColor: "white", borderRadius: 12, padding: 32, textAlign: "center", color: "rgba(2,6,12,0.4)" }}>No sales data found for aggregation.</div>
        ) : (
          aggregatedData.map((data, idx) => {
            const barWidthPercent = Math.max(10, Math.round((data.totalRevenue / maxRevenue) * 100));
            return (
              <div key={idx} style={{ backgroundColor: "white", borderRadius: 12, padding: 16, border: "1px solid #E8E8E8", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#282C3F" }}>{data.period}</span>
                    <div style={{ fontSize: 11, color: "rgba(2,6,12,0.45)", marginTop: 2 }}>{data.ordersCount} order{data.ordersCount !== 1 ? "s" : ""} · Avg: ₹{data.averageValue}</div>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#166534" }}>₹{data.totalRevenue.toLocaleString("en-IN")}</span>
                </div>
                
                {/* Visual Bar Chart */}
                <div style={{ width: "100%", height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${barWidthPercent}%`, height: "100%", backgroundColor: "#1BA672", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────
type Tab = "products" | "orders" | "revenue" | "add" | "bulk" | "settings";

export default function AdminDashboard() {
  const { logout, getAllProducts, newProducts, resetToDefault } = useAdmin();
  const [tab, setTab] = useState<Tab>("products");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const router = useRouter();

  const allProducts = getAllProducts();
  const active = allProducts.filter((p) => !p.disabled).length;
  const oos = allProducts.filter((p) => p.outOfStock && !p.disabled).length;
  const hidden = allProducts.filter((p) => p.disabled).length;

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.categorySlug === catFilter;
      return matchSearch && matchCat;
    });
  }, [allProducts, search, catFilter]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "products", label: "Products" },
    { key: "orders", label: "Orders" },
    { key: "revenue", label: "Revenue" },
    { key: "add", label: "Add" },
    { key: "bulk", label: "Bulk" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F0F4FF" }}>
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #E8E8E8", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,80,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#282C3F" }}>Admin Panel</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#0050FF", backgroundColor: "#EEF2FF", padding: "2px 8px", borderRadius: 20 }}>Vinayaga Traders</span>
        </div>
        <button onClick={() => router.push("/")} style={{ fontSize: 12, fontWeight: 700, color: "#0050FF", background: "none", border: "1px solid #0050FF", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>View Store</button>
        <button onClick={logout} style={{ fontSize: 12, fontWeight: 700, color: "#B91C1C", background: "none", border: "1px solid #FECACA", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>Logout</button>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total", value: allProducts.length, color: "#0050FF", bg: "#EEF2FF" },
            { label: "Active", value: active, color: "#166534", bg: "#DCFCE7" },
            { label: "Out of Stock", value: oos, color: "#92400E", bg: "#FEF3C7" },
            { label: "Hidden", value: hidden, color: "#B91C1C", bg: "#FEF2F2" },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, backgroundColor: "white", borderRadius: 12, padding: 4, marginBottom: 16, border: "1px solid #E8E8E8" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none", cursor: "pointer", backgroundColor: tab === t.key ? "#0050FF" : "transparent", color: tab === t.key ? "white" : "#282C3F", fontSize: 13, fontWeight: 700 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, backgroundColor: "white", border: "1.5px solid #E8E8E8", borderRadius: 10, padding: "10px 14px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="rgba(2,6,12,0.4)" strokeWidth="2" /><path d="M20 20l-3-3" stroke="rgba(2,6,12,0.4)" strokeWidth="2" strokeLinecap="round" /></svg>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#282C3F", fontFamily: "inherit" }} />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E8E8E8", fontSize: 13, fontWeight: 600, color: "#282C3F", backgroundColor: "white", outline: "none" }}>
                <option value="all">All Categories</option>
                {CATEGORY_SLUGS.map((s) => <option key={s} value={s}>{CATEGORY_LABELS[s]}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 12, color: "rgba(2,6,12,0.45)", marginBottom: 10 }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""} shown</div>
            {filtered.map((p) => <ProductRow key={p.id} product={p} />)}
          </div>
        )}

        {tab === "orders" && <OrdersTab />}
        {tab === "revenue" && <RevenueTab />}
        {tab === "add" && <AddProductPanel />}
        {tab === "bulk" && <BulkActions />}
        {tab === "settings" && <WhatsAppSettings />}
      </div>
    </div>
  );
}
