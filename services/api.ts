
import { Order, Product, InventoryItem, Customer, StoreSettings, OrderStatus, CategoryItem, User } from '../types';

// Mendeteksi URL secara dinamis
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal 
  ? 'https://apiprintpro.go' 
  : `${window.location.origin}/index.php/api`; 

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
    if (!Array.isArray(data)) return [];
    
    return data.map(o => {
      const totalAmount = Number(o.total_amount || o.totalAmount || 0);
      const paidAmount = Number(o.paid_amount || o.paidAmount || 0);
      
      let items = [];
      try {
        if (o.items_json) {
            items = typeof o.items_json === 'string' ? JSON.parse(o.items_json) : o.items_json;
        } else if (o.items) {
            items = Array.isArray(o.items) ? o.items : JSON.parse(o.items);
        }
      } catch (e) {
        console.error("Gagal parse items untuk order:", o.id);
      }

      const processedItems = items.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice || item.unit_price || 0),
          costPrice: Number(item.costPrice || item.cost_price || 0),
          totalPrice: Number(item.totalPrice || item.total_price || 0),
          quantity: Number(item.quantity || 0)
      }));

      return { 
        ...o, 
        id: String(o.id),
        customerName: o.customer_name || o.customerName || 'Umum',
        customerPhone: o.customer_phone || o.customerPhone || '',
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        paymentMethod: o.payment_method || o.paymentMethod || 'CASH',
        createdAt: new Date(o.created_at || o.createdAt || Date.now()),
        status: (o.status as OrderStatus) || OrderStatus.PENDING,
        items: processedItems
      };
    });
  },

  upsertOrder: async (order: Order) => {
    const payload = {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: Number(order.totalAmount),
      paidAmount: Number(order.paidAmount),
      paymentMethod: order.paymentMethod,
      items: order.items, 
      status: order.status,
      createdAt: order.createdAt instanceof Date 
        ? order.createdAt.toISOString().slice(0, 19).replace('T', ' ') 
        : order.createdAt
    };

    return handleResponse(await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload)
    }));
  },

  getProducts: async () => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/products`));
    return Array.isArray(data) ? data.map(p => ({
      ...p,
      id: String(p.id),
      categoryId: p.category_id || p.categoryId,
      basePrice: Number(p.base_price || p.basePrice || 0),
      costPrice: Number(p.cost_price || p.costPrice || 0),
      priceRanges: typeof p.price_ranges === 'string' ? JSON.parse(p.price_ranges) : (p.price_ranges || []),
      materials: typeof p.materials === 'string' ? JSON.parse(p.materials) : (p.materials || [])
    })) : [];
  },

  upsertProduct: async (product: Product) => handleResponse(await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  })),

  getInventory: async () => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/inventory`));
    return Array.isArray(data) ? data.map(i => ({
      ...i,
      id: String(i.id),
      minStock: Number(i.min_stock || i.minStock || 0),
      stock: Number(i.stock || 0)
    })) : [];
  },

  getCategories: async () => handleResponse(await fetch(`${API_BASE_URL}/categories`)),
  
  getCustomers: async () => {
    const data = await handleResponse(await fetch(`${API_BASE_URL}/customers`));
    if (!Array.isArray(data)) return [];
    
    return data.map(c => ({
      ...c,
      id: String(c.id),
      name: c.name || c.customer_name || 'Tanpa Nama',
      phone: c.phone || c.customer_phone || '',
      totalOrders: Number(c.total_orders || c.totalOrders || 0),
      totalSpent: Number(c.total_spent || c.totalSpent || 0),
      joinDate: new Date(c.join_date || c.joinDate || Date.now())
    }));
  },

  upsertCustomer: async (customer: Partial<Customer>) => handleResponse(await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer)
  })),

  saveSettings: async (settings: StoreSettings) => handleResponse(await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(settings)
  })),

  getSettings: async () => handleResponse(await fetch(`${API_BASE_URL}/settings`)),

  deleteProduct: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' })),
  deleteCategory: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' })),
  deleteInventory: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/inventory/${id}`, { method: 'DELETE' })),

  syncAll: async (payload: any) => handleResponse(await fetch(`${API_BASE_URL}/sync`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload)
  }))
};
