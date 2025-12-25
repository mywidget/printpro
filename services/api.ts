import { Order, Product, InventoryItem, Customer, StoreSettings, OrderStatus, CategoryItem, User, UserRole, PaymentMethod, Branch, PricingType } from '../types';

let ACTIVE_API_URL = 'https://kasirpro.thm.my.id';

export const ApiService = {
  setBaseUrl: (url: string) => {
    ACTIVE_API_URL = url.endsWith('/') ? url.slice(0, -1) : url;
    if (!ACTIVE_API_URL.includes('/api') && !ACTIVE_API_URL.includes('index.php')) {
        ACTIVE_API_URL += '/index.php/api';
    }
  },

  getBaseUrl: () => ACTIVE_API_URL,

  handleResponse: async (response: Response) => {
    const text = await response.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch (e) {
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      return text;
    }
    if (!response.ok || (json.success === false)) {
      throw new Error(json.message || json.error || `API Error: ${response.status}`);
    }
    return json.data !== undefined ? json.data : json;
  },

  // --- AUTH ---
  login: async (username: string, password: string): Promise<User> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }));
    return {
      id: String(data.id),
      username: data.username,
      name: data.name || data.username || 'User',
      role: (data.role as UserRole) || UserRole.STAFF,
      branchId: data.branch_id
    };
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/products`));
    if (!Array.isArray(data)) return [];
    return data.map(p => ({
      id: String(p.id),
      name: p.name,
      categoryId: String(p.category_id || p.categoryId),
      pricingType: (p.pricing_type || p.pricingType) as PricingType,
      basePrice: Number(p.base_price || p.basePrice || 0),
      costPrice: Number(p.cost_price || p.costPrice || 0),
      unit: p.unit,
      description: p.description || '',
      materials: typeof p.materials_json === 'string' ? JSON.parse(p.materials_json) : (p.materials || []),
      priceRanges: typeof p.price_ranges_json === 'string' ? JSON.parse(p.price_ranges_json) : (p.priceRanges || [])
    }));
  },

  upsertProduct: async (product: Product) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...product,
      category_id: product.categoryId,
      base_price: product.basePrice,
      cost_price: product.costPrice,
      pricing_type: product.pricingType,
      materials_json: JSON.stringify(product.materials || []),
      price_ranges_json: JSON.stringify(product.priceRanges || [])
    })
  })),

  deleteProduct: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/products/${id}`, { method: 'DELETE' })),

  // --- SETTINGS (Mapping Fonnte Token & API Endpoints) ---
  getSettings: async (): Promise<StoreSettings> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/settings`));
    
    // Karena CI3 mengembalikan data dari tabel key-value sebagai string, 
    // kita perlu melakukan JSON.parse pada field yang berbentuk array/object
    let parsedEndpoints = [];
    try {
      if (data.apiEndpoints) {
        parsedEndpoints = typeof data.apiEndpoints === 'string' 
          ? JSON.parse(data.apiEndpoints) 
          : data.apiEndpoints;
      }
    } catch (e) {
      console.error("Gagal parse apiEndpoints dari server", e);
    }

    return {
      ...data,
      fonnteToken: data.fonnte_token || data.fonnteToken || '',
      apiEndpoints: Array.isArray(parsedEndpoints) ? parsedEndpoints : []
    };
  },
  
  saveSettings: async (settings: StoreSettings) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...settings,
      fonnte_token: settings.fonnteToken
    })
  })),

  // --- WHATSAPP GATEWAY (Fonnte) ---
  sendWhatsapp: async (token: string, target: string, message: string) => {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': token },
      body: new URLSearchParams({ target, message })
    });
    return ApiService.handleResponse(response);
  },

  // --- INVENTORY ---
  getInventory: async (branchId?: string): Promise<InventoryItem[]> => {
    const url = branchId ? `${ACTIVE_API_URL}/inventory?branchId=${branchId}` : `${ACTIVE_API_URL}/inventory`;
    const data = await ApiService.handleResponse(await fetch(url));
    if (!Array.isArray(data)) return [];
    return data.map(i => ({
      id: String(i.id),
      name: i.name,
      category: i.category,
      stock: Number(i.stock || 0),
      minStock: Number(i.min_stock || i.minStock || 0),
      unit: i.unit,
      branchId: String(i.branch_id || i.branchId || 'br-main')
    }));
  },

  upsertInventory: async (item: InventoryItem) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      ...item, 
      branch_id: item.branchId,
      min_stock: item.minStock
    })
  })),

  deleteInventory: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/inventory/${id}`, { method: 'DELETE' })),

  // --- ORDERS ---
  getOrders: async (branchId?: string): Promise<Order[]> => {
    const url = branchId ? `${ACTIVE_API_URL}/orders?branchId=${branchId}` : `${ACTIVE_API_URL}/orders`;
    const data = await ApiService.handleResponse(await fetch(url));
    if (!Array.isArray(data)) return [];
    return data.map(o => ({
      id: String(o.id),
      branchId: String(o.branch_id || 'br-main'),
      customerName: o.customer_name || 'Umum',
      customerPhone: o.customer_phone || '',
      status: (o.status as OrderStatus) || OrderStatus.PENDING,
      totalAmount: Number(o.total_amount || 0),
      paidAmount: Number(o.paid_amount || 0),
      paymentMethod: (o.payment_method as PaymentMethod) || PaymentMethod.CASH,
      createdAt: new Date(o.created_at || Date.now()),
      notes: o.notes || '',
      items: (typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items || []))
    }));
  },

  upsertOrder: async (order: Order) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...order,
      branch_id: order.branchId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      total_amount: order.totalAmount,
      paid_amount: order.paidAmount,
      payment_method: order.paymentMethod,
      items_json: JSON.stringify(order.items)
    })
  })),

  // --- CATEGORIES ---
  getCategories: async (): Promise<CategoryItem[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/categories`));
    return Array.isArray(data) ? data.map(c => ({
      id: String(c.id),
      name: c.name,
      description: c.description,
      icon: c.icon
    })) : [];
  },

  upsertCategory: async (category: CategoryItem) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  })),

  deleteCategory: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/categories/${id}`, { method: 'DELETE' })),

  // --- CUSTOMERS ---
  getCustomers: async (): Promise<Customer[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/customers`));
    if (!Array.isArray(data)) return [];
    return data.map(c => ({
      id: String(c.id),
      name: c.name,
      phone: c.phone,
      email: c.email,
      totalOrders: Number(c.total_orders || c.totalOrders || 0),
      totalSpent: Number(c.total_spent || c.totalSpent || 0),
      joinDate: new Date(c.created_at || c.joinDate || Date.now())
    }));
  },

  upsertCustomer: async (customer: Customer) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...customer,
      total_orders: customer.totalOrders,
      total_spent: customer.totalSpent
    })
  })),

  // --- USERS & BRANCHES ---
  getUsers: async (): Promise<User[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/users`));
    return Array.isArray(data) ? data.map(u => ({
      id: String(u.id),
      username: u.username,
      name: u.name || u.username || 'User',
      role: (u.role as UserRole) || UserRole.STAFF,
      branchId: u.branch_id
    })) : [];
  },

  upsertUser: async (user: User) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...user,
      branch_id: user.branchId
    })
  })),

  deleteUser: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/users/${id}`, { method: 'DELETE' })),

  getBranches: async (): Promise<Branch[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/branches`));
    return Array.isArray(data) ? data.map(b => ({
      ...b,
      id: String(b.id),
      is_main_branch: b.is_main_branch,
      isMainBranch: Boolean(Number(b.is_main_branch || b.isMainBranch))
    })) : [];
  },

  upsertBranch: async (branch: Branch) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/branches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...branch,
      is_main_branch: branch.isMainBranch ? 1 : 0
    })
  })),

  deleteBranch: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/branches/${id}`, { method: 'DELETE' })),

  syncAll: async (payload: any) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }))
};
