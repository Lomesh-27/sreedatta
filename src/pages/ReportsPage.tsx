import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Filter, Calendar, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, getInventorySummary } from '../db/warehouseDB';
import { formatDateKolkata } from '@shared/calculations';

type ReportType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'SALES'
  | 'CUSTOMER_SALES'
  | 'PRODUCT_SALES'
  | 'WORKER_ACTIVITY'
  | 'DISCOUNTS'
  | 'REVENUE'
  | 'EXPENSES'
  | 'INVENTORY';

type DatePreset = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('SALES');
  const [datePreset, setDatePreset] = useState<DatePreset>('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [reportRows, setReportRows] = useState<any[]>([]);

  // Apply default dates on preset change
  useEffect(() => {
    const today = new Date();
    const endStr = today.toISOString().slice(0, 10);
    let startStr = endStr;

    if (datePreset === 'DAILY') {
      startStr = endStr;
    } else if (datePreset === 'WEEKLY') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startStr = d.toISOString().slice(0, 10);
    } else if (datePreset === 'MONTHLY') {
      const d = new Date();
      d.setDate(1); // First day of current month
      startStr = d.toISOString().slice(0, 10);
    } else if (datePreset === 'YEARLY') {
      const d = new Date();
      d.setMonth(0, 1); // Jan 1st of current year
      startStr = d.toISOString().slice(0, 10);
    }

    if (datePreset !== 'CUSTOM') {
      setStartDate(startStr);
      setEndDate(endStr);
    }
  }, [datePreset]);

  // Generate Report
  const generateReport = async () => {
    setLoading(true);
    try {
      const txns = await db.stock_transactions.toArray();
      const sales = await db.sales.toArray();
      const saleItems = await db.sale_items.toArray();
      const expenses = await db.expenses.toArray();
      const discounts = await db.discounts.toArray();
      const attendance = await db.attendance.toArray();
      const inventory = await getInventorySummary();

      const inDateRange = (date: string) => {
        if (!startDate || !endDate) return true;
        return date >= startDate && date <= endDate;
      };

      let rows: any[] = [];

      switch (reportType) {
        case 'STOCK_IN': {
          rows = txns
            .filter(t => t.type === 'IN' && inDateRange(t.date))
            .map(t => ({
              Date: formatDateKolkata(t.date),
              RawDate: t.date,
              TransactionID: t.id,
              Product: t.productName,
              Supplier: t.supplierName || 'Direct',
              Quantity: `${t.quantity} ${t.unit}`,
              UnitPrice: `₹${(t.unitPrice || 0).toLocaleString('en-IN')}`,
              TotalValue: `₹${(t.totalValue || (t.quantity * (t.unitPrice || 0))).toLocaleString('en-IN')}`,
              InvoiceRef: t.invoiceReferenceNumber || '-',
              Notes: t.notes || '-'
            }));
          break;
        }

        case 'STOCK_OUT': {
          rows = txns
            .filter(t => t.type === 'OUT' && inDateRange(t.date))
            .map(t => ({
              Date: formatDateKolkata(t.date),
              RawDate: t.date,
              TransactionID: t.id,
              Product: t.productName,
              Quantity: `${t.quantity} ${t.unit}`,
              Reason: t.reason,
              Recipient: t.recipient || '-',
              Worker: t.responsibleWorkerName || '-',
              Notes: t.notes || '-'
            }));
          break;
        }

        case 'SALES': {
          rows = sales
            .filter(s => inDateRange(s.date))
            .map(s => ({
              Date: formatDateKolkata(s.date),
              RawDate: s.date,
              InvoiceNumber: s.invoiceNumber,
              Customer: s.customerName,
              GrossAmount: `₹${s.grossAmount.toLocaleString('en-IN')}`,
              Discount: `₹${s.discountAmount.toLocaleString('en-IN')}`,
              NetAmount: `₹${s.netAmount.toLocaleString('en-IN')}`,
              PaymentMethod: s.paymentMethod,
              Worker: s.workerName || '-',
              Notes: s.notes || '-'
            }));
          break;
        }

        case 'CUSTOMER_SALES': {
          const custMap = new Map<string, { count: number; gross: number; discount: number; net: number }>();
          for (const s of sales.filter(s => inDateRange(s.date))) {
            const name = s.customerName || 'Unknown Customer';
            const cur = custMap.get(name) || { count: 0, gross: 0, discount: 0, net: 0 };
            cur.count += 1;
            cur.gross += s.grossAmount;
            cur.discount += s.discountAmount;
            cur.net += s.netAmount;
            custMap.set(name, cur);
          }
          rows = Array.from(custMap.entries()).map(([name, stat]) => ({
            CustomerName: name,
            TotalInvoices: stat.count,
            GrossPurchases: `₹${stat.gross.toLocaleString('en-IN')}`,
            TotalDiscounts: `₹${stat.discount.toLocaleString('en-IN')}`,
            NetRevenue: `₹${stat.net.toLocaleString('en-IN')}`
          }));
          break;
        }

        case 'PRODUCT_SALES': {
          const prodMap = new Map<string, { qty: number; unit: string; totalRevenue: number }>();
          const validSaleIds = new Set(sales.filter(s => inDateRange(s.date)).map(s => s.id));
          for (const it of saleItems.filter(it => validSaleIds.has(it.saleId))) {
            const name = it.productName || 'Unknown';
            const cur = prodMap.get(name) || { qty: 0, unit: it.unit, totalRevenue: 0 };
            cur.qty += it.quantity;
            cur.totalRevenue += it.totalAmount;
            prodMap.set(name, cur);
          }
          rows = Array.from(prodMap.entries()).map(([name, stat]) => ({
            ProductName: name,
            QuantitySold: `${stat.qty} ${stat.unit}`,
            GrossSalesValue: `₹${stat.totalRevenue.toLocaleString('en-IN')}`
          }));
          break;
        }

        case 'WORKER_ACTIVITY': {
          const workerMap = new Map<string, { salesHandled: number; salesTotal: number; attendanceDays: number }>();
          for (const s of sales.filter(s => inDateRange(s.date))) {
            const name = s.workerName || 'Staff';
            const cur = workerMap.get(name) || { salesHandled: 0, salesTotal: 0, attendanceDays: 0 };
            cur.salesHandled += 1;
            cur.salesTotal += s.netAmount;
            workerMap.set(name, cur);
          }
          for (const a of attendance.filter(a => inDateRange(a.date))) {
            const name = a.workerName || 'Staff';
            const cur = workerMap.get(name) || { salesHandled: 0, salesTotal: 0, attendanceDays: 0 };
            if (a.status === 'PRESENT' || a.status === 'HALF_DAY') cur.attendanceDays += 1;
            workerMap.set(name, cur);
          }
          rows = Array.from(workerMap.entries()).map(([name, stat]) => ({
            WorkerName: name,
            InvoicesProcessed: stat.salesHandled,
            TotalValueHandled: `₹${stat.salesTotal.toLocaleString('en-IN')}`,
            ActiveDaysPresent: stat.attendanceDays
          }));
          break;
        }

        case 'DISCOUNTS': {
          rows = discounts
            .filter(d => inDateRange(d.createdAt.slice(0, 10)))
            .map(d => ({
              Date: formatDateKolkata(d.createdAt),
              DiscountID: d.id,
              SaleID: d.saleId,
              Type: d.discountType,
              DiscountAmount: `₹${d.discountValue.toLocaleString('en-IN')}`,
              Reason: d.reason || '-'
            }));
          break;
        }

        case 'REVENUE': {
          const revSales = sales.filter(s => inDateRange(s.date));
          const totalGross = revSales.reduce((sum, s) => sum + s.grossAmount, 0);
          const totalDisc = revSales.reduce((sum, s) => sum + s.discountAmount, 0);
          const totalNet = revSales.reduce((sum, s) => sum + s.netAmount, 0);
          const totalExp = expenses.filter(e => inDateRange(e.date)).reduce((sum, e) => sum + e.amount, 0);
          const netOperatingBalance = totalNet - totalExp;

          rows = [
            { Metric: 'Gross Sales Recorded', Amount: `₹${totalGross.toLocaleString('en-IN')}` },
            { Metric: 'Promotional Discounts Conceded', Amount: `₹${totalDisc.toLocaleString('en-IN')}` },
            { Metric: 'Net Sales Revenue (Turnover)', Amount: `₹${totalNet.toLocaleString('en-IN')}` },
            { Metric: 'Operating Warehouse Expenses', Amount: `₹${totalExp.toLocaleString('en-IN')}` },
            { Metric: 'Operating Surplus (Net Sales - Expenses)', Amount: `₹${netOperatingBalance.toLocaleString('en-IN')}` }
          ];
          break;
        }

        case 'EXPENSES': {
          rows = expenses
            .filter(e => inDateRange(e.date))
            .map(e => ({
              Date: formatDateKolkata(e.date),
              ExpenseID: e.id,
              Category: e.category,
              Description: e.description,
              PaymentMethod: e.paymentMethod,
              Amount: `₹${e.amount.toLocaleString('en-IN')}`
            }));
          break;
        }

        case 'INVENTORY': {
          rows = inventory.map(item => ({
            Code: item.product.code,
            Product: item.product.name,
            Category: item.product.category,
            StockInTotal: `${item.totalIn} ${item.product.unit}`,
            StockOutTotal: `${item.totalOut} ${item.product.unit}`,
            AvailableBalance: `${item.availableStock} ${item.product.unit}`,
            MinThreshold: `${item.product.minimumStock} ${item.product.unit}`,
            Valuation: `₹${item.stockValue.toLocaleString('en-IN')}`,
            Status: item.isLowStock ? 'LOW STOCK' : 'HEALTHY'
          }));
          break;
        }
      }

      setReportRows(rows);
    } catch (e) {
      console.error('Report generation error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, startDate, endDate]);

  const handleExportReportExcel = () => {
    if (reportRows.length === 0) {
      alert('No data to export.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportType.slice(0, 31));
    const filename = `Report_${reportType}_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports & Analytics Engine</h2>
          <p className="text-xs text-slate-500">
            Filtered business reports in Asia/Kolkata timezone (DD-MM-YYYY)
          </p>
        </div>

        <button
          onClick={handleExportReportExcel}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Download size={16} />
          <span>Export Current Report</span>
        </button>
      </div>

      {/* Configuration Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Report:</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value as any)}
            className="text-xs sm:text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="SALES">Sales Invoices Report</option>
            <option value="STOCK_IN">Stock In (Procurement) Report</option>
            <option value="STOCK_OUT">Stock Out (Dispatches) Report</option>
            <option value="CUSTOMER_SALES">Customer-wise Sales Report</option>
            <option value="PRODUCT_SALES">Product-wise Sales Report</option>
            <option value="WORKER_ACTIVITY">Worker Activity & Attendance</option>
            <option value="DISCOUNTS">Promotional Discount Report</option>
            <option value="REVENUE">Revenue & Financial Summary</option>
            <option value="EXPENSES">Operational Expenses Report</option>
            <option value="INVENTORY">Physical Inventory Balance Report</option>
          </select>

          <div className="border-l border-slate-200 pl-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Timeframe:</span>
            {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as DatePreset[]).map(p => (
              <button
                key={p}
                onClick={() => setDatePreset(p)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  datePreset === p
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {datePreset === 'CUSTOM' && (
          <div className="flex items-center space-x-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
            />
            <span className="text-xs font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
            />
          </div>
        )}
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="font-semibold text-slate-700">
            Showing <strong className="text-slate-900">{reportRows.length}</strong> records for period: {formatDateKolkata(startDate)} to {formatDateKolkata(endDate)}
          </div>
          <span className="text-slate-400 font-mono">Timezone: Asia/Kolkata</span>
        </div>

        <div className="overflow-x-auto">
          {reportRows.length > 0 ? (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  {Object.keys(reportRows[0])
                    .filter(k => k !== 'RawDate')
                    .map(header => (
                      <th key={header} className="py-3 px-4">
                        {header.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    {Object.entries(row)
                      .filter(([k]) => k !== 'RawDate')
                      .map(([key, val]: any, cellIdx) => (
                        <td key={cellIdx} className="py-2.5 px-4 text-slate-700">
                          {String(val)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No transactions match the selected report criteria for this date range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
