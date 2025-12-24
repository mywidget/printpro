
export enum OrderStatus {
  PENDING = 'PENDING',
  DESIGNING = 'DESIGNING',
  PRINTING = 'PRINTING',
  FINISHING = 'FINISHING',
  READY = 'READY',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum PricingType {
  UNIT = 'UNIT',
  DIMENSION = 'DIMENSION'
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  QRIS = 'QRIS',
  CREDIT_CARD = 'CREDIT_CARD'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: UserRole;
  lastLogin?: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
}

export interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  footerNote: string;
  currency: string;
}

export interface PriceRange {
  min: number;
  price: number;
}

export interface ProductMaterialLink {
  materialId: string;
  quantityPerUnit: number;
  isRecoverable?: boolean; 
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  pricingType: PricingType;
  basePrice: number;
  costPrice: number;
  unit: 'sheet' | 'meter' | 'pcs' | 'box';
  description: string;
  materials?: ProductMaterialLink[];
  priceRanges?: PriceRange[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  width?: number; 
  height?: number; 
  specs: string;
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  isRangePrice?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  deadline?: Date;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: Date;
}

export interface DashboardStats {
  totalSales: number;
  totalReceivable: number;
  pendingOrders: number;
  completedToday: number;
  revenueByDay: { date: string; amount: number }[];
  productSales: { name: string; quantity: number }[];
}
