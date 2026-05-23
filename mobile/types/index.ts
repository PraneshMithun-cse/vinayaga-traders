export interface Product {
  id: string;
  name: string;
  image: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  unit: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  isVeg?: boolean;
  isBestseller?: boolean;
  deliveryEta?: string;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  color?: string;
}

export interface Banner {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  cta?: string;
  color: string;
  link?: string;
}

export interface FlashDeal {
  id: string;
  product: Product;
  dealPrice: number;
  endsAt: Date;
  stock: number;
  sold: number;
}

export interface Address {
  id: string;
  label: "Home" | "Work" | "Other";
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  walletBalance: number;
  addresses: Address[];
  defaultAddressId?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  discount: number;
  address: Address;
  placedAt: Date;
  deliveryEta?: Date;
  deliveryAgent?: DeliveryAgent;
  paymentMethod: "UPI" | "Card" | "COD" | "Wallet";
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "picking"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  rating: number;
  vehicle: "bike" | "cycle";
  lat?: number;
  lng?: number;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "flat" | "percent";
  discountValue: number;
  minOrder: number;
  maxDiscount?: number;
  validTill: Date;
  isApplicable?: boolean;
}

export interface SearchSuggestion {
  id: string;
  type: "product" | "category" | "brand";
  text: string;
  image?: string;
}

export interface ProductSection {
  id: string;
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
}
