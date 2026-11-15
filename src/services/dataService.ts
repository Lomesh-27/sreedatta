import { db, StockTransactionRecord } from '../db/warehouseDB';
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
  DailySummary
} from '@shared/schema';
import { calculateSaleGross, calculateSaleNet, generateId, generateInvoiceNumber } from '@shared/calculations';

export async function fetchAllProducts(): Promise<Product[]> {
  return await db.products.toArray();
}

export async function fetchAllCustomers(): Promise<Customer[]> {
  return await db.customers.toArray();
}

export async function fetchAllSuppliers(): Promise<Supplier[]> {
  return await db.suppliers.toArray();
}

export async function fetchAllWorkers(): Promise<Worker[]> {
  return await db.workers.toArray();
}

export async function fetchAllStockTransactions(): Promise<StockTransactionRecord[]> {
  return await db.stock_transactions.orderBy('date').reverse().toArray();
}

export async function fetchAllSales(): Promise<Sale[]> {
  return await db.sales.orderBy('date').reverse().toArray();
}

export async function fetchSaleItems(saleId?: string): Promise<SaleItem[]> {
  if (saleId) {
    return await db.sale_items.where('saleId').equals(saleId).toArray();
  }
  return await db.sale_items.toArray();
}

export async function fetchAllPayments(): Promise<Payment[]> {
  return await db.payments.orderBy('paymentDate').reverse().toArray();
}

export async function fetchAllExpenses(): Promise<Expense[]> {
  return await db.expenses.orderBy('date').reverse().toArray();
}

export async function fetchAllAttendance(): Promise<WorkerAttendance[]> {
  return await db.attendance.orderBy('date').reverse().toArray();
}

export async function fetchImportHistory() {
  return await db.import_history.orderBy('importedAt').reverse().toArray();
}

/**
 * Add or update a product
 */
