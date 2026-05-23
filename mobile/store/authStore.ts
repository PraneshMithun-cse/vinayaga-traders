import { create } from "zustand";
import type { User, Address } from "../types";

const MOCK_USER: User = {
  id: "u1",
  name: "Pranesh M",
  phone: "+91 98765 43210",
  email: "pranesh@example.com",
  walletBalance: 250,
  addresses: [
    {
      id: "a1",
      label: "Home",
      line1: "42, Green Valley Apartments",
      line2: "MG Road",
      city: "Bangalore",
      pincode: "560001",
    },
    {
      id: "a2",
      label: "Work",
      line1: "Prestige Tech Park, Tower B",
      line2: "Outer Ring Road",
      city: "Bangalore",
      pincode: "560103",
    },
  ],
  defaultAddressId: "a1",
};

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  activeAddress: Address | null;
  login: (phone: string) => Promise<void>;
  logout: () => void;
  setActiveAddress: (address: Address) => void;
  updateWallet: (amount: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: MOCK_USER,
  isLoggedIn: true,
  activeAddress:
    MOCK_USER.addresses.find((a) => a.id === MOCK_USER.defaultAddressId) ??
    null,

  login: async (_phone) => {
    await new Promise((r) => setTimeout(r, 1000));
    set({ user: MOCK_USER, isLoggedIn: true });
  },

  logout: () => set({ user: null, isLoggedIn: false, activeAddress: null }),

  setActiveAddress: (address) => set({ activeAddress: address }),

  updateWallet: (amount) => {
    const user = get().user;
    if (user) {
      set({ user: { ...user, walletBalance: user.walletBalance + amount } });
    }
  },
}));
