import Dexie, { Table } from 'dexie';
import {
  Product,
  Customer,
  Supplier,
  Worker,
  StockIn,
  StockOut,
  Sale,
  SaleItem,
  Expense,
  Payment,
  Discount,
  WorkerAttendance,
  ImportHistory,
  DailySummary
} from '@shared/schema';

export interface StockTransactionRecord {
  id: string;
  type: 'IN' | 'OUT';
  date: string;
  time: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalValue?: number;
  supplierId?: string;
  supplierName?: string;
  reason?: string;
  recipient?: string;
  responsibleWorkerId?: string;
  responsibleWorkerName?: string;
  invoiceReferenceNumber?: string;
  saleId?: string;
  notes?: string;
  createdAt: string;
}

export interface AppMetadataRecord {
  key: string;
  value: any;
  updatedAt: string;
}

export class SreeDattaWarehouseDB extends Dexie {
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  suppliers!: Table<Supplier, string>;
  workers!: Table<Worker, string>;
  stock_transactions!: Table<StockTransactionRecord, string>;
  sales!: Table<Sale, string>;
  sale_items!: Table<SaleItem, string>;
  expenses!: Table<Expense, string>;
  payments!: Table<Payment, string>;
  discounts!: Table<Discount, string>;
  attendance!: Table<WorkerAttendance, string>;
  import_history!: Table<ImportHistory, string>;
  app_metadata!: Table<AppMetadataRecord, string>;

  constructor() {
    super('SreeDattaWarehouseDB');

    const schemaDefinition = {
      products: 'id, code, name, category, isActive, createdAt',
      customers: 'id, name, phone, businessName, createdAt',
      suppliers: 'id, name, phone, createdAt',
      workers: 'id, name, designation, isActive, createdAt',
      stock_transactions: 'id, type, date, productId, supplierId, responsibleWorkerId, saleId, createdAt',
      sales: 'id, invoiceNumber, date, customerId, workerId, paymentMethod, createdAt',
      sale_items: 'id, saleId, productId',
      expenses: 'id, date, category, paymentMethod, createdAt',
      payments: 'id, transactionId, referenceType, referenceId, paymentDate, createdAt',
      discounts: 'id, saleId, createdAt',
      attendance: 'id, date, workerId, status, [date+workerId], createdAt',
      import_history: 'id, importedAt, status',
      app_metadata: 'key'
    };

    this.version(1).stores(schemaDefinition);
    this.version(2).stores(schemaDefinition);
  }
}

export const db = new SreeDattaWarehouseDB();

/**
 * Helper to compute real-time available stock across all products
 */
export async function getInventorySummary() {
  const products = await db.products.toArray();
  const txns = await db.stock_transactions.toArray();

  const map = new Map<string, { totalIn: number; totalOut: number; balance: number }>();
  for (const p of products) {
    map.set(p.id, { totalIn: 0, totalOut: 0, balance: 0 });
  }

  for (const t of txns) {
    const entry = map.get(t.productId) || { totalIn: 0, totalOut: 0, balance: 0 };
    if (t.type === 'IN') {
      entry.totalIn += Number(t.quantity || 0);
    } else if (t.type === 'OUT') {
      entry.totalOut += Number(t.quantity || 0);
    }
    entry.balance = entry.totalIn - entry.totalOut;
    map.set(t.productId, entry);
  }

  return products.map(p => {
    const stat = map.get(p.id) || { totalIn: 0, totalOut: 0, balance: 0 };
    return {
      product: p,
      totalIn: stat.totalIn,
      totalOut: stat.totalOut,
      availableStock: stat.balance,
      isLowStock: stat.balance <= p.minimumStock,
      stockValue: Number((stat.balance * p.purchasePrice).toFixed(2))
    };
  });
}

/**
 * Idempotent batch insertion for Excel/JSON Import
 */
export async function commitImportData(
  parsed: {
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    workers: Worker[];
    stockIn: StockIn[];
    stockOut: StockOut[];
    sales: Sale[];
    saleItems: SaleItem[];
    payments: Payment[];
    discounts: Discount[];
    expenses: Expense[];
    attendance: WorkerAttendance[];
  },
  importRecord: ImportHistory
) {
  return await db.transaction('rw', [
    db.products,
    db.customers,
    db.suppliers,
    db.workers,
    db.stock_transactions,
    db.sales,
    db.sale_items,
    db.payments,
    db.discounts,
    db.expenses,
    db.attendance,
    db.import_history
  ], async () => {
    // 1. Products
    if (parsed.products.length > 0) {
      await db.products.bulkPut(parsed.products);
    }
    // 2. Customers
    if (parsed.customers.length > 0) {
      await db.customers.bulkPut(parsed.customers);
    }
    // 3. Suppliers
    if (parsed.suppliers.length > 0) {
      await db.suppliers.bulkPut(parsed.suppliers);
    }
    // 4. Workers
    if (parsed.workers.length > 0) {
      await db.workers.bulkPut(parsed.workers);
    }

    // 5. Stock Transactions (In + Out mapped to unified table)
    const txRecords: StockTransactionRecord[] = [];
    for (const si of parsed.stockIn) {
      txRecords.push({
        id: si.id,
        type: 'IN',
        date: si.date,
        time: si.time,
        productId: si.productId,
        productName: si.productName || '',
        quantity: si.quantity,
        unit: si.unit,
        unitPrice: si.purchasePrice,
        totalValue: si.totalPurchaseValue,
        supplierId: si.supplierId,
        supplierName: si.supplierName,
        invoiceReferenceNumber: si.invoiceReferenceNumber,
        notes: si.notes,
        createdAt: si.createdAt
      });
    }
    for (const so of parsed.stockOut) {
      txRecords.push({
        id: so.id,
        type: 'OUT',
        date: so.date,
        time: so.time,
        productId: so.productId,
        productName: so.productName || '',
        quantity: so.quantity,
        unit: so.unit,
        reason: so.reason,
        recipient: so.recipient,
        responsibleWorkerId: so.responsibleWorkerId,
        responsibleWorkerName: so.responsibleWorkerName,
        saleId: so.saleId,
        notes: so.notes,
        createdAt: so.createdAt
      });
    }
    if (txRecords.length > 0) {
      await db.stock_transactions.bulkPut(txRecords);
    }

    // 6. Sales & Items
    if (parsed.sales.length > 0) {
      await db.sales.bulkPut(parsed.sales);
    }
    if (parsed.saleItems.length > 0) {
      await db.sale_items.bulkPut(parsed.saleItems);
    }

    // 7. Payments
    if (parsed.payments.length > 0) {
      await db.payments.bulkPut(parsed.payments);
    }

    // 8. Discounts
    if (parsed.discounts.length > 0) {
      await db.discounts.bulkPut(parsed.discounts);
    }

    // 9. Expenses
    if (parsed.expenses.length > 0) {
      await db.expenses.bulkPut(parsed.expenses);
    }

    // 10. Attendance
    if (parsed.attendance.length > 0) {
      await db.attendance.bulkPut(parsed.attendance);
    }

    // 11. Save import history record
    await db.import_history.put(importRecord);
  });
}
