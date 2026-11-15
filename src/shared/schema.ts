/**
 * SREE DATTA AQUA CHEMICALS - WAREHOUSE MANAGEMENT SYSTEM
 * Standardized Shared Schema & Types
 * Schema Version: 1.0.0
 */

export const SCHEMA_VERSION = '1.0.0';

export interface Product {
  id: string; // PRD-XXXX
  code: string;
  name: string;
  category: string;
  unit: string; // e.g., 'Kg', 'Litre', 'Bag', 'Can', 'Drum', 'Bottle'
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt?: string;
}

export interface Customer {
  id: string; // CUST-XXXX
  name: string;
  phone: string;
  address: string;
  businessName: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string; // SUPP-XXXX
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Worker {
  id: string; // WRK-XXXX
  name: string;
  contactInfo: string;
  designation: string;
  joiningDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
}

export interface StockIn {
  id: string; // STK-IN-XXXX
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  productId: string;
  productName?: string;
  supplierId: string;
  supplierName?: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  totalPurchaseValue: number;
  invoiceReferenceNumber: string;
  notes?: string;
  createdAt: string;
}

export interface StockOut {
  id: string; // STK-OUT-XXXX
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  productId: string;
  productName?: string;
  quantity: number;
  unit: string;
  reason: 'SALE' | 'DAMAGE' | 'EXPIRY' | 'INTERNAL_USE' | 'SAMPLE' | 'RETURN_TO_SUPPLIER';
  recipient: string;
  responsibleWorkerId: string;
  responsibleWorkerName?: string;
  notes?: string;
  saleId?: string; // Linked sale if reason is SALE
  createdAt: string;
}

export interface SaleItem {
  id: string; // SLI-XXXX
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number; // quantity * unitPrice
}

export interface Sale {
  id: string; // SAL-XXXX
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  customerId: string;
  customerName?: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number; // grossAmount - discountAmount
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
  workerId: string;
  workerName?: string;
  notes?: string;
  items?: SaleItem[];
  createdAt: string;
}

export interface Payment {
  id: string; // PAY-XXXX
  transactionId: string; // unique business identifier
  referenceType: 'SALE' | 'STOCK_IN' | 'EXPENSE' | 'CUSTOMER_CREDIT';
  referenceId: string; // e.g. SAL-XXXX
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  paymentDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface Discount {
  id: string; // DSC-XXXX
  saleId: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  reason: string;
  createdAt: string;
}

export interface Expense {
  id: string; // EXP-XXXX
  date: string; // YYYY-MM-DD
  category: 'TRANSPORT' | 'LABOUR' | 'MAINTENANCE' | 'ELECTRICITY' | 'PACKAGING' | 'ADMIN' | 'OTHER';
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  createdAt: string;
}

export interface WorkerAttendance {
  id: string; // ATT-XXXX
  date: string; // YYYY-MM-DD
  workerId: string;
  workerName?: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
  notes?: string;
  createdAt: string;
}

export interface DailySummary {
  summaryDate: string; // YYYY-MM-DD
  totalSalesGross: number;
  totalDiscounts: number;
  totalSalesNet: number;
  totalStockInValue: number;
  totalExpenses: number;
  totalPaymentsCollected: number;
  newStockInTransactions: number;
  newStockOutTransactions: number;
  totalSalesCount: number;
  generatedAt: string;
}

export interface ImportHistory {
  id: string; // IMP-XXXX
  filename: string;
  importedAt: string; // ISO 8601
  totalSheets: number;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  summaryJson: string;
}

/**
 * Standard Sheet Names for Excel Export & Import
 */
export const EXCEL_SHEET_NAMES = {
  PRODUCTS: 'Products',
  CUSTOMERS: 'Customers',
  SUPPLIERS: 'Suppliers',
  WORKERS: 'Workers',
  STOCK_IN: 'Stock_In',
  STOCK_OUT: 'Stock_Out',
  SALES: 'Sales',
  SALE_ITEMS: 'Sale_Items',
  PAYMENTS: 'Payments',
  DISCOUNTS: 'Discounts',
  EXPENSES: 'Expenses',
  ATTENDANCE: 'Attendance',
  DAILY_SUMMARY: 'Daily_Summary',
  METADATA: '_Metadata'
} as const;

/**
 * Standard Column Headers for each Worksheet
 */
export const EXCEL_HEADERS = {
  [EXCEL_SHEET_NAMES.PRODUCTS]: [
    'ProductID', 'ProductCode', 'ProductName', 'Category', 'Unit',
    'PurchasePrice', 'SellingPrice', 'MinimumStock', 'IsActive', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.CUSTOMERS]: [
    'CustomerID', 'Name', 'Phone', 'Address', 'BusinessName', 'Notes', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.SUPPLIERS]: [
    'SupplierID', 'Name', 'Phone', 'Address', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.WORKERS]: [
    'WorkerID', 'Name', 'ContactInfo', 'Designation', 'JoiningDate', 'IsActive', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.STOCK_IN]: [
    'TransactionID', 'Date', 'Time', 'ProductID', 'ProductName',
    'SupplierID', 'SupplierName', 'Quantity', 'Unit', 'PurchasePrice',
    'TotalPurchaseValue', 'InvoiceReferenceNumber', 'Notes', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.STOCK_OUT]: [
    'TransactionID', 'Date', 'Time', 'ProductID', 'ProductName',
    'Quantity', 'Unit', 'Reason', 'Recipient', 'ResponsibleWorkerID',
    'ResponsibleWorkerName', 'Notes', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.SALES]: [
    'SaleID', 'InvoiceNumber', 'Date', 'Time', 'CustomerID', 'CustomerName',
    'GrossAmount', 'DiscountAmount', 'NetAmount', 'PaymentMethod',
    'WorkerID', 'WorkerName', 'Notes', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.SALE_ITEMS]: [
    'ItemID', 'SaleID', 'ProductID', 'ProductName', 'Quantity', 'Unit',
    'UnitPrice', 'TotalAmount'
  ],
  [EXCEL_SHEET_NAMES.PAYMENTS]: [
    'PaymentID', 'TransactionID', 'ReferenceType', 'ReferenceID', 'Amount',
    'PaymentMethod', 'PaymentDate', 'Notes', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.DISCOUNTS]: [
    'DiscountID', 'SaleID', 'DiscountType', 'DiscountValue', 'Reason', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.EXPENSES]: [
    'ExpenseID', 'Date', 'Category', 'Description', 'Amount', 'PaymentMethod', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.ATTENDANCE]: [
    'AttendanceID', 'Date', 'WorkerID', 'WorkerName', 'Status', 'Notes', 'CreatedAt'
  ],
  [EXCEL_SHEET_NAMES.DAILY_SUMMARY]: [
    'SummaryDate', 'TotalSalesGross', 'TotalDiscounts', 'TotalSalesNet',
    'TotalStockInValue', 'TotalExpenses', 'TotalPaymentsCollected',
    'NewStockInTransactions', 'NewStockOutTransactions', 'TotalSalesCount', 'GeneratedAt'
  ],
  [EXCEL_SHEET_NAMES.METADATA]: [
    'Key', 'Value'
  ]
};
