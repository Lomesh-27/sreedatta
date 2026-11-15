import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Eye, Phone, MapPin, Building, CreditCard } from 'lucide-react';
import { db } from '../db/warehouseDB';
import { Customer, Sale, Payment } from '@shared/schema';
import { generateId, calculateCustomerOutstanding } from '@shared/calculations';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');

  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [custSales, setCustSales] = useState<Sale[]>([]);
  const [custOutstanding, setCustOutstanding] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    businessName: '',
    notes: ''
  });

  const loadData = async () => {
    const c = await db.customers.toArray();
    const s = await db.sales.toArray();
    const p = await db.payments.toArray();
    setCustomers(c);
    setSales(s);
    setPayments(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setForm({
      name: '',
      phone: '',
      address: '',
      businessName: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Customer Name is required.');
      return;
    }
    const newCust: Customer = {
      id: generateId('CUST'),
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      businessName: form.businessName.trim() || form.name.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString()
    };
    await db.customers.put(newCust);
    setIsModalOpen(false);
    await loadData();
  };

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCust(c);
    const relatedSales = sales.filter(s => s.customerId === c.id);
    const saleIds = new Set(relatedSales.map(s => s.id));
    const relatedPayments = payments.filter(p => saleIds.has(p.referenceId));
    const stats = calculateCustomerOutstanding(relatedSales, relatedPayments);

    setCustSales(relatedSales);
    setCustOutstanding(stats.outstanding);
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.businessName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customer Directory</h2>
          <p className="text-xs text-slate-500">Aqua farmers, hatcheries and commercial pond operators</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by customer name, farm business or phone..."
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
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Farmer / Contact</th>
                <th className="py-3 px-4">Business / Pond Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Invoices</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => {
                const count = sales.filter(s => s.customerId === c.id).length;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 font-medium">{c.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                    <td className="py-3 px-4 text-slate-700">{c.businessName}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{c.phone || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[180px]">{c.address || '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-cyan-800">{count}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSelectCustomer(c)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded text-xs font-semibold"
                      >
                        <Eye size={14} />
                        <span>History</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Purchase History Modal */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedCust.name}</h3>
                <p className="text-xs text-slate-500">{selectedCust.businessName} | {selectedCust.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Outstanding</span>
                <span className="text-base font-extrabold text-orange-600">
                  ₹{custOutstanding.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Purchase Invoices</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Invoice</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Net Amount</th>
                    <th className="py-2.5 px-3 text-center">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {custSales.map(s => (
                    <tr key={s.id}>
                      <td className="py-2 px-3 font-mono font-medium text-cyan-800">{s.invoiceNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{s.date}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">₹{s.netAmount.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-800">
                          {s.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {custSales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">No invoices on record.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCust(null)}
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
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Customer Record</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer / Farmer Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. K. Venkateswara Rao"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Farm / Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => setForm({ ...form, businessName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Venkateswara Aqua Farms"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="+91 98480 12345"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address / Pond Location</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Pond Site 4, Bhimavaram, West Godavari"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Shrimp hatchery, prefers UPI"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
