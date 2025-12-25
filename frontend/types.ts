

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

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  daysRemaining: number;
}

export interface PaymentRequest {
  id: string;
  plan: SubscriptionPlan;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proof_image?: string;
  created_at: Date;
  approved_at?: Date;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
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

export interface ApiEndpoint {
  id: string;
  name: string;
  url: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isMainBranch: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: UserRole;
  branchId?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  branchId: string;
}

export interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  footerNote: string;
  currency: string;
  fonnteToken?: string;
  apiEndpoints?: ApiEndpoint[];
  subscription?: SubscriptionInfo;
}

// Added missing interface used in Catalog
export interface ProductMaterialLink {
  materialId: string;
  quantityPerUnit: number;
  isRecoverable: boolean;
}

// Added missing interface used in Catalog
export interface PriceRange {
  min: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  pricingType: PricingType;
  basePrice: number;
  costPrice: number;
  unit: string;
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
  totalPrice: number;
  // Added costPrice and isRangePrice to fix type errors in NewOrder and Reports
  costPrice: number;
  isRangePrice?: boolean;
}

export interface Order {
  id: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
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