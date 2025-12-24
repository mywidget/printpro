
import { Order, Product, InventoryItem, Customer, StoreSettings, OrderStatus, CategoryItem } from '../types';

const API_BASE_URL = 'httpa://printpro.go/api'; 

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    try {
      const text = await response.text();
      if (text.includes('<h1>A Database Error Occurred</h1>')) {
        const match = text.match(/<p>Error Number: (.*?)<\/p><p>(.*?)<\/p>/);
        errorMessage = match ? `Database Error [${match[1]}]: ${match[2]}` : "Kesalahan Database Server.";
      } else {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      }
    } catch (e) {}
    throw new Error(errorMessage);
  }
  return response.json();
};

const mapOrder = (o: any): Order => {
  let items = [];
  try {
    // Menangani jika items datang sebagai string JSON dari database
    items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || o.items_json || []);
  } catch (e) {
    console.error("Failed to parse order items for order:", o.id);
  }

  return {
    ...o,
    id: String(o.id),
    createdAt: new Date(o.created_at || o.createdAt),
    totalAmount: Number(o.total_amount || o.totalAmount || 0),
    paidAmount: Number(o.paid_amount || o.paidAmount || 0),
    items: Array.isArray(items) ? items : []
  };
};

const mapProduct = (p: any): Product => ({
  ...p,
  id: String(p.id),
  name: p.name,
  categoryId: p.category_id || p.categoryId,
  basePrice: Number(p.basePrice || p.base_price || 0),
  costPrice: Number(p.costPrice || p.cost_price || 0),
  pricingType: p.pricing_type || p.pricingType,
  priceRanges: typeof p.price_ranges === 'string' ? JSON.parse(p.price_ranges) : (p.priceRanges || []),
  materials: typeof p.materials === 'string' ? JSON.parse(p.materials) : (p.materials || [])
});

export const ApiService = {
  // GETTERS
  getOrders: async (): Promise<Order[]> => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/orders`));
    return Array.isArray(data) ? data.map(mapOrder) : [];
  },
  getProducts: async () => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/products`));
    return Array.isArray(data) ? data.map(mapProduct) : [];
  },
  getInventory: async () => handleResponse(await fetch(`${API_BASE_URL}/inventory`)),
  getCategories: async () => handleResponse(await fetch(`${API_BASE_URL}/categories`)),
  getCustomers: async () => handleResponse(await fetch(`${API_BASE_URL}/customers`)),
  getSettings: async () => handleResponse(await fetch(`${API_BASE_URL}/settings`)),

  // SAVE / UPDATE (UPSERT)
  upsertOrder: async (order: Order) => handleResponse(await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order)
  })),
  
  updateOrderStatus: async (id: string, status: OrderStatus) => handleResponse(await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
  })),

  upsertProduct: async (product: Product) => handleResponse(await fetch(`${API_BASE_URL}/products`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product)
  })),

  upsertCategory: async (category: CategoryItem) => handleResponse(await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(category)
  })),

  upsertInventory: async (item: InventoryItem) => handleResponse(await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item)
  })),

  saveSettings: async (settings: StoreSettings) => handleResponse(await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
  })),

  // DELETE
  deleteProduct: async (id: string) => fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' }),
  deleteCategory: async (id: string) => fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' }),
  deleteInventory: async (id: string) => fetch(`${API_BASE_URL}/inventory/${id}`, { method: 'DELETE' }),

  // BULK SYNC
  syncAll: async (payload: any) => handleResponse(await fetch(`${API_BASE_URL}/sync`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  }))
};
