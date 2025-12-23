
import { Product, PricingType } from './types';

// Fix: Removed non-existent Category enum and updated 'category' to 'categoryId' as per types.ts
export const PRODUCTS: Product[] = [
  { id: '1', name: 'Sticker Chromo A3+', categoryId: 'cat-4', pricingType: PricingType.UNIT, basePrice: 8000, costPrice: 3500, unit: 'sheet', description: 'Stiker kertas glossy untuk label makanan' },
  { id: '2', name: 'Banner Flexi 280gr', categoryId: 'cat-2', pricingType: PricingType.DIMENSION, basePrice: 20000, costPrice: 9500, unit: 'meter', description: 'Spanduk outdoor standar' },
  { id: '3', name: 'Kartu Nama Matte', categoryId: 'cat-1', pricingType: PricingType.UNIT, basePrice: 35000, costPrice: 12000, unit: 'box', description: '1 Box isi 100 lbr, Laminasi Doff' },
  { id: '4', name: 'Buku Yasin 128 Halaman', categoryId: 'cat-1', pricingType: PricingType.UNIT, basePrice: 15000, costPrice: 7000, unit: 'pcs', description: 'Softcover, Art Paper interior' },
  { id: '5', name: 'Box Packaging Custom', categoryId: 'cat-1', pricingType: PricingType.UNIT, basePrice: 5000, costPrice: 2000, unit: 'pcs', description: 'Ivory 310gr, Die cut custom' },
  { id: '6', name: 'X-Banner Studio', categoryId: 'cat-3', pricingType: PricingType.UNIT, basePrice: 65000, costPrice: 35000, unit: 'pcs', description: 'Termasuk stand dan bahan Albatros' },
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