export async function saveProduct(product: Partial<Product>): Promise<string> {
  const id = product.id || generateId('PRD');
  const record: Product = {
    id,
    code: product.code || id,
    name: product.name || 'Unnamed Product',
    category: product.category || 'General',
    unit: product.unit || 'Kg',
    purchasePrice: Number(product.purchasePrice || 0),
    sellingPrice: Number(product.sellingPrice || 0),
    minimumStock: Number(product.minimumStock || 0),
    isActive: product.isActive !== undefined ? product.isActive : true,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await db.products.put(record);
  return id;
}

/**
 * Add Stock In
 */
export async function addStockIn(input: {
  date: string;
  time?: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  invoiceReferenceNumber: string;
  notes?: string;
}): Promise<string> {
  const id = generateId('STK-IN');
  const now = new Date();
  const time = input.time || now.toTimeString().slice(0, 8);
  const totalPurchaseValue = Number((input.quantity * input.purchasePrice).toFixed(2));

  const record: StockTransactionRecord = {
    id,
    type: 'IN',
    date: input.date,
    time,
    productId: input.productId,
    productName: input.productName,
    quantity: input.quantity,
    unit: input.unit,
    unitPrice: input.purchasePrice,
    totalValue: totalPurchaseValue,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    invoiceReferenceNumber: input.invoiceReferenceNumber,
    notes: input.notes,
    createdAt: now.toISOString()
  };

  await db.stock_transactions.put(record);
  return id;
}

/**
 * Add Stock Out
 */
export async function addStockOut(input: {
  date: string;
  time?: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  reason: 'SALE' | 'DAMAGE' | 'EXPIRY' | 'INTERNAL_USE' | 'SAMPLE' | 'RETURN_TO_SUPPLIER';
  recipient: string;
  responsibleWorkerId: string;
  responsibleWorkerName: string;
  notes?: string;
  allowNegativeOverride?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  // Check available stock first
  const inv = await getProductAvailableStock(input.productId);
  if (!input.allowNegativeOverride && inv < input.quantity) {
    return {
      success: false,
      error: `Insufficient stock! Available: ${inv} ${input.unit}, requested: ${input.quantity} ${input.unit}.`
    };
  }

  const id = generateId('STK-OUT');
  const now = new Date();
  const time = input.time || now.toTimeString().slice(0, 8);

  const record: StockTransactionRecord = {
    id,
    type: 'OUT',
    date: input.date,
    time,
    productId: input.productId,
    productName: input.productName,
    quantity: input.quantity,
    unit: input.unit,
    reason: input.reason,
    recipient: input.recipient,
    responsibleWorkerId: input.responsibleWorkerId,
    responsibleWorkerName: input.responsibleWorkerName,
    notes: input.notes,
    createdAt: now.toISOString()
  };

  await db.stock_transactions.put(record);
  return { success: true, id };
}

/**
 * Process a complete Multi-Item Sale
 */
export async function createSaleTransaction(input: {
  date: string;
  customerId: string;
  customerName: string;
  workerId: string;
  workerName: string;
  discountAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
  allowNegativeStock?: boolean;
}): Promise<{ success: boolean; saleId?: string; error?: string }> {
  if (!input.items || input.items.length === 0) {
    return { success: false, error: 'Sale must contain at least one product.' };
  }

  // Pre-validate stock for every item
  if (!input.allowNegativeStock) {
    for (const item of input.items) {
      const avail = await getProductAvailableStock(item.productId);
      if (avail < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for product "${item.productName}". Available: ${avail}, required: ${item.quantity}.`
        };
      }
    }
  }

  const saleId = generateId('SAL');
  const invoiceNumber = generateInvoiceNumber();
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);

  const grossAmount = calculateSaleGross(input.items);
  const netAmount = calculateSaleNet(grossAmount, input.discountAmount || 0);

  const saleRecord: Sale = {
    id: saleId,
    invoiceNumber,
    date: input.date,
    time,
    customerId: input.customerId,
    customerName: input.customerName,
    grossAmount,
    discountAmount: input.discountAmount || 0,
    netAmount,
    paymentMethod: input.paymentMethod,
    workerId: input.workerId,
    workerName: input.workerName,
    notes: input.notes,
    createdAt: now.toISOString()
  };

  const saleItemRecords: SaleItem[] = input.items.map(it => ({
    id: generateId('SLI'),
    saleId,
    productId: it.productId,
    productName: it.productName,
    quantity: it.quantity,
    unit: it.unit,
    unitPrice: it.unitPrice,
    totalAmount: Number((it.quantity * it.unitPrice).toFixed(2))
  }));

  // Create corresponding Stock Out records for inventory reduction
  const stockOutRecords: StockTransactionRecord[] = input.items.map(it => ({
    id: generateId('STK-OUT'),
    type: 'OUT',
    date: input.date,
    time,
    productId: it.productId,
    productName: it.productName,
    quantity: it.quantity,
    unit: it.unit,
    reason: 'SALE',
    recipient: input.customerName,
    responsibleWorkerId: input.workerId,
    responsibleWorkerName: input.workerName,
    saleId,
    notes: `Sale ${invoiceNumber}`,
    createdAt: now.toISOString()
  }));

  // Automatic Payment record if paid immediately
  let paymentRecord: Payment | null = null;
  if (input.paymentMethod !== 'CREDIT' && netAmount > 0) {
    paymentRecord = {
      id: generateId('PAY'),
      transactionId: `TXN-${saleId}`,
      referenceType: 'SALE',
      referenceId: saleId,
      amount: netAmount,
      paymentMethod: input.paymentMethod as any,
      paymentDate: input.date,
      notes: `Payment for ${invoiceNumber}`,
      createdAt: now.toISOString()
    };
  }

  // Atomic database write
  await db.transaction('rw', [db.sales, db.sale_items, db.stock_transactions, db.payments], async () => {
    await db.sales.put(saleRecord);
    await db.sale_items.bulkPut(saleItemRecords);
    await db.stock_transactions.bulkPut(stockOutRecords);
    if (paymentRecord) {
      await db.payments.put(paymentRecord);
    }
  });

  return { success: true, saleId };
}

/**
 * Get available stock balance for a single product
 */
export async function getProductAvailableStock(productId: string): Promise<number> {
  const txns = await db.stock_transactions.where('productId').equals(productId).toArray();
  let inQty = 0;
  let outQty = 0;
  for (const t of txns) {
    if (t.type === 'IN') inQty += Number(t.quantity || 0);
    else if (t.type === 'OUT') outQty += Number(t.quantity || 0);
  }
  return Number((inQty - outQty).toFixed(2));
}

/**
 * Reset database and load sample dataset
 */
export async function resetAndLoadSampleData(sample: any) {
  await db.transaction('rw', [
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
    await db.products.clear();
    await db.customers.clear();
    await db.suppliers.clear();
    await db.workers.clear();
    await db.stock_transactions.clear();
    await db.sales.clear();
    await db.sale_items.clear();
    await db.payments.clear();
    await db.discounts.clear();
    await db.expenses.clear();
    await db.attendance.clear();

    await db.products.bulkPut(sample.products);
    await db.customers.bulkPut(sample.customers);
    await db.suppliers.bulkPut(sample.suppliers);
    await db.workers.bulkPut(sample.workers);

    // Map Stock In & Out
    const txns: StockTransactionRecord[] = [];
    for (const si of sample.stockIn) {
      txns.push({
        id: si.id,
        type: 'IN',
        date: si.date,
        time: si.time,
        productId: si.productId,
        productName: si.productName,
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
    for (const so of sample.stockOut) {
      txns.push({
        id: so.id,
        type: 'OUT',
        date: so.date,
        time: so.time,
        productId: so.productId,
        productName: so.productName,
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
    await db.stock_transactions.bulkPut(txns);
    await db.sales.bulkPut(sample.sales);
    await db.sale_items.bulkPut(sample.saleItems);
    await db.payments.bulkPut(sample.payments);
    await db.discounts.bulkPut(sample.discounts);
    await db.expenses.bulkPut(sample.expenses);
    await db.attendance.bulkPut(sample.attendance);
  });
}
