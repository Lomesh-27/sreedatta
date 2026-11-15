import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, Plus, Search, Calendar } from 'lucide-react';
import { db, StockTransactionRecord } from '../db/warehouseDB';
import { Product, Supplier } from '@shared/schema';
import { addStockIn } from '../services/dataService';

export const StockInPage: React.FC = () => {
  const [stockInList, setStockInList] = useState<StockTransactionRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    productId: '',
    supplierId: '',
    quantity: 1,
    purchasePrice: 0,
    invoiceReferenceNumber: '',
    notes: ''
  });

  const loadData = async () => {
    const txns = await db.stock_transactions.where('type').equals('IN').reverse().sortBy('date');
    const prods = await db.products.toArray();
    const supps = await db.suppliers.toArray();
    setStockInList(txns);
    setProducts(prods);
    setSuppliers(supps);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    const firstProd = products[0];
    const firstSupp = suppliers[0];
    setForm({
      date: new Date().toISOString().slice(0, 10),
      productId: firstProd?.id || '',
      supplierId: firstSupp?.id || '',
      quantity: 10,
      purchasePrice: firstProd?.purchasePrice || 0,
      invoiceReferenceNumber: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleProductChange = (prodId: string) => {
    const p = products.find(prod => prod.id === prodId);
    setForm(f => ({
      ...f,
      productId: prodId,
      purchasePrice: p ? p.purchasePrice : f.purchasePrice
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProd = products.find(p => p.id === form.productId);
    const selectedSupp = suppliers.find(s => s.id === form.supplierId);

    if (!selectedProd) {
      alert('Please select a valid product.');
      return;
    }

    await addStockIn({
      date: form.date,
      productId: selectedProd.id,
      productName: selectedProd.name,
      supplierId: selectedSupp?.id || 'DIRECT',
      supplierName: selectedSupp?.name || 'Direct Procurement',
      quantity: Number(form.quantity),
      unit: selectedProd.unit,
      purchasePrice: Number(form.purchasePrice),
      invoiceReferenceNumber: form.invoiceReferenceNumber,
      notes: form.notes
    });

    setIsModalOpen(false);
    await loadData();
  };

  const filtered = stockInList.filter(s =>
    (s.productName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.supplierName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.invoiceReferenceNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Stock In (Procurement & Inward)</h2>
          <p className="text-xs text-slate-500">Record supplier shipments, invoice details and bulk batch arrivals</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>Record Stock In</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by product, supplier or invoice ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Txn ID / Ref</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{item.id}</span>
                    {item.invoiceReferenceNumber && (
                      <span className="block text-[10px] text-cyan-700">Inv: {item.invoiceReferenceNumber}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{item.date}</div>
                    <div className="text-[10px] text-slate-400">{item.time}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{item.productName}</td>
                  <td className="py-3 px-4 text-slate-600">{item.supplierName || 'Direct'}</td>
                  <td className="py-3 px-4 text-right font-bold text-cyan-800">
                    +{item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">₹{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    ₹{(item.totalValue || (item.quantity * (item.unitPrice || 0))).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[150px]">{item.notes || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No Stock In transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Record Stock In Shipment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice / DC Number</label>
                  <input
                    type="text"
                    value={form.invoiceReferenceNumber}
                    onChange={e => setForm({ ...form, invoiceReferenceNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g. AD-2026-9812"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Product</label>
                <select
                  value={form.productId}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit}) - Standard Buy: ₹{p.purchasePrice}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier</label>
                <select
                  value={form.supplierId}
                  onChange={e => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Purchase Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.purchasePrice}
                    onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-800">Total Purchase Value:</span>
                <span className="font-bold text-sm text-cyan-900">
                  ₹{(form.quantity * form.purchasePrice).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Batch number, quality inspection remarks"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Confirm Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
