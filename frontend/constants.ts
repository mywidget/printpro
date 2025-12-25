
import { Product, PricingType, InventoryItem } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  // Added branchId: 'br-main' to all initial inventory items
  { id: 'mat-1', name: 'Sticker Chromo A3+', category: 'Paper', stock: 500, minStock: 50, unit: 'sheet', branchId: 'br-main' },
  { id: 'mat-2', name: 'Flexi China 280gr', category: 'Large Format', stock: 100, minStock: 20, unit: 'meter', branchId: 'br-main' },
  { id: 'mat-3', name: 'Art Carton 260gr A3+', category: 'Paper', stock: 1000, minStock: 100, unit: 'sheet', branchId: 'br-main' },
  { id: 'mat-4', name: 'Albatros Paper', category: 'Indoor', stock: 50, minStock: 10, unit: 'meter', branchId: 'br-main' },
  { id: 'mat-5', name: 'Stand X-Banner 60x160', category: 'Display', stock: 30, minStock: 5, unit: 'pcs', branchId: 'br-main' },
  { id: 'mat-6', name: 'Tinta Solvent (Cyan)', category: 'Ink', stock: 5000, minStock: 500, unit: 'ml', branchId: 'br-main' },
  { id: 'mat-7', name: 'Laminasi Doff A3+', category: 'Finishing', stock: 200, minStock: 20, unit: 'sheet', branchId: 'br-main' },
];

export const PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Sticker Chromo A3+', 
    categoryId: 'cat-4', 
    pricingType: PricingType.UNIT, 
    basePrice: 8000, 
    costPrice: 3500, 
    unit: 'sheet', 
    description: 'Stiker kertas glossy untuk label makanan',
    materials: [
      { materialId: 'mat-1', quantityPerUnit: 1, isRecoverable: false }
    ]
  },
  { 
    id: '2', 
    name: 'Banner Flexi 280gr', 
    categoryId: 'cat-2', 
    pricingType: PricingType.DIMENSION, 
    basePrice: 20000, 
    costPrice: 9500, 
    unit: 'meter', 
    description: 'Spanduk outdoor standar',
    materials: [
      { materialId: 'mat-2', quantityPerUnit: 1, isRecoverable: false },
      { materialId: 'mat-6', quantityPerUnit: 5, isRecoverable: false } // Anggap 5ml per meter
    ]
  },
  { 
    id: '3', 
    name: 'Kartu Nama Matte', 
    categoryId: 'cat-1', 
    pricingType: PricingType.UNIT, 
    basePrice: 35000, 
    costPrice: 12000, 
    unit: 'box', 
    description: '1 Box isi 100 lbr, Laminasi Doff',
    materials: [
      { materialId: 'mat-3', quantityPerUnit: 10, isRecoverable: false }, // 10 lembar A3+ per box
      { materialId: 'mat-7', quantityPerUnit: 10, isRecoverable: false }
    ]
  },
  { 
    id: '4', 
    name: 'Buku Yasin 128 Halaman', 
    categoryId: 'cat-1', 
    pricingType: PricingType.UNIT, 
    basePrice: 15000, 
    costPrice: 7000, 
    unit: 'pcs', 
    description: 'Softcover, Art Paper interior',
    materials: [
      { materialId: 'mat-3', quantityPerUnit: 0.5, isRecoverable: false }
    ]
  },
  { 
    id: '6', 
    name: 'X-Banner Studio', 
    categoryId: 'cat-3', 
    pricingType: PricingType.UNIT, 
    basePrice: 65000, 
    costPrice: 35000, 
    unit: 'pcs', 
    description: 'Termasuk stand dan bahan Albatros',
    materials: [
      { materialId: 'mat-4', quantityPerUnit: 1.6, isRecoverable: false },
      { materialId: 'mat-5', quantityPerUnit: 1, isRecoverable: true } // Stand bisa dipakai ulang jika retur
    ]
  },
];

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  DESIGNING: 'bg-blue-100 text-blue-700 border-blue-200',
  PRINTING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  FINISHING: 'bg-purple-100 text-purple-700 border-purple-200',
  READY: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DONE: 'bg-slate-100 text-slate-500 border-slate-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  RETURNED: 'bg-pink-100 text-pink-700 border-pink-200',
};
