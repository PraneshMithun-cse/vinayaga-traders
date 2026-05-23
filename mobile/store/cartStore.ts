import { create } from "zustand";
import type { CartItem, Product, Coupon } from "../types";

interface CartState {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  totalItems: () => number;
  subtotal: () => number;
  discount: () => number;
  deliveryFee: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  appliedCoupon: null,

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return {
          items: state.items.map((i) =>
            i.product.id === productId
              ? { ...i, quantity: i.quantity - 1 }
              : i,
          ),
        };
      }
      return { items: state.items.filter((i) => i.product.id !== productId) };
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set((state) => ({
        items: state.items.filter((i) => i.product.id !== productId),
      }));
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i,
      ),
    }));
  },

  clearCart: () => set({ items: [], appliedCoupon: null }),

  applyCoupon: (coupon) => set({ appliedCoupon: coupon }),

  removeCoupon: () => set({ appliedCoupon: null }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  discount: () => {
    const coupon = get().appliedCoupon;
    const sub = get().subtotal();
    if (!coupon) return 0;
    if (sub < coupon.minOrder) return 0;
    if (coupon.discountType === "flat") return coupon.discountValue;
    const pct = Math.round(sub * (coupon.discountValue / 100));
    return coupon.maxDiscount ? Math.min(pct, coupon.maxDiscount) : pct;
  },

  deliveryFee: () => {
    const sub = get().subtotal();
    return sub >= 299 ? 0 : sub > 0 ? 29 : 0;
  },

  total: () => {
    const sub = get().subtotal();
    const disc = get().discount();
    const fee = get().deliveryFee();
    return Math.max(0, sub - disc + fee);
  },
}));
