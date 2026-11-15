import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Plus, Search, AlertCircle } from 'lucide-react';
import { db, StockTransactionRecord } from '../db/warehouseDB';
import { Product, Worker } from '@shared/schema';
import { addStockOut, getProductAvailableStock } from '../services/dataService';

export const StockOutPage: React.FC = () => {
  const [stockOutList, setStockOutList] = useState<StockTransactionRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAvailable, setCurrentAvailable] = useState<number | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    productId: '',
    quantity: 1,
    reason: 'SALE' as const,
    recipient: '',
    responsibleWorkerId: '',
    notes: '',
    allowNegativeOverride: false
  });

  const loadData = async () => {
    const txns = await db.stock_transactions.where('type').equals('OUT').reverse().sortBy('date');
    const prods = await db.products.toArray();
    const wrks = await db.workers.toArray();
    setStockOutList(txns);
    setProducts(prods);
    setWorkers(wrks);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = async () => {
    const firstProd = products[0];
    const firstWrk = workers[0];
    const avail = firstProd ? await getProductAvailableStock(firstProd.id) : 0;
    setCurrentAvailable(avail);

    setForm({
      date: new Date().toISOString().slice(0, 10),
      productId: firstProd?.id || '',
      quantity: 1,
      reason: 'SALE',
      recipient: '',
      responsibleWorkerId: firstWrk?.id || '',
      notes: '',
      allowNegativeOverride: false
    });
    setIsModalOpen(true);
  };

  const handleProductChange = async (prodId: string) => {
    setForm(f => ({ ...f, productId: prodId }));
    const avail = await getProductAvailableStock(prodId);
    setCurrentAvailable(avail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProd = products.find(p => p.id === form.productId);
    const selectedWrk = workers.find(w => w.id === form.responsibleWorkerId);

    if (!selectedProd) {
      alert('Please select a valid product.');
      return;
    }

    const res = await addStockOut({
      date: form.date,
      productId: selectedProd.id,
      productName: selectedProd.name,
      quantity: Number(form.quantity),
      unit: selectedProd.unit,
      reason: form.reason as any,
      recipient: form.recipient || 'Customer',
      responsibleWorkerId: selectedWrk?.id || 'STAFF',
      responsibleWorkerName: selectedWrk?.name || 'Warehouse Staff',
      notes: form.notes,
      allowNegativeOverride: form.allowNegativeOverride
    });

    if (!res.success) {
      alert(`Stock Out Blocked: ${res.error}`);
      return;
    }

    setIsModalOpen(false);
    await loadData();
  };

  const filtered = stockOutList.filter(s =>
    (s.productName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.recipient || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.responsibleWorkerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Stock Out (Dispatch & Adjustments)</h2>
          <p className="text-xs text-slate-500">Record sales dispatches, pond demonstrations, damaged stocks and internal transfers</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>Record Stock Out</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by product, recipient or worker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Handler</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{item.id}</span>
                    {item.saleId && (
                      <span className="block text-[10px] text-cyan-700">Sale: {item.saleId}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{item.date}</div>
                    <div className="text-[10px] text-slate-400">{item.time}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{item.productName}</td>
                  <td className="py-3 px-4 text-right font-bold text-orange-700">
                    -{item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.reason}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{item.recipient || '-'}</td>
                  <td className="py-3 px-4 text-slate-600">{item.responsibleWorkerName || '-'}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[150px]">{item.notes || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No Stock Out transactions recorded.
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
            <h3 className="text-lg font-bold text-slate-800 mb-4">Record Stock Out Movement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Reason</label>
                  <select
                    value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="SALE">SALE</option>
                    <option value="DAMAGE">DAMAGE</option>
                    <option value="SAMPLE">SAMPLE</option>
                    <option value="EXPIRY">EXPIRY</option>
                    <option value="INTERNAL_USE">INTERNAL USE</option>
                    <option value="RETURN_TO_SUPPLIER">RETURN TO SUPPLIER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Product</label>
                <select
                  value={form.productId}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                  ))}
                </select>
                {currentAvailable !== null && (
                  <div className="mt-1 text-xs text-slate-500">
                    Currently available in warehouse: <strong className="text-slate-800">{currentAvailable} Units</strong>
                  </div>
                )}
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Responsible Worker</label>
                  <select
                    value={form.responsibleWorkerId}
                    onChange={e => setForm({ ...form, responsibleWorkerId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.designation})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Recipient / Farm / Vehicle</label>
                <input
                  type="text"
                  required
                  value={form.recipient}
                  onChange={e => setForm({ ...form, recipient: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Venkateswara Aqua Farms (Vehicle AP16-TU-4421)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Purpose of dispatch, driver phone"
                />
              </div>

              {currentAvailable !== null && form.quantity > currentAvailable && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2 text-red-700 text-xs font-bold">
                    <AlertCircle size={16} />
                    <span>Warning: Requested quantity ({form.quantity}) exceeds available stock ({currentAvailable})!</span>
                  </div>
                  <label className="flex items-center space-x-2 text-xs text-red-800 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowNegativeOverride}
                      onChange={e => setForm({ ...form, allowNegativeOverride: e.target.checked })}
                      className="rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    <span>Explicitly authorize negative stock adjustment override</span>
                  </label>
                </div>
              )}

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
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Confirm Stock Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
