
import { Order, Product, InventoryItem, Customer, StoreSettings, OrderStatus, CategoryItem, User, UserRole, PaymentMethod } from '../types';

const getApiBaseUrl = () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return '/api';
    // return `${window.location.origin}/index.php/api`;
    return 'https://apiprintpro.go/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
    * Helper untuk menangani response dari CI4.
    * CI4 mengirimkan format: { success: boolean, data: any, message: string }
*/
const handleResponse = async (response: Response) => {
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
    
    // Jika CI4 mengirimkan property 'data', ambil isinya. Jika tidak, ambil json utuh.
    return json.data !== undefined ? json.data : json;
};

export const ApiService = {
    login: async (username: string, password: string): Promise<User> => {
        const data = await handleResponse(await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }));
        
        return {
            id: String(data.id),
            username: data.username,
            name: data.name || data.username || 'User',
            role: (data.role as UserRole) || UserRole.STAFF
        };
    },
    
    getUsers: async (): Promise<User[]> => {
        const data = await handleResponse(await fetch(`${API_BASE_URL}/users`));
        return Array.isArray(data) ? data.map(u => ({
            id: String(u.id),
            username: u.username,
            name: u.name || u.username || 'User',
            role: (u.role as UserRole) || UserRole.STAFF
        })) : [];
    },
    
    upsertUser: async (user: User) => handleResponse(await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    })),
    
    deleteUser: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' })),
    
    getOrders: async (): Promise<Order[]> => {
        const data = await handleResponse(await fetch(`${API_BASE_URL}/orders`));
        if (!Array.isArray(data)) return [];
        
        return data.map(o => ({
            id: String(o.id),
            customerName: o.customer_name || o.customerName || 'Umum',
            customerPhone: o.customer_phone || o.customerPhone || '',
            status: (o.status as OrderStatus) || OrderStatus.PENDING,
            totalAmount: Number(o.total_amount || o.totalAmount || 0),
            paidAmount: Number(o.paid_amount || o.paidAmount || 0),
            paymentMethod: (o.payment_method as PaymentMethod) || PaymentMethod.CASH,
            createdAt: new Date(o.created_at || o.createdAt || Date.now()),
            notes: o.notes || '',
            items: (typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items || [])).map((item: any) => ({
                ...item,
                unitPrice: Number(item.unitPrice || item.unit_price || 0),
                totalPrice: Number(item.totalPrice || item.total_price || 0)
            }))
        }));
    },
    
    upsertOrder: async (order: Order) => {
        const payload = {
            id: order.id,
            customer_name: order.customerName,
            customer_phone: order.customerPhone,
            items_json: JSON.stringify(order.items),
            status: order.status,
            total_amount: order.totalAmount,
            paid_amount: order.paidAmount,
            payment_method: order.paymentMethod,
            created_at: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt
        };
        return handleResponse(await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }));
    },
    
    getProducts: async (): Promise<Product[]> => {
        const data = await handleResponse(await fetch(`${API_BASE_URL}/products`));
        if (!Array.isArray(data)) return [];
        
        return data.map(p => ({
            id: String(p.id),
            name: p.name,
            categoryId: p.category_id || p.categoryId,
            pricingType: p.pricing_type || p.pricingType,
            basePrice: Number(p.base_price || p.basePrice || 0),
            costPrice: Number(p.cost_price || p.costPrice || 0),
            unit: p.unit || 'sheet',
            description: p.description || '',
            priceRanges: typeof p.price_ranges === 'string' ? JSON.parse(p.price_ranges) : (p.priceRanges || [])
        }));
    },
    
    upsertProduct: async (product: Product) => {
        const payload = {
            ...product,
            category_id: product.categoryId,
            pricing_type: product.pricingType,
            base_price: product.basePrice,
            cost_price: product.costPrice,
            price_ranges: JSON.stringify(product.priceRanges || [])
        };
        return handleResponse(await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }));
    },
    
    getInventory: async (): Promise<InventoryItem[]> => {
        const data = await handleResponse(await fetch(`${API_BASE_URL}/inventory`));
        if (!Array.isArray(data)) return [];
        
        return data.map(i => ({
            id: String(i.id),
            name: i.name,
            category: i.category,
            stock: Number(i.stock || 0),
            minStock: Number(i.min_stock || i.minStock || 0),
            unit: i.unit || 'unit'
        }));
    },
    
    // Fix: Add upsertInventory method
    upsertInventory: async (item: InventoryItem) => handleResponse(await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    })),
    
    getCategories: async (): Promise<CategoryItem[]> => {
        const data = await handleResponse(await fetch(`${API_BASE_URL}/categories`));
        return Array.isArray(data) ? data : [];
    },
    
    // Fix: Add upsertCategory method
    upsertCategory: async (category: CategoryItem) => handleResponse(await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
    })),
    
    getCustomers: async (): Promise<Customer[]> => {
        const data = await handleResponse(await fetch(`${API_BASE_URL}/customers`));
        if (!Array.isArray(data)) return [];
        
        return data.map(c => ({
            id: String(c.id),
            name: c.name,
            phone: c.phone,
            email: c.email || '',
            totalOrders: Number(c.total_orders || c.totalOrders || 0),
            totalSpent: Number(c.total_spent || c.totalSpent || 0),
            joinDate: new Date(c.join_date || c.joinDate || Date.now())
        }));
    },
    
    upsertCustomer: async (customer: any) => handleResponse(await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
    })),
    
    getSettings: async (): Promise<StoreSettings> => {
        const data = await handleResponse(await fetch(`${API_BASE_URL}/settings`));
        return {
            name: data.name || 'PrintPro',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            footerNote: data.footerNote || data.footer_note || '',
            currency: data.currency || 'IDR',
            fonnteToken: data.fonnte_token || data.fonnteToken || ''
        };
    },
    
    saveSettings: async (settings: StoreSettings) => {
        const payload = {
            name: settings.name,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            footer_note: settings.footerNote,
            currency: settings.currency,
            fonnte_token: settings.fonnteToken
        };
        return handleResponse(await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }));
    },
    
    deleteProduct: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' })),
    deleteCategory: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' })),
    deleteInventory: async (id: string) => handleResponse(await fetch(`${API_BASE_URL}/inventory/${id}`, { method: 'DELETE' })),
    
    syncAll: async (payload: any) => handleResponse(await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })),
    
    // Fonnte WhatsApp Integration
    sendWhatsapp: async (token: string, target: string, message: string) => {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token
            },
            body: new URLSearchParams({
                target: target,
                message: message
            })
        });
        return handleResponse(response);
    }
};
