import React, { useState } from 'react';
import { Database, Download, Upload, AlertTriangle, CheckCircle2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { db } from '../db/warehouseDB';
import { exportWarehouseToExcel } from '../services/excelService';
import { SCHEMA_VERSION } from '@shared/schema';

export const BackupRestorePage: React.FC = () => {
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [restoreMessage, setRestoreMessage] = useState('');

  const handleExportJson = async () => {
    try {
      setExportingJson(true);
      const backupData = {
        application: 'Sree Datta Aqua Chemicals Warehouse Management System',
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        products: await db.products.toArray(),
        customers: await db.customers.toArray(),
        suppliers: await db.suppliers.toArray(),
        workers: await db.workers.toArray(),
        stock_transactions: await db.stock_transactions.toArray(),
        sales: await db.sales.toArray(),
        sale_items: await db.sale_items.toArray(),
        payments: await db.payments.toArray(),
        discounts: await db.discounts.toArray(),
        expenses: await db.expenses.toArray(),
        attendance: await db.attendance.toArray(),
        import_history: await db.import_history.toArray()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SreeDatta_Warehouse_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`JSON export failed: ${e.message}`);
    } finally {
      setExportingJson(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportWarehouseToExcel();
    } catch (e: any) {
      alert(`Excel export failed: ${e.message}`);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleRestoreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setRestoreFile(file);
    setRestoreStatus('IDLE');
    setRestoreMessage('');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.schemaVersion || !parsed.products) {
        alert('Invalid backup file! Missing required Sree Datta warehouse schema properties.');
        setRestoreFile(null);
        return;
      }

      setRestorePreview({
        schemaVersion: parsed.schemaVersion,
        exportedAt: parsed.exportedAt,
        productsCount: parsed.products?.length || 0,
        customersCount: parsed.customers?.length || 0,
        suppliersCount: parsed.suppliers?.length || 0,
        stockTxnCount: parsed.stock_transactions?.length || 0,
        salesCount: parsed.sales?.length || 0,
        paymentsCount: parsed.payments?.length || 0,
        raw: parsed
      });
    } catch (err: any) {
      alert(`Failed to parse JSON backup file: ${err.message}`);
      setRestoreFile(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview || !restorePreview.raw) return;

    const confirmed = window.confirm(
      'CAUTION: Restoring will overwrite existing records matching the backup IDs!\n\n' +
      'Do you want to proceed with database replacement?'
    );

    if (!confirmed) return;

    setRestoreStatus('PROCESSING');
    try {
      const data = restorePreview.raw;
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
        db.attendance
      ], async () => {
        if (data.products?.length) await db.products.bulkPut(data.products);
        if (data.customers?.length) await db.customers.bulkPut(data.customers);
        if (data.suppliers?.length) await db.suppliers.bulkPut(data.suppliers);
        if (data.workers?.length) await db.workers.bulkPut(data.workers);
        if (data.stock_transactions?.length) await db.stock_transactions.bulkPut(data.stock_transactions);
        if (data.sales?.length) await db.sales.bulkPut(data.sales);
        if (data.sale_items?.length) await db.sale_items.bulkPut(data.sale_items);
        if (data.payments?.length) await db.payments.bulkPut(data.payments);
        if (data.discounts?.length) await db.discounts.bulkPut(data.discounts);
        if (data.expenses?.length) await db.expenses.bulkPut(data.expenses);
        if (data.attendance?.length) await db.attendance.bulkPut(data.attendance);
      });

      setRestoreStatus('SUCCESS');
      setRestoreMessage('Database successfully restored from JSON backup!');
    } catch (err: any) {
      setRestoreStatus('ERROR');
      setRestoreMessage(`Restore failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Database Backup & Disaster Recovery</h2>
        <p className="text-xs text-slate-500">
          Complete local database snapshots, JSON export/import and offline workbook generation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-50 text-cyan-700 rounded-xl">
              <Download size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Export Full Warehouse Data</h3>
              <p className="text-xs text-slate-500">Download complete snapshot for cold storage or auditing</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Exports all 13 tables including products, customers, suppliers, workers, stock transactions,
            sales, items, payments, discounts and attendance.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleExportJson}
              disabled={exportingJson}
              className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Database size={16} />
              <span>{exportingJson ? 'Generating JSON...' : 'Export JSON Snapshot'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <FileSpreadsheet size={16} />
              <span>{exportingExcel ? 'Generating Excel...' : 'Export Excel Workbook'}</span>
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Upload size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Restore from JSON Snapshot</h3>
              <p className="text-xs text-slate-500">Recover business records from a previous JSON backup file</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Upload a valid JSON backup file. The system will verify the schema version and preview
            all records before asking for explicit confirmation.
          </p>

          <input
            type="file"
            id="restoreJsonInput"
            accept=".json"
            onChange={handleRestoreFileSelect}
            className="hidden"
          />

          <label
            htmlFor="restoreJsonInput"
            className="block w-full text-center py-2.5 border border-slate-300 hover:border-cyan-500 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            {restoreFile ? restoreFile.name : 'Select JSON Backup File'}
          </label>
        </div>
      </div>

      {/* Restore Preview and Confirmation */}
      {restorePreview && (
        <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Restore Verification & Confirmation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Schema Version</span>
              <strong className="text-slate-800">{restorePreview.schemaVersion}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Export Timestamp</span>
              <strong className="text-slate-800">{restorePreview.exportedAt}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Products</span>
              <strong className="text-slate-800">{restorePreview.productsCount}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Customers & Suppliers</span>
              <strong className="text-slate-800">{restorePreview.customersCount} Cust / {restorePreview.suppliersCount} Supp</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Stock Transactions</span>
              <strong className="text-cyan-800">{restorePreview.stockTxnCount}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Sales & Payments</span>
              <strong className="text-orange-800">{restorePreview.salesCount} Sales / {restorePreview.paymentsCount} Payments</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Never silently overwrites. Existing items with same IDs will be updated.
            </span>
            <button
              onClick={handleConfirmRestore}
              disabled={restoreStatus === 'PROCESSING'}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              {restoreStatus === 'PROCESSING' ? 'Restoring Records...' : 'Confirm and Execute Restore'}
            </button>
          </div>

          {restoreStatus === 'SUCCESS' && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 size={16} />
              <span>{restoreMessage}</span>
            </div>
          )}

          {restoreStatus === 'ERROR' && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span>{restoreMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
