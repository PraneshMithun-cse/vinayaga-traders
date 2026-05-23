"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type CartItem = {
  productId: string;
  variantId: string;
  productName: string;
  variantWeight: string;
  price: number;
  mrp: number;
  imageUrl: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  updateQty: (productId: string, variantId: string, delta: number, meta?: Omit<CartItem, "quantity">) => void;
  getVariantQty: (productId: string, variantId: string) => number;
  getProductQty: (productId: string) => number;
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "vt_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const updateQty = useCallback(
    (productId: string, variantId: string, delta: number, meta?: Omit<CartItem, "quantity">) => {
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.productId === productId && i.variantId === variantId);
        if (idx === -1) {
          if (delta <= 0 || !meta) return prev;
          return [...prev, { ...meta, productId, variantId, quantity: delta }];
        }
        const next = [...prev];
        const newQty = Math.max(0, next[idx].quantity + delta);
        if (newQty === 0) {
          next.splice(idx, 1);
        } else {
          next[idx] = { ...next[idx], quantity: newQty };
        }
        return next;
      });
    },
    []
  );

  const getVariantQty = useCallback(
    (productId: string, variantId: string) =>
      items.find((i) => i.productId === productId && i.variantId === variantId)?.quantity ?? 0,
    [items]
  );

  const getProductQty = useCallback(
    (productId: string) =>
      items.filter((i) => i.productId === productId).reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, updateQty, getVariantQty, getProductQty, totalItems, totalPrice, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
