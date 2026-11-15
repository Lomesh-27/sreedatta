/**
 * SREE DATTA AQUA CHEMICALS - BUSINESS LOGIC & CALCULATION ENGINE
 * Pure TypeScript functions used by both mobile (SQLite) and web (Dexie/IndexedDB)
 */

import { Product, StockIn, StockOut, Sale, SaleItem, Payment, Expense } from './schema';

/**
 * Format a Date object or ISO string to Asia/Kolkata DD-MM-YYYY format
 */
export function formatDateKolkata(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format a Date object to YYYY-MM-DD for database query filtering
 */
export function toISODateString(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Calculate Gross Amount for a single line item
 */
export function calculateLineGross(quantity: number, unitPrice: number): number {
  if (quantity < 0 || unitPrice < 0) return 0;
  return Number((quantity * unitPrice).toFixed(2));
}

/**
 * Calculate Total Gross Amount from an array of sale items
 */
export function calculateSaleGross(items: Array<{ quantity: number; unitPrice: number }>): number {
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  return Number(total.toFixed(2));
}

/**
 * Calculate Net Sale Amount = Gross - Discount
 * Ensures net amount is never negative
 */
export function calculateSaleNet(grossAmount: number, discountAmount: number): number {
  const validDiscount = Math.max(0, discountAmount || 0);
  const net = Math.max(0, grossAmount - validDiscount);
  return Number(net.toFixed(2));
}

/**
 * Compute stock balance for a product given all its historical In and Out movements
 */
export function calculateStockBalance(
  openingStock: number = 0,
  stockInList: Array<{ productId: string; quantity: number }>,
  stockOutList: Array<{ productId: string; quantity: number }>,
  targetProductId: string
): number {
  const totalIn = stockInList
    .filter(item => item.productId === targetProductId)
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const totalOut = stockOutList
    .filter(item => item.productId === targetProductId)
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const closing = openingStock + totalIn - totalOut;
  return Number(closing.toFixed(2));
}

/**
 * Check if a prospective stock out or sale would cause negative inventory
 * Returns { allowed: boolean, currentStock: number, projectedStock: number, error?: string }
 */
export function validateStockAvailability(
  currentStock: number,
  deductQuantity: number,
  allowOverride: boolean = false
): { allowed: boolean; currentStock: number; projectedStock: number; error?: string } {
  if (deductQuantity <= 0) {
    return {
      allowed: false,
      currentStock,
      projectedStock: currentStock,
      error: 'Deduction quantity must be greater than zero.'
    };
  }

  const projectedStock = Number((currentStock - deductQuantity).toFixed(2));

  if (projectedStock < 0 && !allowOverride) {
    return {
      allowed: false,
      currentStock,
      projectedStock,
      error: `Insufficient stock! Current available: ${currentStock}, requested deduction: ${deductQuantity}. Negative stock prevented.`
    };
  }

  return {
    allowed: true,
    currentStock,
    projectedStock
  };
}

/**
 * Calculate Customer Outstanding Balance:
 * Total Net Sales to Customer MINUS Total Payments received from Customer
 */
export function calculateCustomerOutstanding(
  customerSales: Sale[],
  customerPayments: Payment[]
): { totalSalesNet: number; totalPaid: number; outstanding: number } {
  const totalSalesNet = customerSales.reduce((acc, s) => acc + (s.netAmount || 0), 0);
  const totalPaid = customerPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const outstanding = Math.max(0, Number((totalSalesNet - totalPaid).toFixed(2)));

  return {
    totalSalesNet: Number(totalSalesNet.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    outstanding
  };
}

/**
 * Generate standardized IDs with readable prefixes and timestamp components
 */
export function generateId(prefix: 'PRD' | 'CUST' | 'SUPP' | 'WRK' | 'STK-IN' | 'STK-OUT' | 'SAL' | 'SLI' | 'PAY' | 'DSC' | 'EXP' | 'ATT' | 'INV' | 'IMP'): string {
  const now = new Date();
  const datePart = now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${datePart}-${randomPart}`;
}

/**
 * Generate Invoice Number
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${random}`;
}
