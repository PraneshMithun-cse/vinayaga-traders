"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product, Variant, PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { supabase } from "@/lib/supabase";

export type VariantOverride = {
  price?: number;
  mrp?: number;
  weight?: string;
  disabled?: boolean;
};

export type ProductOverride = Omit<Partial<Product>, 'variants'> & {
  extraVariants?: Variant[];
  variants?: Record<string, VariantOverride>;
  outOfStock?: boolean;
  disabled?: boolean;
};

type AdminContextType = {
  isLoggedIn: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  overrides: Record<string, ProductOverride>;
  newProducts: Product[];
  importedProducts: Product[] | null;
  whatsappNumber: string;
  setWhatsappNumber: (n: string) => void;
  callmebotKey: string;
  setCallmebotKey: (k: string) => void;
  setOverride: (productId: string, patch: ProductOverride) => void;
  setVariantOverride: (productId: string, variantId: string, patch: VariantOverride) => void;
  addExtraVariant: (productId: string, variant: Variant) => void;
  removeExtraVariant: (productId: string, variantId: string) => void;
  addProduct: (product: Product) => void;
  removeNewProduct: (productId: string) => void;
  replaceAllWithImport: (products: Product[]) => void;
  resetToDefault: () => void;
  applyOverride: (product: Product) => Product & { outOfStock?: boolean; disabled?: boolean };
  getAllProducts: () => (Product & { outOfStock?: boolean; disabled?: boolean })[];
  getActiveProducts: () => (Product & { outOfStock?: boolean; disabled?: boolean })[];
};

const AdminContext = createContext<AdminContextType | null>(null);

