
import { Order, Product, InventoryItem, Customer, StoreSettings, OrderStatus, CategoryItem } from '../types';

const API_BASE_URL = 'https://codeigniter.go/api'; 

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  return response.json();
};

const mapProduct = (p: any): Product => ({
  ...p,
  id: String(p.id || p.product_id),
  name: p.name || p.product_name,
  categoryId: p.category_id || p.categoryId,
  basePrice: Number(p.basePrice || p.base_price || 0),
  costPrice: Number(p.costPrice || p.cost_price || 0),
  pricingType: p.pricing_type || p.pricingType,
  priceRanges: (p.price_ranges || p.priceRanges || []).map((r: any) => ({
    min: Number(r.min),
    price: Number(r.price)
  }))
});

export const ApiService = {
  getOrders: async (startDate?: string, endDate?: string): Promise<Order[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    
    const res = await fetch(`${API_BASE_URL}/orders?${params.toString()}`);
    const data = await handleResponse(res);
    return Array.isArray(data) ? data.map(o => ({
      ...o,
      id: String(o.id),
      createdAt: new Date(o.created_at || o.createdAt),
      totalAmount: Number(o.total_amount || o.totalAmount),
      paidAmount: Number(o.paid_amount || o.paidAmount)
    })) : [];
  },

  createOrder: async (order: Partial<Order>): Promise<Order> => {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return handleResponse(res);
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.ok;
  },

  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_BASE_URL}/products`);
    const data = await handleResponse(res);
    return Array.isArray(data) ? data.map(mapProduct) : [];
  },

  getInventory: async (): Promise<InventoryItem[]> => {
    const res = await fetch(`${API_BASE_URL}/inventory`);
    const data = await handleResponse(res);
    return Array.isArray(data) ? data.map((i: any) => ({
      ...i,
      id: String(i.id),
      stock: Number(i.stock),
      minStock: Number(i.min_stock !== undefined ? i.min_stock : (i.minStock || 0))
    })) : [];
  },

  getCategories: async (): Promise<CategoryItem[]> => {
    const res = await fetch(`${API_BASE_URL}/categories`);
    const data = await handleResponse(res);
    return Array.isArray(data) ? data.map((c: any) => ({ ...c, id: String(c.id) })) : [];
  },

  getCustomers: async (): Promise<Customer[]> => {
    const res = await fetch(`${API_BASE_URL}/customers`);
    const data = await handleResponse(res);
    return Array.isArray(data) ? data.map((c: any) => ({
      ...c,
      id: String(c.id),
      totalOrders: Number(c.total_orders || 0),
      totalSpent: Number(c.total_spent || 0)
    })) : [];
  },

  getSettings: async (): Promise<StoreSettings> => {
    const res = await fetch(`${API_BASE_URL}/settings`);
    return handleResponse(res);
  }
};
