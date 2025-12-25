
import { Order, OrderStatus, Product, InventoryItem, StoreSettings, Customer, PricingType, CategoryItem, User, UserRole } from '../types';
import { PRODUCTS, INITIAL_INVENTORY } from '../constants';

const KEYS = {
  ORDERS: 'printpro_orders',
  PRODUCTS: 'printpro_products',
  INVENTORY: 'printpro_inventory',
  SETTINGS: 'printpro_settings',
  CUSTOMERS: 'printpro_customers',
  CATEGORIES: 'printpro_categories',
  USERS: 'printpro_users',
  SESSION: 'printpro_session'
};

const INITIAL_USERS: User[] = [
  { id: 'u-1', username: 'admin', name: 'Administrator', password: 'admin', role: UserRole.ADMIN }
];

// Helper to get default categories since it's used in multiple places
const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Digital A3+' },
  { id: 'cat-2', name: 'Outdoor Banner' },
  { id: 'cat-3', name: 'Indoor & Studio' },
  { id: 'cat-4', name: 'Sticker & Label' }
];

export const StorageService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  authenticate: (username: string, password: string): User | null => {
    const users = StorageService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return null;
  },

  getCategories: (defaults: CategoryItem[] = DEFAULT_CATEGORIES): CategoryItem[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : defaults;
  },

  saveCategories: (categories: CategoryItem[]) => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getOrders: (): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    if (!data) return [];
    try {
      return JSON.parse(data).map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) }));
    } catch (e) { return []; }
  },

  saveOrder: (order: Order) => {
    const orders = StorageService.getOrders();
    const updatedOrders = [order, ...orders];
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(updatedOrders));
    StorageService.adjustStockForOrder(order, 'deduct');
    StorageService.syncCustomerFromOrder(order);
    return order;
  },

  adjustStockForOrder: (order: Order, type: 'deduct' | 'restore_full' | 'restore_recoverable') => {
    const allProducts = StorageService.getProducts();
    const inventory = StorageService.getInventory();
    let changed = false;
    order.items.forEach(item => {
      const product = allProducts.find(p => p.id === item.productId);
      if (product?.materials) {
        product.materials.forEach(link => {
          if (type === 'restore_recoverable' && !link.isRecoverable) return;
          const invIdx = inventory.findIndex(i => i.id === link.materialId);
          if (invIdx >= 0) {
            const area = (item.width || 1) * (item.height || 1);
            const total = product.pricingType === PricingType.DIMENSION 
              ? (area * item.quantity * link.quantityPerUnit)
              : (item.quantity * link.quantityPerUnit);
            if (type === 'deduct') inventory[invIdx].stock -= total;
            else inventory[invIdx].stock += total;
            changed = true;
          }
        });
      }
    });
    if (changed) StorageService.saveInventory(inventory);
  },

  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : PRODUCTS;
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(KEYS.INVENTORY);
    return data ? JSON.parse(data) : INITIAL_INVENTORY;
  },

  saveInventory: (items: InventoryItem[]) => {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
  },

  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    if (!data) return [];
    try {
      return JSON.parse(data).map((c: any) => ({ ...c, joinDate: new Date(c.joinDate) }));
    } catch (e) { return []; }
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  syncCustomerFromOrder: (order: Order): Customer[] => {
    if (!order.customerName) return StorageService.getCustomers();
    const customers = StorageService.getCustomers();
    const phone = (order.customerPhone || '').trim();
    const name = (order.customerName || '').trim();
    
    let existingIdx = -1;
    if (phone) {
      existingIdx = customers.findIndex(c => (c.phone || '').trim() === phone);
    } else {
      existingIdx = customers.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    }

    if (existingIdx >= 0) {
      customers[existingIdx].totalOrders += 1;
      customers[existingIdx].totalSpent += Number(order.totalAmount || 0);
      if (name && customers[existingIdx].name !== name) {
        customers[existingIdx].name = name;
      }
    } else {
      customers.push({
        id: `cust-${Date.now()}`,
        name: name,
        phone: phone,
        totalOrders: 1,
        totalSpent: Number(order.totalAmount || 0),
        joinDate: new Date()
      });
    }
    
    StorageService.saveCustomers(customers);
    return customers;
  },

  getSettings: (defaults: StoreSettings): StoreSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaults;
  },

  saveSettings: (settings: StoreSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  exportAllData: () => {
    // Pastikan semua data diambil, termasuk fallback ke konstanta jika localStorage masih kosong
    const fullData = {
      orders: StorageService.getOrders(),
      products: StorageService.getProducts(),
      inventory: StorageService.getInventory(),
      customers: StorageService.getCustomers(),
      settings: StorageService.getSettings({
        name: 'PrintPro Digital Solutions',
        address: '',
        phone: '',
        email: '',
        footerNote: '',
        currency: 'IDR'
      } as StoreSettings),
      categories: StorageService.getCategories(DEFAULT_CATEGORIES),
      users: StorageService.getUsers(),
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.download = `printpro_backup_${timestamp}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },

  importData: async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Validasi sederhana struktur data
          if (!data.orders && !data.products && !data.inventory) {
            throw new Error('Format file backup tidak dikenali atau data kosong.');
          }

          if (data.orders) localStorage.setItem(KEYS.ORDERS, JSON.stringify(data.orders));
          if (data.products) localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data.products));
          if (data.inventory) localStorage.setItem(KEYS.INVENTORY, JSON.stringify(data.inventory));
          if (data.customers) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data.customers));
          if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
          if (data.categories) localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(data.categories));
          if (data.users) localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
          
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat Anda.'));
      reader.readAsText(file);
    });
  }
};
