import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Eye, Phone, MapPin } from 'lucide-react';
import { db } from '../db/warehouseDB';
import { Supplier, StockIn } from '@shared/schema';
import { generateId } from '@shared/calculations';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockInList, setStockInList] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const [selectedSupp, setSelectedSupp] = useState<Supplier | null>(null);
  const [suppHistory, setSuppHistory] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const loadData = async () => {
    const s = await db.suppliers.toArray();
    const txns = await db.stock_transactions.where('type').equals('IN').toArray();
    setSuppliers(s);
    setStockInList(txns);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setForm({ name: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Supplier Name is required.');
      return;
    }
    const newSupp: Supplier = {
      id: generateId('SUPP'),
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      createdAt: new Date().toISOString()
    };
    await db.suppliers.put(newSupp);
    setIsModalOpen(false);
    await loadData();
  };

  const handleSelectSupplier = (s: Supplier) => {
    setSelectedSupp(s);
    const related = stockInList.filter(t => t.supplierId === s.id);
    setSuppHistory(related);
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Chemical Suppliers</h2>
          <p className="text-xs text-slate-500">Manufacturers, distributors and chemical plant partners</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by supplier name, phone or ID..."
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
                <th className="py-3 px-4">Supplier ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Plant Address</th>
                <th className="py-3 px-4 text-right">Shipments Received</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => {
                const count = stockInList.filter(t => t.supplierId === s.id).length;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 font-medium">{s.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{s.phone || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[200px]">{s.address || '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-cyan-800">{count}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSelectSupplier(s)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded text-xs font-semibold"
                      >
                        <Eye size={14} />
                        <span>Shipments</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No suppliers recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supply History Modal */}
      {selectedSupp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedSupp.name}</h3>
                <p className="text-xs text-slate-500">{selectedSupp.phone} | {selectedSupp.address}</p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Shipment History</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppHistory.map(t => (
                    <tr key={t.id}>
                      <td className="py-2 px-3 text-slate-600">{t.date}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{t.productName}</td>
                      <td className="py-2 px-3 text-right font-semibold text-cyan-800">+{t.quantity} {t.unit}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">₹{(t.totalValue || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {suppHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">No shipments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedSupp(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Supplier Record</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier / Company Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Aditya Chlor-Alkali Chemicals Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="+91 866 2456789"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Factory / Office Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Industrial Development Area, Guntur, AP"
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
