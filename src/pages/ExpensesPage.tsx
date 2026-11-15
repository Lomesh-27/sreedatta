import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Filter } from 'lucide-react';
import { db } from '../db/warehouseDB';
import { Expense } from '@shared/schema';
import { generateId } from '@shared/calculations';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'TRANSPORT' as const,
    description: '',
    amount: 100,
    paymentMethod: 'CASH' as const
  });

  const loadData = async () => {
    const list = await db.expenses.orderBy('date').reverse().toArray();
    setExpenses(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleOpenAdd = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: 'TRANSPORT',
      description: '',
      amount: 500,
      paymentMethod: 'CASH'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      alert('Description is required.');
      return;
    }
    const newExp: Expense = {
      id: generateId('EXP'),
      date: form.date,
      category: form.category as any,
      description: form.description.trim(),
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod as any,
      createdAt: new Date().toISOString()
    };
    await db.expenses.put(newExp);
    setIsModalOpen(false);
    await loadData();
  };

  const filtered = expenses.filter(e => {
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Operational Expenses</h2>
          <p className="text-xs text-slate-500">Freight, daily hamali wages, warehouse aeration power and packaging</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Expenses</span>
            <span className="text-base font-bold text-rose-600">₹{totalExpenseAmount.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by description or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-slate-400" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">All Categories</option>
            <option value="TRANSPORT">TRANSPORT</option>
            <option value="LABOUR">LABOUR</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="ELECTRICITY">ELECTRICITY</option>
            <option value="PACKAGING">PACKAGING</option>
            <option value="ADMIN">ADMIN</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Expense ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 font-medium">{e.id}</td>
                  <td className="py-3 px-4 text-slate-600">{e.date}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{e.description}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-800">
                      {e.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600">
                    ₹{e.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Record Operating Expense</h3>
            <form onSubmit={handleSave} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="TRANSPORT">TRANSPORT</option>
                    <option value="LABOUR">LABOUR</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="ELECTRICITY">ELECTRICITY</option>
                    <option value="PACKAGING">PACKAGING</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Bill Particulars</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Lorry diesel freight / Hamali unloading"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Paid Via</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
