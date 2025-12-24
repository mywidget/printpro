
import { Order, Product, InventoryItem, Customer, StoreSettings, OrderStatus, CategoryItem, User } from '../types';

// Sesuaikan URL ini dengan lokasi folder project CI3 Anda
const API_BASE_URL = 'https://printpro.go/api'; 

const handleResponse = async (response: Response) => {
	if (!response.ok) {
		let errorMessage = `API Error: ${response.status}`;
		try {
			const text = await response.text();
			// Menangani error DB CodeIgniter 3 yang biasanya berbentuk HTML
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
		} catch (e) {}
		throw new Error(errorMessage);
	}
	return response.json();
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
	
	deleteUser: async (id: string) => fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' }),
	
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
			categoryId: p.category_id || p.categoryId,
			basePrice: Number(p.base_price || p.basePrice),
			costPrice: Number(p.cost_price || p.costPrice),
			pricingType: p.pricing_type || p.pricingType,
			priceRanges: typeof p.price_ranges === 'string' ? JSON.parse(p.price_ranges) : (p.priceRanges || []),
			materials: typeof p.materials === 'string' ? JSON.parse(p.materials) : (p.materials || [])
		})) : [];
	},
	
	getInventory: async () => {
		const data = await handleResponse(await fetch(`${API_BASE_URL}/inventory`));
		return Array.isArray(data) ? data.map(i => ({
			...i,
			id: String(i.id),
			minStock: Number(i.min_stock || i.minStock),
			stock: Number(i.stock)
		})) : [];
	},
	
	getCategories: async () => handleResponse(await fetch(`${API_BASE_URL}/categories`)),
	
	getCustomers: async () => {
		const data = await handleResponse(await fetch(`${API_BASE_URL}/customers`));
		return Array.isArray(data) ? data.map(c => ({
			...c,
			id: String(c.id),
			totalOrders: Number(c.total_orders || c.totalOrders),
			totalSpent: Number(c.total_spent || c.totalSpent),
			joinDate: new Date(c.join_date || c.joinDate)
		})) : [];
	},
	
	getSettings: async () => handleResponse(await fetch(`${API_BASE_URL}/settings`)),
	
	upsertOrder: async (order: Order) => handleResponse(await fetch(`${API_BASE_URL}/orders`, {
		method: 'POST', 
		headers: { 'Content-Type': 'application/json' }, 
		body: JSON.stringify({
			id: order.id,
			customerName: order.customerName,
			customerPhone: order.customerPhone,
			totalAmount: order.totalAmount,
			paidAmount: order.paidAmount,
			paymentMethod: order.paymentMethod,
			items: order.items,
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
		method: 'POST', 
		headers: { 'Content-Type': 'application/json' }, 
		body: JSON.stringify(settings)
	})),
	
	deleteProduct: async (id: string) => fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' }),
	deleteCategory: async (id: string) => fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' }),
	deleteInventory: async (id: string) => fetch(`${API_BASE_URL}/inventory/${id}`, { method: 'DELETE' }),
	
	syncAll: async (payload: any) => handleResponse(await fetch(`${API_BASE_URL}/sync`, {
		method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
	}))
};