const CREDS = { username: "guna", password: "mathuraiveeran" };
const STORAGE_SESSION = "vt_admin_session";
const STORAGE_WA = "vt_admin_whatsapp";
const DEFAULT_WA = "919655566602";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [whatsappNumber, setWhatsappNumberState] = useState(DEFAULT_WA);
  const [callmebotKey, setCallmebotKeyState] = useState("");
  
  // Real products from Supabase
  const [cloudProducts, setCloudProducts] = useState<Product[]>(STATIC_PRODUCTS);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_SESSION) === "1") setIsLoggedIn(true);
      const savedWa = localStorage.getItem(STORAGE_WA);
      if (savedWa) setWhatsappNumberState(savedWa);
    } catch {}

    // Fetch live products from Supabase
    fetchSupabaseProducts();
  }, []);

  async function fetchSupabaseProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (data && !error) {
      // Map DB row to Product type
      const mapped = data.map((row: any) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        imageUrl: row.image_url,
        images: [row.image_url],
        categorySlug: row.category_slug,
        categoryName: row.category_name,
        deliveryMins: row.delivery_mins,
        outOfStock: row.out_of_stock,
        disabled: row.disabled,
        variants: row.variants || []
      }));
      setCloudProducts(mapped);
    }
  }

  const setWhatsappNumber = useCallback((n: string) => {
    const cleaned = n.replace(/\D/g, "");
    setWhatsappNumberState(cleaned);
    try { localStorage.setItem(STORAGE_WA, cleaned); } catch {}
  }, []);

  const setCallmebotKey = useCallback((k: string) => {
    setCallmebotKeyState(k.trim());
  }, []);

  const login = useCallback((user: string, pass: string) => {
    if (user === CREDS.username && pass === CREDS.password) {
      setIsLoggedIn(true);
      localStorage.setItem(STORAGE_SESSION, "1");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem(STORAGE_SESSION);
  }, []);

  // ── Database Writers ──────────────────────────────────────────

  const setOverride = useCallback(async (productId: string, patch: ProductOverride) => {
    const p = cloudProducts.find(x => x.id === productId);
    if (!p) return;

    const updates: any = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.imageUrl !== undefined) updates.image_url = patch.imageUrl;
    if (patch.disabled !== undefined) updates.disabled = patch.disabled;
    if (patch.outOfStock !== undefined) updates.out_of_stock = patch.outOfStock;
    
    // Optimistic UI
    setCloudProducts(prev => prev.map(x => x.id === productId ? { ...x, ...patch } as any as Product : x));
    
    await supabase.from('products').update(updates).eq('id', productId);
  }, [cloudProducts]);

  const setVariantOverride = useCallback(async (productId: string, variantId: string, patch: VariantOverride) => {
    const p = cloudProducts.find(x => x.id === productId);
    if (!p) return;

    const newVariants = p.variants.map(v => {
      if (v.id === variantId) {
        const newPrice = patch.price ?? v.price;
        const newMrp = patch.mrp ?? v.mrp;
        return {
          ...v,
          price: newPrice,
          mrp: newMrp,
          weight: patch.weight ?? v.weight,
          discountPercent: newMrp > newPrice ? Math.round(((newMrp - newPrice) / newMrp) * 100) : 0,
        };
      }
      return v;
    });

    setCloudProducts(prev => prev.map(x => x.id === productId ? { ...x, variants: newVariants } : x));
    await supabase.from('products').update({ variants: newVariants }).eq('id', productId);
  }, [cloudProducts]);

  const addExtraVariant = useCallback(async (productId: string, variant: Variant) => {
    const p = cloudProducts.find(x => x.id === productId);
    if (!p) return;
    const newVariants = [...p.variants, variant];
    setCloudProducts(prev => prev.map(x => x.id === productId ? { ...x, variants: newVariants } : x));
    await supabase.from('products').update({ variants: newVariants }).eq('id', productId);
  }, [cloudProducts]);

  const removeExtraVariant = useCallback(async (productId: string, variantId: string) => {
    const p = cloudProducts.find(x => x.id === productId);
    if (!p) return;
    const newVariants = p.variants.filter(v => v.id !== variantId);
    setCloudProducts(prev => prev.map(x => x.id === productId ? { ...x, variants: newVariants } : x));
    await supabase.from('products').update({ variants: newVariants }).eq('id', productId);
  }, [cloudProducts]);

  const addProduct = useCallback(async (product: Product) => {
    setCloudProducts(prev => [...prev, product]);
    await supabase.from('products').insert({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image_url: product.imageUrl,
      category_slug: product.categorySlug,
      category_name: product.categoryName,
      delivery_mins: product.deliveryMins || 17,
      out_of_stock: product.outOfStock || false,
      disabled: product.disabled || false,
      variants: product.variants
    });
  }, []);

  const removeNewProduct = useCallback(async (productId: string) => {
    setCloudProducts(prev => prev.filter(x => x.id !== productId));
    await supabase.from('products').delete().eq('id', productId);
  }, []);

  const replaceAllWithImport = useCallback(async (products: Product[]) => {
    // This is a heavy operation, skipping DB sync for safety in this demo,
    // usually you'd truncate and insert.
    setCloudProducts(products);
  }, []);

  const resetToDefault = useCallback(async () => {
    // Fetch fresh from DB again
    fetchSupabaseProducts();
  }, []);

  // ── Readers ──────────────────────────────────────────

  const applyOverride = useCallback(
    (product: Product): Product & { outOfStock?: boolean; disabled?: boolean } => {
      // Find the cloud version of this product
      const cloud = cloudProducts.find(p => p.id === product.id);
      return cloud || product;
    },
    [cloudProducts]
  );

  const getAllProducts = useCallback(() => {
    return cloudProducts;
  }, [cloudProducts]);

  const getActiveProducts = useCallback(() => {
    return cloudProducts.filter((p) => !p.disabled);
  }, [cloudProducts]);

  return (
    <AdminContext.Provider value={{
      isLoggedIn, login, logout,
      overrides: {}, newProducts: [], importedProducts: null, // deprecated
      whatsappNumber, setWhatsappNumber,
      callmebotKey, setCallmebotKey,
      setOverride, setVariantOverride,
      addExtraVariant, removeExtraVariant,
      addProduct, removeNewProduct, replaceAllWithImport, resetToDefault,
      applyOverride, getAllProducts, getActiveProducts,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be inside AdminProvider");
  return ctx;
}
