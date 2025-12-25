
import { Order, OrderStatus, Product, InventoryItem, StoreSettings, Customer, PricingType, CategoryItem, User, UserRole, Branch } from '../types';
import { PRODUCTS, INITIAL_INVENTORY } from '../constants';

const KEYS = {
  ORDERS: 'printpro_orders',
  PRODUCTS: 'printpro_products',
  INVENTORY: 'printpro_inventory',
  SETTINGS: 'printpro_settings',
  CUSTOMERS: 'printpro_customers',
  CATEGORIES: 'printpro_categories',
  USERS: 'printpro_users',
  BRANCHES: 'printpro_branches',
  SESSION: 'printpro_session'
};

const INITIAL_BRANCHES: Branch[] = [
  { id: 'br-main', name: 'Cabang Pusat', address: 'Jl. Utama No. 1', phone: '0812', isMainBranch: true }
];

const INITIAL_USERS: User[] = [
  { id: 'u-1', username: 'admin', name: 'Administrator', password: 'admin', role: UserRole.ADMIN, branchId: 'br-main' }
];

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Digital A3+' },
  { id: 'cat-2', name: 'Outdoor Banner' },
  { id: 'cat-3', name: 'Indoor & Studio' },
  { id: 'cat-4', name: 'Sticker & Label' }
];

export const StorageService = {
  getBranches: (): Branch[] => {
    const data = localStorage.getItem(KEYS.BRANCHES);
    return data ? JSON.parse(data) : INITIAL_BRANCHES;
  },

  saveBranches: (branches: Branch[]) => {
    localStorage.setItem(KEYS.BRANCHES, JSON.stringify(branches));
  },

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
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return null;
  },

  getOrders: (branchId?: string): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    if (!data) return [];
    try {
      const all: Order[] = JSON.parse(data).map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) }));
      return branchId ? all.filter(o => o.branchId === branchId) : all;
    } catch (e) { return []; }
  },

  saveOrder: (order: Order) => {
    const data = localStorage.getItem(KEYS.ORDERS);
    const orders = data ? JSON.parse(data) : [];
    const existingIdx = orders.findIndex((o: any) => o.id === order.id);
    let updatedOrders;
    if (existingIdx >= 0) {
      updatedOrders = [...orders];
      updatedOrders[existingIdx] = order;
    } else {
      updatedOrders = [order, ...orders];
      StorageService.adjustStockForOrder(order, 'deduct');
      StorageService.syncCustomerFromOrder(order);
    }
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(updatedOrders));
    return order;
  },

  adjustStockForOrder: (order: Order, type: 'deduct' | 'restore') => {
    const allProducts = StorageService.getProducts();
    const inventory = StorageService.getInventory();
    let changed = false;
    
    order.items.forEach(item => {
      const product = allProducts.find(p => p.id === item.productId);
      if (product?.materials) {
        product.materials.forEach(link => {
          const invIdx = inventory.findIndex(i => i.id === link.materialId && i.branchId === order.branchId);
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

  getInventory: (branchId?: string): InventoryItem[] => {
    const data = localStorage.getItem(KEYS.INVENTORY);
    const all: InventoryItem[] = data ? JSON.parse(data) : INITIAL_INVENTORY;
    return branchId ? all.filter(i => i.branchId === branchId) : all;
  },

  saveInventory: (items: InventoryItem[]) => {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
  },

  getCategories: (): CategoryItem[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  },

  saveCategories: (categories: CategoryItem[]) => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
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

  syncCustomerFromOrder: (order: Order) => {
    const customers = StorageService.getCustomers();
    const phone = (order.customerPhone || '').trim();
    const name = (order.customerName || '').trim();
    if (!phone) return;
    let existingIdx = customers.findIndex(c => c.phone === phone);
    if (existingIdx >= 0) {
      customers[existingIdx].totalOrders += 1;
      customers[existingIdx].totalSpent += order.totalAmount;
    } else {
      customers.push({
        id: `c-${Date.now()}`,
        name,
        phone,
        totalOrders: 1,
        totalSpent: order.totalAmount,
        joinDate: new Date()
      });
    }
    StorageService.saveCustomers(customers);
  },

  getSettings: (defaults: StoreSettings): StoreSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaults;
  },

  saveSettings: (settings: StoreSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Perbaikan Export: Menerima data asli bukan string mentah
  exportAllData: (customData?: any) => {
    let dataToExport: Record<string, any> = {};
    
    if (customData) {
      // Mapping keys correctly for custom state data
      dataToExport[KEYS.ORDERS] = customData.orders;
      dataToExport[KEYS.PRODUCTS] = customData.products;
      dataToExport[KEYS.INVENTORY] = customData.inventory;
      dataToExport[KEYS.CUSTOMERS] = customData.customers;
      dataToExport[KEYS.CATEGORIES] = customData.categories;
      dataToExport[KEYS.USERS] = customData.users;
      dataToExport[KEYS.BRANCHES] = customData.branches;
      dataToExport[KEYS.SETTINGS] = customData.settings;
    } else {
      // Fallback to current localStorage
      Object.values(KEYS).forEach(key => {
        const val = localStorage.getItem(key);
        dataToExport[key] = val ? JSON.parse(val) : null;
      });
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `printpro_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // Perbaikan Import: Melakukan stringify kembali sebelum simpan ke localStorage
  importData: (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          Object.entries(data).forEach(([key, value]) => {
            if (value !== null) {
              // Simpan sebagai string JSON ke localStorage agar format konsisten
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
          });
          resolve();
        } catch (err) {
          reject(new Error('Format file backup tidak valid.'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsText(file);
    });
  }
};
