

import { Order, Product, InventoryItem, Customer, StoreSettings, OrderStatus, CategoryItem, User, UserRole, PaymentMethod, Branch, PricingType, SubscriptionPlan, PaymentRequest } from '../types';

let ACTIVE_API_URL = '';

export const ApiService = {
  setBaseUrl: (url: string) => {
    let baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    if (!baseUrl.includes('index.php')) {
        baseUrl += '/index.php/api';
    }
    ACTIVE_API_URL = baseUrl;
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
      name: data.name,
      role: (data.role as UserRole),
      branchId: data.branch_id
    };
  },

  // --- PAYMENTS & SUBSCRIPTION ---
  getPayments: async (): Promise<PaymentRequest[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/payments`));
    return data.map((p: any) => ({
      ...p,
      id: String(p.id),
      amount: Number(p.amount),
      created_at: new Date(p.created_at),
      approved_at: p.approved_at ? new Date(p.approved_at) : undefined
    }));
  },

  submitPayment: async (payment: Partial<PaymentRequest>) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment)
  })),

  approvePayment: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/approve_payment/${id}`, {
    method: 'POST'
  })),

  // --- SETTINGS ---
  getSettings: async (): Promise<StoreSettings> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/settings`));
    const settings: any = {};
    data.forEach((item: any) => {
        try {
            settings[item.key] = (item.value && (item.value.startsWith('[') || item.value.startsWith('{'))) 
                ? JSON.parse(item.value) 
                : item.value;
        } catch(e) { settings[item.key] = item.value; }
    });

    // Auto-calculate remaining days
    const sub = settings.subscription;
    if (sub && sub.endDate) {
        const end = new Date(sub.endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        sub.daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        sub.status = sub.daysRemaining > 0 ? 'ACTIVE' : 'EXPIRED';
    }

    return {
      name: settings.name || 'PrintPro POS',
      address: settings.address || '',
      phone: settings.phone || '',
      email: settings.email || '',
      footerNote: settings.footer_note || '',
      currency: settings.currency || 'IDR',
      fonnteToken: settings.fonnte_token || '',
      apiEndpoints: settings.api_endpoints || [],
      subscription: sub ? { ...sub, endDate: new Date(sub.endDate) } : undefined
    };
  },
  
  saveSettings: async (settings: StoreSettings) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      footer_note: settings.footerNote,
      currency: settings.currency,
      fonnte_token: settings.fonnteToken,
      api_endpoints: JSON.stringify(settings.apiEndpoints || []),
      subscription: JSON.stringify(settings.subscription)
    })
  })),

  // --- CRUD METHODS ---
  getProducts: async (): Promise<Product[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/products`));
    return data.map((p: any) => ({
      ...p,
      id: String(p.id),
      categoryId: p.category_id,
      pricingType: p.pricing_type,
      basePrice: Number(p.base_price),
      costPrice: Number(p.cost_price),
      materials: JSON.parse(p.materials_json || '[]'),
      priceRanges: JSON.parse(p.price_ranges_json || '[]')
    }));
  },

  upsertProduct: async (product: Product) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        ...product,
        category_id: product.categoryId,
        pricing_type: product.pricingType,
        base_price: product.basePrice,
        cost_price: product.costPrice,
        materials_json: JSON.stringify(product.materials || []),
        price_ranges_json: JSON.stringify(product.priceRanges || [])
    })
  })),

  getInventory: async (branchId?: string): Promise<InventoryItem[]> => {
    const url = branchId ? `${ACTIVE_API_URL}/inventory?branch_id=${branchId}` : `${ACTIVE_API_URL}/inventory`;
    const data = await ApiService.handleResponse(await fetch(url));
    return data.map((i: any) => ({ ...i, id: String(i.id), stock: Number(i.stock), minStock: Number(i.min_stock), branchId: i.branch_id }));
  },

  upsertInventory: async (item: InventoryItem) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...item, branch_id: item.branchId, min_stock: item.minStock })
  })),

  getOrders: async (branchId?: string): Promise<Order[]> => {
    const url = branchId ? `${ACTIVE_API_URL}/orders?branch_id=${branchId}` : `${ACTIVE_API_URL}/orders`;
    const data = await ApiService.handleResponse(await fetch(url));
    return data.map((o: any) => ({
      ...o,
      id: String(o.id),
      branchId: o.branch_id,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      totalAmount: Number(o.total_amount),
      paidAmount: Number(o.paid_amount),
      paymentMethod: o.payment_method,
      createdAt: new Date(o.created_at),
      items: JSON.parse(o.items_json || '[]')
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

  getCategories: async (): Promise<CategoryItem[]> => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/categories`)),
  upsertCategory: async (category: CategoryItem) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(category) })),
  
  getCustomers: async (): Promise<Customer[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/customers`));
    return data.map((c: any) => ({ ...c, id: String(c.id), totalOrders: Number(c.total_orders), totalSpent: Number(c.total_spent), joinDate: new Date(c.created_at) }));
  },

  upsertCustomer: async (customer: Customer) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...customer, total_orders: customer.totalOrders, total_spent: customer.totalSpent })
  })),

  getBranches: async (): Promise<Branch[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/branches`));
    return data.map((b: any) => ({ ...b, id: String(b.id), isMainBranch: Boolean(Number(b.is_main_branch)) }));
  },

  upsertBranch: async (branch: Branch) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/branches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...branch, is_main_branch: branch.isMainBranch ? 1 : 0 })
  })),

  getUsers: async (): Promise<User[]> => {
    const data = await ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/users`));
    return data.map((u: any) => ({ ...u, id: String(u.id), role: u.role as UserRole, branchId: u.branch_id }));
  },

  upsertUser: async (user: User) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...user, branch_id: user.branchId })
  })),

  // Fixed delete methods to properly await fetch responses
  deleteUser: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/users/${id}`, { method: 'DELETE' })),
  deleteProduct: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/products/${id}`, { method: 'DELETE' })),
  deleteInventory: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/inventory/${id}`, { method: 'DELETE' })),
  deleteCategory: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/categories/${id}`, { method: 'DELETE' })),
  deleteBranch: async (id: string) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/branches/${id}`, { method: 'DELETE' })),

  sendWhatsapp: async (token: string, target: string, message: string) => {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': token },
      body: new URLSearchParams({ target, message })
    });
    return ApiService.handleResponse(response);
  },

  syncAll: async (payload: any) => ApiService.handleResponse(await fetch(`${ACTIVE_API_URL}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }))
};