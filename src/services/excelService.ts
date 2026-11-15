import * as XLSX from 'xlsx';
import { db } from '../db/warehouseDB';
import {
  EXCEL_SHEET_NAMES,
  EXCEL_HEADERS,
  SCHEMA_VERSION,
  Product,
  Customer,
  Supplier,
  Worker,
  StockIn,
  StockOut,
  Sale,
  SaleItem,
  Payment,
  Discount,
  Expense,
  WorkerAttendance,
  DailySummary
} from '@shared/schema';

export interface ExcelImportValidationResult {
  fileName: string;
  fileSize: number;
  totalSheets: number;
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  errors: Array<{
    sheet: string;
    rowNumber: number;
    recordId?: string;
    field: string;
    message: string;
  }>;
  duplicates: Array<{
    sheet: string;
    id: string;
    rowNumber: number;
  }>;
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
  };
}

/**
 * Export all current IndexedDB records to standardized Excel workbook
 */
export async function exportWarehouseToExcel(dateFilter?: { start?: string; end?: string; module?: string }) {
  const wb = XLSX.utils.book_new();

  const products = await db.products.toArray();
  const customers = await db.customers.toArray();
  const suppliers = await db.suppliers.toArray();
  const workers = await db.workers.toArray();
  const txns = await db.stock_transactions.toArray();
  const sales = await db.sales.toArray();
  const saleItems = await db.sale_items.toArray();
  const payments = await db.payments.toArray();
  const discounts = await db.discounts.toArray();
  const expenses = await db.expenses.toArray();
  const attendance = await db.attendance.toArray();

  // Filter Stock In and Out
  let stockInList = txns.filter(t => t.type === 'IN');
  let stockOutList = txns.filter(t => t.type === 'OUT');
  let salesList = sales;
  let expenseList = expenses;

  if (dateFilter?.start && dateFilter?.end) {
    stockInList = stockInList.filter(t => t.date >= dateFilter.start! && t.date <= dateFilter.end!);
    stockOutList = stockOutList.filter(t => t.date >= dateFilter.start! && t.date <= dateFilter.end!);
    salesList = salesList.filter(s => s.date >= dateFilter.start! && s.date <= dateFilter.end!);
    expenseList = expenseList.filter(e => e.date >= dateFilter.start! && e.date <= dateFilter.end!);
  }

  // Helper to append sheet
  const addSheet = (sheetName: string, rows: any[], headers: readonly string[]) => {
    let ws: XLSX.WorkSheet;
    if (!rows || rows.length === 0) {
      ws = XLSX.utils.aoa_to_sheet([Array.from(headers)]);
    } else {
      ws = XLSX.utils.json_to_sheet(rows, { header: Array.from(headers) });
    }
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  // 1. Products
  addSheet(EXCEL_SHEET_NAMES.PRODUCTS, products.map(p => ({
    ProductID: p.id,
    ProductCode: p.code,
    ProductName: p.name,
    Category: p.category,
    Unit: p.unit,
    PurchasePrice: p.purchasePrice,
    SellingPrice: p.sellingPrice,
    MinimumStock: p.minimumStock,
    IsActive: p.isActive ? 'YES' : 'NO',
    CreatedAt: p.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.PRODUCTS]);

  // 2. Customers
  addSheet(EXCEL_SHEET_NAMES.CUSTOMERS, customers.map(c => ({
    CustomerID: c.id,
    Name: c.name,
    Phone: c.phone,
    Address: c.address,
    BusinessName: c.businessName,
    Notes: c.notes || '',
    CreatedAt: c.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.CUSTOMERS]);

  // 3. Suppliers
  addSheet(EXCEL_SHEET_NAMES.SUPPLIERS, suppliers.map(s => ({
    SupplierID: s.id,
    Name: s.name,
    Phone: s.phone,
    Address: s.address,
    CreatedAt: s.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.SUPPLIERS]);

  // 4. Workers
  addSheet(EXCEL_SHEET_NAMES.WORKERS, workers.map(w => ({
    WorkerID: w.id,
    Name: w.name,
    ContactInfo: w.contactInfo,
    Designation: w.designation,
    JoiningDate: w.joiningDate,
    IsActive: w.isActive ? 'YES' : 'NO',
    CreatedAt: w.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.WORKERS]);

  // 5. Stock_In
  addSheet(EXCEL_SHEET_NAMES.STOCK_IN, stockInList.map(si => ({
    TransactionID: si.id,
    Date: si.date,
    Time: si.time,
    ProductID: si.productId,
    ProductName: si.productName,
    SupplierID: si.supplierId || '',
    SupplierName: si.supplierName || '',
    Quantity: si.quantity,
    Unit: si.unit,
    PurchasePrice: si.unitPrice || 0,
    TotalPurchaseValue: si.totalValue || 0,
    InvoiceReferenceNumber: si.invoiceReferenceNumber || '',
    Notes: si.notes || '',
    CreatedAt: si.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.STOCK_IN]);

  // 6. Stock_Out
  addSheet(EXCEL_SHEET_NAMES.STOCK_OUT, stockOutList.map(so => ({
    TransactionID: so.id,
    Date: so.date,
    Time: so.time,
    ProductID: so.productId,
    ProductName: so.productName,
    Quantity: so.quantity,
    Unit: so.unit,
    Reason: so.reason || 'SALE',
    Recipient: so.recipient || '',
    ResponsibleWorkerID: so.responsibleWorkerId || '',
    ResponsibleWorkerName: so.responsibleWorkerName || '',
    Notes: so.notes || '',
    CreatedAt: so.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.STOCK_OUT]);

  // 7. Sales
  addSheet(EXCEL_SHEET_NAMES.SALES, salesList.map(s => ({
    SaleID: s.id,
    InvoiceNumber: s.invoiceNumber,
    Date: s.date,
    Time: s.time,
    CustomerID: s.customerId,
    CustomerName: s.customerName || '',
    GrossAmount: s.grossAmount,
    DiscountAmount: s.discountAmount,
    NetAmount: s.netAmount,
    PaymentMethod: s.paymentMethod,
    WorkerID: s.workerId,
    WorkerName: s.workerName || '',
    Notes: s.notes || '',
    CreatedAt: s.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.SALES]);

  // 8. Sale_Items
  addSheet(EXCEL_SHEET_NAMES.SALE_ITEMS, saleItems.map(it => ({
    ItemID: it.id,
    SaleID: it.saleId,
    ProductID: it.productId,
    ProductName: it.productName,
    Quantity: it.quantity,
    Unit: it.unit,
    UnitPrice: it.unitPrice,
    TotalAmount: it.totalAmount
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.SALE_ITEMS]);

  // 9. Payments
  addSheet(EXCEL_SHEET_NAMES.PAYMENTS, payments.map(p => ({
    PaymentID: p.id,
    TransactionID: p.transactionId,
    ReferenceType: p.referenceType,
    ReferenceID: p.referenceId,
    Amount: p.amount,
    PaymentMethod: p.paymentMethod,
    PaymentDate: p.paymentDate,
    Notes: p.notes || '',
    CreatedAt: p.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.PAYMENTS]);

  // 10. Discounts
  addSheet(EXCEL_SHEET_NAMES.DISCOUNTS, discounts.map(d => ({
    DiscountID: d.id,
    SaleID: d.saleId,
    DiscountType: d.discountType,
    DiscountValue: d.discountValue,
    Reason: d.reason,
    CreatedAt: d.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.DISCOUNTS]);

  // 11. Expenses
  addSheet(EXCEL_SHEET_NAMES.EXPENSES, expenseList.map(e => ({
    ExpenseID: e.id,
    Date: e.date,
    Category: e.category,
    Description: e.description,
    Amount: e.amount,
    PaymentMethod: e.paymentMethod,
    CreatedAt: e.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.EXPENSES]);

  // 12. Attendance
  addSheet(EXCEL_SHEET_NAMES.ATTENDANCE, attendance.map(a => ({
    AttendanceID: a.id,
    Date: a.date,
    WorkerID: a.workerId,
    WorkerName: a.workerName || '',
    Status: a.status,
    Notes: a.notes || '',
    CreatedAt: a.createdAt
  })), EXCEL_HEADERS[EXCEL_SHEET_NAMES.ATTENDANCE]);

  // 13. Daily_Summary (Derived)
  const dateMap = new Map<string, { gross: number; discount: number; net: number; stockInVal: number; expVal: number; salesCount: number; stockInCount: number; stockOutCount: number }>();
  for (const s of salesList) {
    const entry = dateMap.get(s.date) || { gross: 0, discount: 0, net: 0, stockInVal: 0, expVal: 0, salesCount: 0, stockInCount: 0, stockOutCount: 0 };
    entry.gross += s.grossAmount;
    entry.discount += s.discountAmount;
    entry.net += s.netAmount;
    entry.salesCount += 1;
    dateMap.set(s.date, entry);
  }
  for (const si of stockInList) {
    const entry = dateMap.get(si.date) || { gross: 0, discount: 0, net: 0, stockInVal: 0, expVal: 0, salesCount: 0, stockInCount: 0, stockOutCount: 0 };
    entry.stockInVal += Number(si.totalValue || 0);
    entry.stockInCount += 1;
    dateMap.set(si.date, entry);
  }
  for (const so of stockOutList) {
    const entry = dateMap.get(so.date) || { gross: 0, discount: 0, net: 0, stockInVal: 0, expVal: 0, salesCount: 0, stockInCount: 0, stockOutCount: 0 };
    entry.stockOutCount += 1;
    dateMap.set(so.date, entry);
  }
  for (const e of expenseList) {
    const entry = dateMap.get(e.date) || { gross: 0, discount: 0, net: 0, stockInVal: 0, expVal: 0, salesCount: 0, stockInCount: 0, stockOutCount: 0 };
    entry.expVal += Number(e.amount || 0);
    dateMap.set(e.date, entry);
  }

  const summaryRows = Array.from(dateMap.entries()).map(([dt, val]) => ({
    SummaryDate: dt,
    TotalSalesGross: Number(val.gross.toFixed(2)),
    TotalDiscounts: Number(val.discount.toFixed(2)),
    TotalSalesNet: Number(val.net.toFixed(2)),
    TotalStockInValue: Number(val.stockInVal.toFixed(2)),
    TotalExpenses: Number(val.expVal.toFixed(2)),
    TotalPaymentsCollected: Number(val.net.toFixed(2)),
    NewStockInTransactions: val.stockInCount,
    NewStockOutTransactions: val.stockOutCount,
    TotalSalesCount: val.salesCount,
    GeneratedAt: new Date().toISOString()
  }));

  addSheet(EXCEL_SHEET_NAMES.DAILY_SUMMARY, summaryRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.DAILY_SUMMARY]);

  // Metadata
  const today = new Date().toISOString().slice(0, 10);
  addSheet(EXCEL_SHEET_NAMES.METADATA, [
    { Key: 'Application', Value: 'Sree Datta Aqua Chemicals Warehouse Management System' },
    { Key: 'SchemaVersion', Value: SCHEMA_VERSION },
    { Key: 'ExportDate', Value: today },
    { Key: 'ExportType', Value: dateFilter?.module ? `Module: ${dateFilter.module}` : 'Full Historical Backup' }
  ], ['Key', 'Value']);

  // Write and trigger browser download
  const fileName = `SreeDatta_Warehouse_${today}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

/**
 * Parse an Excel file and perform rigorous validation
 */
export async function parseAndValidateUploadedFile(file: File): Promise<ExcelImportValidationResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // Load existing IDs from IndexedDB to detect duplicates across imports
  const existingProductIds = new Set((await db.products.toCollection().primaryKeys()) as string[]);
  const existingCustomerIds = new Set((await db.customers.toCollection().primaryKeys()) as string[]);
  const existingSupplierIds = new Set((await db.suppliers.toCollection().primaryKeys()) as string[]);
  const existingWorkerIds = new Set((await db.workers.toCollection().primaryKeys()) as string[]);
  const existingTxnIds = new Set((await db.stock_transactions.toCollection().primaryKeys()) as string[]);
  const existingSaleIds = new Set((await db.sales.toCollection().primaryKeys()) as string[]);
  const existingSaleItemIds = new Set((await db.sale_items.toCollection().primaryKeys()) as string[]);
  const existingPaymentIds = new Set((await db.payments.toCollection().primaryKeys()) as string[]);
  const existingDiscountIds = new Set((await db.discounts.toCollection().primaryKeys()) as string[]);
  const existingExpenseIds = new Set((await db.expenses.toCollection().primaryKeys()) as string[]);
  const existingAttendanceIds = new Set((await db.attendance.toCollection().primaryKeys()) as string[]);

  const allKnownIds = new Set<string>([
    ...existingProductIds,
    ...existingCustomerIds,
    ...existingSupplierIds,
    ...existingWorkerIds,
    ...existingTxnIds,
    ...existingSaleIds,
    ...existingSaleItemIds,
    ...existingPaymentIds,
    ...existingDiscountIds,
    ...existingExpenseIds,
    ...existingAttendanceIds
  ]);

  const fileKnownIds = new Set<string>();

  const result: ExcelImportValidationResult = {
    fileName: file.name,
    fileSize: file.size,
    totalSheets: wb.SheetNames.length,
    totalRows: 0,
    validCount: 0,
    duplicateCount: 0,
    invalidCount: 0,
    errors: [],
    duplicates: [],
    parsed: {
      products: [],
      customers: [],
      suppliers: [],
      workers: [],
      stockIn: [],
      stockOut: [],
      sales: [],
      saleItems: [],
      payments: [],
      discounts: [],
      expenses: [],
      attendance: []
    }
  };

  function checkId(id: string, sheet: string, rowNum: number): boolean {
    if (!id || !id.trim()) {
      result.errors.push({
        sheet,
        rowNumber: rowNum,
        field: 'ID',
        message: 'Primary identifier is empty or missing.'
      });
      result.invalidCount++;
      return false;
    }
    const clean = id.trim();
    if (allKnownIds.has(clean) || fileKnownIds.has(clean)) {
      result.duplicates.push({ sheet, id: clean, rowNumber: rowNum });
      result.duplicateCount++;
      return true; // duplicate!
    }
    fileKnownIds.add(clean);
    return false;
  }

  function getRows(sheetName: string): any[] {
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { defval: '' });
  }

  // 1. PRODUCTS
  const rawProducts = getRows(EXCEL_SHEET_NAMES.PRODUCTS);
  rawProducts.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.ProductID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.PRODUCTS, rowNum)) return;

    if (!r.ProductName || !String(r.ProductName).trim()) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.PRODUCTS, rowNumber: rowNum, recordId: id, field: 'ProductName', message: 'Product Name is required.' });
      result.invalidCount++;
      return;
    }

    const buyPrice = Number(r.PurchasePrice);
    const sellPrice = Number(r.SellingPrice);
    if (isNaN(buyPrice) || isNaN(sellPrice)) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.PRODUCTS, rowNumber: rowNum, recordId: id, field: 'Price', message: 'Purchase and Selling price must be valid numbers.' });
      result.invalidCount++;
      return;
    }

    result.parsed.products.push({
      id,
      code: String(r.ProductCode || id),
      name: String(r.ProductName).trim(),
      category: String(r.Category || 'General'),
      unit: String(r.Unit || 'Kg'),
      purchasePrice: buyPrice,
      sellingPrice: sellPrice,
      minimumStock: Number(r.MinimumStock || 0),
      isActive: String(r.IsActive).toUpperCase() !== 'NO',
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 2. CUSTOMERS
  const rawCustomers = getRows(EXCEL_SHEET_NAMES.CUSTOMERS);
  rawCustomers.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.CustomerID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.CUSTOMERS, rowNum)) return;

    if (!r.Name || !String(r.Name).trim()) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.CUSTOMERS, rowNumber: rowNum, recordId: id, field: 'Name', message: 'Customer Name is required.' });
      result.invalidCount++;
      return;
    }

    result.parsed.customers.push({
      id,
      name: String(r.Name).trim(),
      phone: String(r.Phone || '').trim(),
      address: String(r.Address || '').trim(),
      businessName: String(r.BusinessName || r.Name).trim(),
      notes: String(r.Notes || '').trim(),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 3. SUPPLIERS
  const rawSuppliers = getRows(EXCEL_SHEET_NAMES.SUPPLIERS);
  rawSuppliers.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.SupplierID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.SUPPLIERS, rowNum)) return;

    if (!r.Name || !String(r.Name).trim()) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.SUPPLIERS, rowNumber: rowNum, recordId: id, field: 'Name', message: 'Supplier Name is required.' });
      result.invalidCount++;
      return;
    }

    result.parsed.suppliers.push({
      id,
      name: String(r.Name).trim(),
      phone: String(r.Phone || '').trim(),
      address: String(r.Address || '').trim(),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 4. WORKERS
  const rawWorkers = getRows(EXCEL_SHEET_NAMES.WORKERS);
  rawWorkers.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.WorkerID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.WORKERS, rowNum)) return;

    if (!r.Name || !String(r.Name).trim()) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.WORKERS, rowNumber: rowNum, recordId: id, field: 'Name', message: 'Worker Name is required.' });
      result.invalidCount++;
      return;
    }

    result.parsed.workers.push({
      id,
      name: String(r.Name).trim(),
      contactInfo: String(r.ContactInfo || '').trim(),
      designation: String(r.Designation || 'Staff').trim(),
      joiningDate: String(r.JoiningDate || new Date().toISOString().slice(0, 10)),
      isActive: String(r.IsActive).toUpperCase() !== 'NO',
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 5. STOCK_IN
  const rawStockIn = getRows(EXCEL_SHEET_NAMES.STOCK_IN);
  rawStockIn.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.TransactionID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.STOCK_IN, rowNum)) return;

    const qty = Number(r.Quantity);
    const price = Number(r.PurchasePrice);
    if (isNaN(qty) || qty <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.STOCK_IN, rowNumber: rowNum, recordId: id, field: 'Quantity', message: 'Quantity must be a positive number.' });
      result.invalidCount++;
      return;
    }

    result.parsed.stockIn.push({
      id,
      date: String(r.Date || new Date().toISOString().slice(0, 10)),
      time: String(r.Time || '12:00:00'),
      productId: String(r.ProductID || '').trim(),
      productName: String(r.ProductName || '').trim(),
      supplierId: String(r.SupplierID || '').trim(),
      supplierName: String(r.SupplierName || '').trim(),
      quantity: qty,
      unit: String(r.Unit || 'Kg'),
      purchasePrice: isNaN(price) ? 0 : price,
      totalPurchaseValue: Number(r.TotalPurchaseValue) || (qty * (isNaN(price) ? 0 : price)),
      invoiceReferenceNumber: String(r.InvoiceReferenceNumber || ''),
      notes: String(r.Notes || ''),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 6. STOCK_OUT
  const rawStockOut = getRows(EXCEL_SHEET_NAMES.STOCK_OUT);
  rawStockOut.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.TransactionID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.STOCK_OUT, rowNum)) return;

    const qty = Number(r.Quantity);
    if (isNaN(qty) || qty <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.STOCK_OUT, rowNumber: rowNum, recordId: id, field: 'Quantity', message: 'Quantity must be a positive number.' });
      result.invalidCount++;
      return;
    }

    result.parsed.stockOut.push({
      id,
      date: String(r.Date || new Date().toISOString().slice(0, 10)),
      time: String(r.Time || '12:00:00'),
      productId: String(r.ProductID || '').trim(),
      productName: String(r.ProductName || '').trim(),
      quantity: qty,
      unit: String(r.Unit || 'Kg'),
      reason: (r.Reason || 'SALE') as any,
      recipient: String(r.Recipient || ''),
      responsibleWorkerId: String(r.ResponsibleWorkerID || ''),
      responsibleWorkerName: String(r.ResponsibleWorkerName || ''),
      notes: String(r.Notes || ''),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 7. SALES
  const rawSales = getRows(EXCEL_SHEET_NAMES.SALES);
  rawSales.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.SaleID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.SALES, rowNum)) return;

    const gross = Number(r.GrossAmount);
    const disc = Number(r.DiscountAmount || 0);
    const net = Number(r.NetAmount || (gross - disc));

    if (isNaN(gross) || gross < 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.SALES, rowNumber: rowNum, recordId: id, field: 'GrossAmount', message: 'Gross amount must be a non-negative number.' });
      result.invalidCount++;
      return;
    }

    result.parsed.sales.push({
      id,
      invoiceNumber: String(r.InvoiceNumber || `INV-${id}`),
      date: String(r.Date || new Date().toISOString().slice(0, 10)),
      time: String(r.Time || '12:00:00'),
      customerId: String(r.CustomerID || '').trim(),
      customerName: String(r.CustomerName || '').trim(),
      grossAmount: gross,
      discountAmount: isNaN(disc) ? 0 : disc,
      netAmount: isNaN(net) ? (gross - (isNaN(disc) ? 0 : disc)) : net,
      paymentMethod: (r.PaymentMethod || 'CASH') as any,
      workerId: String(r.WorkerID || ''),
      workerName: String(r.WorkerName || ''),
      notes: String(r.Notes || ''),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 8. SALE_ITEMS
  const rawSaleItems = getRows(EXCEL_SHEET_NAMES.SALE_ITEMS);
  rawSaleItems.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.ItemID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.SALE_ITEMS, rowNum)) return;

    const qty = Number(r.Quantity);
    const price = Number(r.UnitPrice);
    if (isNaN(qty) || isNaN(price) || qty <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.SALE_ITEMS, rowNumber: rowNum, recordId: id, field: 'Quantity/Price', message: 'Valid positive quantity and price required.' });
      result.invalidCount++;
      return;
    }

    result.parsed.saleItems.push({
      id,
      saleId: String(r.SaleID || '').trim(),
      productId: String(r.ProductID || '').trim(),
      productName: String(r.ProductName || '').trim(),
      quantity: qty,
      unit: String(r.Unit || 'Kg'),
      unitPrice: price,
      totalAmount: Number(r.TotalAmount) || (qty * price)
    });
    result.validCount++;
  });

  // 9. PAYMENTS
  const rawPayments = getRows(EXCEL_SHEET_NAMES.PAYMENTS);
  rawPayments.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.PaymentID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.PAYMENTS, rowNum)) return;

    const amt = Number(r.Amount);
    if (isNaN(amt) || amt <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.PAYMENTS, rowNumber: rowNum, recordId: id, field: 'Amount', message: 'Amount must be greater than zero.' });
      result.invalidCount++;
      return;
    }

    result.parsed.payments.push({
      id,
      transactionId: String(r.TransactionID || id),
      referenceType: (r.ReferenceType || 'SALE') as any,
      referenceId: String(r.ReferenceID || ''),
      amount: amt,
      paymentMethod: (r.PaymentMethod || 'CASH') as any,
      paymentDate: String(r.PaymentDate || new Date().toISOString().slice(0, 10)),
      notes: String(r.Notes || ''),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 10. DISCOUNTS
  const rawDiscounts = getRows(EXCEL_SHEET_NAMES.DISCOUNTS);
  rawDiscounts.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.DiscountID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.DISCOUNTS, rowNum)) return;

    result.parsed.discounts.push({
      id,
      saleId: String(r.SaleID || ''),
      discountType: (r.DiscountType || 'FLAT') as any,
      discountValue: Number(r.DiscountValue || 0),
      reason: String(r.Reason || ''),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 11. EXPENSES
  const rawExpenses = getRows(EXCEL_SHEET_NAMES.EXPENSES);
  rawExpenses.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.ExpenseID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.EXPENSES, rowNum)) return;

    const amt = Number(r.Amount);
    if (isNaN(amt) || amt <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.EXPENSES, rowNumber: rowNum, recordId: id, field: 'Amount', message: 'Amount must be greater than zero.' });
      result.invalidCount++;
      return;
    }

    result.parsed.expenses.push({
      id,
      date: String(r.Date || new Date().toISOString().slice(0, 10)),
      category: (r.Category || 'OTHER') as any,
      description: String(r.Description || ''),
      amount: amt,
      paymentMethod: (r.PaymentMethod || 'CASH') as any,
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 12. ATTENDANCE
  const rawAttendance = getRows(EXCEL_SHEET_NAMES.ATTENDANCE);
  rawAttendance.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRows++;
    const id = String(r.AttendanceID || '').trim();
    if (checkId(id, EXCEL_SHEET_NAMES.ATTENDANCE, rowNum)) return;

    result.parsed.attendance.push({
      id,
      date: String(r.Date || new Date().toISOString().slice(0, 10)),
      workerId: String(r.WorkerID || ''),
      workerName: String(r.WorkerName || ''),
      status: (r.Status || 'PRESENT') as any,
      notes: String(r.Notes || ''),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  return result;
}
