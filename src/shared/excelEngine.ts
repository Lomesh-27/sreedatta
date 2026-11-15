import * as XLSX from 'xlsx';
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
} from './schema';
import { formatDateKolkata } from './calculations';

export interface AllWarehouseData {
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
  dailySummaries?: DailySummary[];
}

export interface ValidationErrorItem {
  sheet: string;
  rowNumber: number;
  recordId?: string;
  field: string;
  message: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  totalSheetsFound: number;
  totalRowsProcessed: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  errors: ValidationErrorItem[];
  duplicates: Array<{ sheet: string; id: string; rowNumber: number }>;
  parsedData: AllWarehouseData;
}

/**
 * Builds a standardized Excel Workbook from Warehouse Data
 */
export function createWarehouseWorkbook(data: AllWarehouseData, exportDateStr?: string): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const exportDate = exportDateStr || new Date().toISOString().slice(0, 10);

  // 1. Products
  const productsRows = (data.products || []).map(p => ({
    ProductID: p.id,
    ProductCode: p.code,
    ProductName: p.name,
    Category: p.category,
    Unit: p.unit,
    PurchasePrice: Number(p.purchasePrice || 0),
    SellingPrice: Number(p.sellingPrice || 0),
    MinimumStock: Number(p.minimumStock || 0),
    IsActive: p.isActive ? 'YES' : 'NO',
    CreatedAt: p.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.PRODUCTS, productsRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.PRODUCTS]);

  // 2. Customers
  const customerRows = (data.customers || []).map(c => ({
    CustomerID: c.id,
    Name: c.name,
    Phone: c.phone,
    Address: c.address,
    BusinessName: c.businessName,
    Notes: c.notes || '',
    CreatedAt: c.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.CUSTOMERS, customerRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.CUSTOMERS]);

  // 3. Suppliers
  const supplierRows = (data.suppliers || []).map(s => ({
    SupplierID: s.id,
    Name: s.name,
    Phone: s.phone,
    Address: s.address,
    CreatedAt: s.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.SUPPLIERS, supplierRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.SUPPLIERS]);

  // 4. Workers
  const workerRows = (data.workers || []).map(w => ({
    WorkerID: w.id,
    Name: w.name,
    ContactInfo: w.contactInfo,
    Designation: w.designation,
    JoiningDate: w.joiningDate,
    IsActive: w.isActive ? 'YES' : 'NO',
    CreatedAt: w.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.WORKERS, workerRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.WORKERS]);

  // 5. Stock_In
  const stockInRows = (data.stockIn || []).map(si => ({
    TransactionID: si.id,
    Date: si.date,
    Time: si.time,
    ProductID: si.productId,
    ProductName: si.productName || '',
    SupplierID: si.supplierId,
    SupplierName: si.supplierName || '',
    Quantity: Number(si.quantity || 0),
    Unit: si.unit,
    PurchasePrice: Number(si.purchasePrice || 0),
    TotalPurchaseValue: Number(si.totalPurchaseValue || 0),
    InvoiceReferenceNumber: si.invoiceReferenceNumber || '',
    Notes: si.notes || '',
    CreatedAt: si.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.STOCK_IN, stockInRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.STOCK_IN]);

  // 6. Stock_Out
  const stockOutRows = (data.stockOut || []).map(so => ({
    TransactionID: so.id,
    Date: so.date,
    Time: so.time,
    ProductID: so.productId,
    ProductName: so.productName || '',
    Quantity: Number(so.quantity || 0),
    Unit: so.unit,
    Reason: so.reason,
    Recipient: so.recipient || '',
    ResponsibleWorkerID: so.responsibleWorkerId || '',
    ResponsibleWorkerName: so.responsibleWorkerName || '',
    Notes: so.notes || '',
    CreatedAt: so.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.STOCK_OUT, stockOutRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.STOCK_OUT]);

  // 7. Sales
  const salesRows = (data.sales || []).map(s => ({
    SaleID: s.id,
    InvoiceNumber: s.invoiceNumber,
    Date: s.date,
    Time: s.time,
    CustomerID: s.customerId,
    CustomerName: s.customerName || '',
    GrossAmount: Number(s.grossAmount || 0),
    DiscountAmount: Number(s.discountAmount || 0),
    NetAmount: Number(s.netAmount || 0),
    PaymentMethod: s.paymentMethod,
    WorkerID: s.workerId,
    WorkerName: s.workerName || '',
    Notes: s.notes || '',
    CreatedAt: s.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.SALES, salesRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.SALES]);

  // 8. Sale_Items
  const saleItemRows = (data.saleItems || []).map(item => ({
    ItemID: item.id,
    SaleID: item.saleId,
    ProductID: item.productId,
    ProductName: item.productName || '',
    Quantity: Number(item.quantity || 0),
    Unit: item.unit,
    UnitPrice: Number(item.unitPrice || 0),
    TotalAmount: Number(item.totalAmount || 0)
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.SALE_ITEMS, saleItemRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.SALE_ITEMS]);

  // 9. Payments
  const paymentRows = (data.payments || []).map(p => ({
    PaymentID: p.id,
    TransactionID: p.transactionId,
    ReferenceType: p.referenceType,
    ReferenceID: p.referenceId,
    Amount: Number(p.amount || 0),
    PaymentMethod: p.paymentMethod,
    PaymentDate: p.paymentDate,
    Notes: p.notes || '',
    CreatedAt: p.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.PAYMENTS, paymentRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.PAYMENTS]);

  // 10. Discounts
  const discountRows = (data.discounts || []).map(d => ({
    DiscountID: d.id,
    SaleID: d.saleId,
    DiscountType: d.discountType,
    DiscountValue: Number(d.discountValue || 0),
    Reason: d.reason || '',
    CreatedAt: d.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.DISCOUNTS, discountRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.DISCOUNTS]);

  // 11. Expenses
  const expenseRows = (data.expenses || []).map(e => ({
    ExpenseID: e.id,
    Date: e.date,
    Category: e.category,
    Description: e.description,
    Amount: Number(e.amount || 0),
    PaymentMethod: e.paymentMethod,
    CreatedAt: e.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.EXPENSES, expenseRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.EXPENSES]);

  // 12. Attendance
  const attendanceRows = (data.attendance || []).map(a => ({
    AttendanceID: a.id,
    Date: a.date,
    WorkerID: a.workerId,
    WorkerName: a.workerName || '',
    Status: a.status,
    Notes: a.notes || '',
    CreatedAt: a.createdAt || new Date().toISOString()
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.ATTENDANCE, attendanceRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.ATTENDANCE]);

  // 13. Daily_Summary
  const summaryRows = (data.dailySummaries || []).map(ds => ({
    SummaryDate: ds.summaryDate,
    TotalSalesGross: Number(ds.totalSalesGross || 0),
    TotalDiscounts: Number(ds.totalDiscounts || 0),
    TotalSalesNet: Number(ds.totalSalesNet || 0),
    TotalStockInValue: Number(ds.totalStockInValue || 0),
    TotalExpenses: Number(ds.totalExpenses || 0),
    TotalPaymentsCollected: Number(ds.totalPaymentsCollected || 0),
    NewStockInTransactions: Number(ds.newStockInTransactions || 0),
    NewStockOutTransactions: Number(ds.newStockOutTransactions || 0),
    TotalSalesCount: Number(ds.totalSalesCount || 0),
    GeneratedAt: ds.generatedAt
  }));
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.DAILY_SUMMARY, summaryRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.DAILY_SUMMARY]);

  // 14. Metadata
  const metadataRows = [
    { Key: 'Application', Value: 'Sree Datta Aqua Chemicals Warehouse Management System' },
    { Key: 'SchemaVersion', Value: SCHEMA_VERSION },
    { Key: 'ExportDate', Value: exportDate },
    { Key: 'GeneratedTimestamp', Value: new Date().toISOString() },
    { Key: 'Timezone', Value: 'Asia/Kolkata' }
  ];
  appendSheetWithHeaders(wb, EXCEL_SHEET_NAMES.METADATA, metadataRows, EXCEL_HEADERS[EXCEL_SHEET_NAMES.METADATA]);

  return wb;
}

/**
 * Appends a worksheet ensuring columns match the exact required standard headers
 */
function appendSheetWithHeaders(wb: XLSX.WorkBook, sheetName: string, rows: any[], headers: readonly string[]) {
  let ws: XLSX.WorkSheet;
  if (!rows || rows.length === 0) {
    ws = XLSX.utils.aoa_to_sheet([Array.from(headers)]);
  } else {
    ws = XLSX.utils.json_to_sheet(rows, { header: Array.from(headers) });
  }

  // Set column widths for readability
  const colWidths = headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

/**
 * Parses and validates an Excel workbook (.xlsx, .xls, or .csv)
 * Strictly verifies headers, data types, referential links, and duplicate IDs
 */
export function validateAndParseWorkbook(
  workbook: XLSX.WorkBook,
  existingIds?: Set<string>
): ImportValidationResult {
  const result: ImportValidationResult = {
    isValid: true,
    totalSheetsFound: workbook.SheetNames.length,
    totalRowsProcessed: 0,
    validCount: 0,
    duplicateCount: 0,
    invalidCount: 0,
    errors: [],
    duplicates: [],
    parsedData: {
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
      attendance: [],
      dailySummaries: []
    }
  };

  const knownIds = new Set<string>(existingIds ? Array.from(existingIds) : []);
  const inWorkbookIds = new Set<string>();

  function checkDuplicateId(id: string, sheet: string, rowNum: number): boolean {
    if (!id || typeof id !== 'string' || !id.trim()) {
      result.errors.push({
        sheet,
        rowNumber: rowNum,
        field: 'ID',
        message: 'Missing or empty primary identifier.'
      });
      result.invalidCount++;
      return false;
    }
    const cleanId = id.trim();
    if (knownIds.has(cleanId) || inWorkbookIds.has(cleanId)) {
      result.duplicates.push({ sheet, id: cleanId, rowNumber: rowNum });
      result.duplicateCount++;
      return true; // is duplicate
    }
    inWorkbookIds.add(cleanId);
    return false; // not duplicate
  }

  // Helper to read sheet rows
  function getSheetRows(sheetName: string): any[] {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { defval: '' });
  }

  // 1. PRODUCTS
  const rawProducts = getSheetRows(EXCEL_SHEET_NAMES.PRODUCTS);
  rawProducts.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.ProductID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.PRODUCTS, rowNum);
    if (isDup) return;

    if (!r.ProductName || String(r.ProductName).trim() === '') {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.PRODUCTS, rowNumber: rowNum, recordId: id, field: 'ProductName', message: 'Product Name is required.' });
      result.invalidCount++;
      return;
    }

    const purchasePrice = Number(r.PurchasePrice);
    const sellingPrice = Number(r.SellingPrice);
    if (isNaN(purchasePrice) || isNaN(sellingPrice)) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.PRODUCTS, rowNumber: rowNum, recordId: id, field: 'Price', message: 'Purchase and Selling price must be numeric.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.products.push({
      id,
      code: String(r.ProductCode || id),
      name: String(r.ProductName).trim(),
      category: String(r.Category || 'General'),
      unit: String(r.Unit || 'Kg'),
      purchasePrice,
      sellingPrice,
      minimumStock: Number(r.MinimumStock || 0),
      isActive: String(r.IsActive).toUpperCase() !== 'NO',
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 2. CUSTOMERS
  const rawCustomers = getSheetRows(EXCEL_SHEET_NAMES.CUSTOMERS);
  rawCustomers.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.CustomerID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.CUSTOMERS, rowNum);
    if (isDup) return;

    if (!r.Name || String(r.Name).trim() === '') {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.CUSTOMERS, rowNumber: rowNum, recordId: id, field: 'Name', message: 'Customer Name is required.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.customers.push({
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
  const rawSuppliers = getSheetRows(EXCEL_SHEET_NAMES.SUPPLIERS);
  rawSuppliers.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.SupplierID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.SUPPLIERS, rowNum);
    if (isDup) return;

    if (!r.Name || String(r.Name).trim() === '') {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.SUPPLIERS, rowNumber: rowNum, recordId: id, field: 'Name', message: 'Supplier Name is required.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.suppliers.push({
      id,
      name: String(r.Name).trim(),
      phone: String(r.Phone || '').trim(),
      address: String(r.Address || '').trim(),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 4. WORKERS
  const rawWorkers = getSheetRows(EXCEL_SHEET_NAMES.WORKERS);
  rawWorkers.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.WorkerID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.WORKERS, rowNum);
    if (isDup) return;

    if (!r.Name || String(r.Name).trim() === '') {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.WORKERS, rowNumber: rowNum, recordId: id, field: 'Name', message: 'Worker Name is required.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.workers.push({
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

  // Sets of valid entity IDs for referential checks
  const productIds = new Set(result.parsedData.products.map(p => p.id));
  const customerIds = new Set(result.parsedData.customers.map(c => c.id));
  const supplierIds = new Set(result.parsedData.suppliers.map(s => s.id));
  const workerIds = new Set(result.parsedData.workers.map(w => w.id));

  // 5. STOCK_IN
  const rawStockIn = getSheetRows(EXCEL_SHEET_NAMES.STOCK_IN);
  rawStockIn.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.TransactionID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.STOCK_IN, rowNum);
    if (isDup) return;

    const qty = Number(r.Quantity);
    const price = Number(r.PurchasePrice);
    if (isNaN(qty) || qty <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.STOCK_IN, rowNumber: rowNum, recordId: id, field: 'Quantity', message: 'Quantity must be a positive number.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.stockIn.push({
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
  const rawStockOut = getSheetRows(EXCEL_SHEET_NAMES.STOCK_OUT);
  rawStockOut.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.TransactionID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.STOCK_OUT, rowNum);
    if (isDup) return;

    const qty = Number(r.Quantity);
    if (isNaN(qty) || qty <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.STOCK_OUT, rowNumber: rowNum, recordId: id, field: 'Quantity', message: 'Quantity must be a positive number.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.stockOut.push({
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
  const rawSales = getSheetRows(EXCEL_SHEET_NAMES.SALES);
  rawSales.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.SaleID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.SALES, rowNum);
    if (isDup) return;

    const gross = Number(r.GrossAmount);
    const discount = Number(r.DiscountAmount || 0);
    const net = Number(r.NetAmount || (gross - discount));

    if (isNaN(gross) || gross < 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.SALES, rowNumber: rowNum, recordId: id, field: 'GrossAmount', message: 'Gross amount must be a non-negative number.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.sales.push({
      id,
      invoiceNumber: String(r.InvoiceNumber || `INV-${id}`),
      date: String(r.Date || new Date().toISOString().slice(0, 10)),
      time: String(r.Time || '12:00:00'),
      customerId: String(r.CustomerID || '').trim(),
      customerName: String(r.CustomerName || '').trim(),
      grossAmount: gross,
      discountAmount: isNaN(discount) ? 0 : discount,
      netAmount: isNaN(net) ? (gross - (isNaN(discount) ? 0 : discount)) : net,
      paymentMethod: (r.PaymentMethod || 'CASH') as any,
      workerId: String(r.WorkerID || ''),
      workerName: String(r.WorkerName || ''),
      notes: String(r.Notes || ''),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 8. SALE_ITEMS
  const rawSaleItems = getSheetRows(EXCEL_SHEET_NAMES.SALE_ITEMS);
  rawSaleItems.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.ItemID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.SALE_ITEMS, rowNum);
    if (isDup) return;

    const qty = Number(r.Quantity);
    const unitPrice = Number(r.UnitPrice);
    if (isNaN(qty) || isNaN(unitPrice) || qty <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.SALE_ITEMS, rowNumber: rowNum, recordId: id, field: 'Quantity/Price', message: 'Valid positive quantity and price required.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.saleItems.push({
      id,
      saleId: String(r.SaleID || '').trim(),
      productId: String(r.ProductID || '').trim(),
      productName: String(r.ProductName || '').trim(),
      quantity: qty,
      unit: String(r.Unit || 'Kg'),
      unitPrice,
      totalAmount: Number(r.TotalAmount) || (qty * unitPrice)
    });
    result.validCount++;
  });

  // 9. PAYMENTS
  const rawPayments = getSheetRows(EXCEL_SHEET_NAMES.PAYMENTS);
  rawPayments.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.PaymentID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.PAYMENTS, rowNum);
    if (isDup) return;

    const amount = Number(r.Amount);
    if (isNaN(amount) || amount <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.PAYMENTS, rowNumber: rowNum, recordId: id, field: 'Amount', message: 'Payment amount must be greater than zero.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.payments.push({
      id,
      transactionId: String(r.TransactionID || id),
      referenceType: (r.ReferenceType || 'SALE') as any,
      referenceId: String(r.ReferenceID || ''),
      amount,
      paymentMethod: (r.PaymentMethod || 'CASH') as any,
      paymentDate: String(r.PaymentDate || new Date().toISOString().slice(0, 10)),
      notes: String(r.Notes || ''),
      createdAt: String(r.CreatedAt || new Date().toISOString())
    });
    result.validCount++;
  });

  // 10. DISCOUNTS
  const rawDiscounts = getSheetRows(EXCEL_SHEET_NAMES.DISCOUNTS);
  rawDiscounts.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.DiscountID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.DISCOUNTS, rowNum);
    if (isDup) return;

    result.parsedData.discounts.push({
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
  const rawExpenses = getSheetRows(EXCEL_SHEET_NAMES.EXPENSES);
  rawExpenses.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.ExpenseID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.EXPENSES, rowNum);
    if (isDup) return;

    const amt = Number(r.Amount);
    if (isNaN(amt) || amt <= 0) {
      result.errors.push({ sheet: EXCEL_SHEET_NAMES.EXPENSES, rowNumber: rowNum, recordId: id, field: 'Amount', message: 'Expense amount must be greater than zero.' });
      result.invalidCount++;
      return;
    }

    result.parsedData.expenses.push({
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
  const rawAttendance = getSheetRows(EXCEL_SHEET_NAMES.ATTENDANCE);
  rawAttendance.forEach((r, idx) => {
    const rowNum = idx + 2;
    result.totalRowsProcessed++;
    const id = String(r.AttendanceID || '').trim();
    const isDup = checkDuplicateId(id, EXCEL_SHEET_NAMES.ATTENDANCE, rowNum);
    if (isDup) return;

    result.parsedData.attendance.push({
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

  result.isValid = result.errors.length === 0;
  return result;
}
