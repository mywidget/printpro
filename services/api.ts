
import { Order, Product, InventoryItem, Customer, StoreSettings, OrderStatus, CategoryItem, User } from '../types';

// Sesuaikan URL ini dengan lokasi folder project CodeIgniter Anda
const API_BASE_URL = 'https://apiprintpro.go/api'; 

const handleResponse = async (response: Response) => {
  const text = await response.text();
  
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    if (text.includes('A Database Error Occurred')) {
      errorMessage = "Terjadi kesalahan database pada server.";
    } else {
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = text.substring(0, 100) || errorMessage;
      }
    }
    throw new Error(errorMessage);
  }

  if (!text || text.trim().length === 0) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("Server tidak mengembalikan JSON valid:", text);
    return { message: text };
  }
};

export const ApiService = {
  login: async (username: string, password: string): Promise<User> => {
    return handleResponse(await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }));
  },

  getUsers: async (): Promise<User[]> => handleResponse(await fetch(`${API_BASE_URL}/users`)),

  upsertUser: async (user: User) => handleResponse(await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })),

  deleteUser: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' })),

  getOrders: async (): Promise<Order[]> => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/orders`));
    return Array.isArray(data) ? data.map(o => ({ 
      ...o, 
      id: String(o.id),
      customerName: o.customer_name || o.customerName,
      customerPhone: o.customer_phone || o.customerPhone,
      totalAmount: Number(o.total_amount || o.totalAmount),
      paidAmount: Number(o.paid_amount || o.paidAmount),
      paymentMethod: o.payment_method || o.paymentMethod,
      createdAt: new Date(o.created_at || o.createdAt),
      items: typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items || [])
    })) : [];
  },

  getProducts: async () => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/products`));
    return Array.isArray(data) ? data.map(p => ({
      ...p,
      id: String(p.id),
      categoryId: p.category_id,
      basePrice: Number(p.base_price),
      costPrice: Number(p.cost_price),
      pricingType: p.pricing_type,
      priceRanges: typeof p.price_ranges === 'string' ? JSON.parse(p.price_ranges) : (p.price_ranges || []),
      materials: typeof p.materials === 'string' ? JSON.parse(p.materials) : (p.materials || [])
    })) : [];
  },

  getInventory: async () => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/inventory`));
    return Array.isArray(data) ? data.map(i => ({
      ...i,
      id: String(i.id),
      minStock: Number(i.min_stock),
      stock: Number(i.stock)
    })) : [];
  },

  getCategories: async () => handleResponse(await fetch(`${API_BASE_URL}/categories`)),
  
  getCustomers: async () => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/customers`));
    return Array.isArray(data) ? data.map(c => ({
      ...c,
      id: String(c.id),
      totalOrders: Number(c.total_orders),
      totalSpent: Number(c.total_spent),
      joinDate: new Date(c.join_date)
    })) : [];
  },

  upsertCustomer: async (customer: Customer) => {
    const payload = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      total_orders: customer.totalOrders,
      total_spent: customer.totalSpent,
      join_date: customer.joinDate instanceof Date ? customer.joinDate.toISOString().slice(0, 19).replace('T', ' ') : customer.joinDate
    };
    return handleResponse(await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }));
  },

  getSettings: async () => handleResponse(await fetch(`${API_BASE_URL}/settings`)),

  upsertOrder: async (order: Order) => handleResponse(await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({
      id: order.id,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      total_amount: order.totalAmount,
      paid_amount: order.paidAmount,
      payment_method: order.paymentMethod,
      items_json: JSON.stringify(order.items),
      status: order.status
    })
  })),
  
  updateOrderStatus: async (order: Order) => handleResponse(await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: order.id,
      status: order.status
    })
  })),

  upsertProduct: async (product: Product) => {
    const payload = {
      id: product.id,
      name: product.name,
      category_id: product.categoryId,
      pricing_type: product.pricingType,
      base_price: product.basePrice,
      cost_price: product.costPrice,
      unit: product.unit,
      description: product.description,
      price_ranges: product.priceRanges || [], 
      materials: product.materials || []
    };

    return handleResponse(await fetch(`${API_BASE_URL}/products`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload)
    }));
  },

  upsertCategory: async (category: CategoryItem) => handleResponse(await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(category)
  })),

  upsertInventory: async (item: InventoryItem) => handleResponse(await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({
      id: item.id,
      name: item.name,
      category: item.category,
      stock: item.stock,
      min_stock: item.minStock,
      unit: item.unit
    })
  })),

  saveSettings: async (settings: StoreSettings) => handleResponse(await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(settings)
  })),

  deleteProduct: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' })),
  deleteCategory: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' })),
  deleteInventory: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/inventory/${id}`, { method: 'DELETE' })),

  syncAll: async (payload: any) => handleResponse(await fetch(`${API_BASE_URL}/sync`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload)
  }))
};
