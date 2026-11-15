import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Eye, Trash2, Printer } from 'lucide-react';
import { db } from '../db/warehouseDB';
import { Sale, SaleItem, Customer, Product, Worker } from '@shared/schema';
import { createSaleTransaction, fetchSaleItems } from '../services/dataService';

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');

  // Invoice Details Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // New Sale Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    customerId: '',
    workerId: '',
    discountAmount: 0,
    paymentMethod: 'UPI' as const,
    notes: '',
    items: [
      { productId: '', quantity: 1, unitPrice: 0 }
    ]
  });

  const loadData = async () => {
    const s = await db.sales.orderBy('date').reverse().toArray();
    const c = await db.customers.toArray();
    const p = await db.products.toArray();
    const w = await db.workers.toArray();
    setSales(s);
    setCustomers(c);
    setProducts(p);
    setWorkers(w);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewInvoice = async (sale: Sale) => {
    setSelectedSale(sale);
    const items = await fetchSaleItems(sale.id);
    setSaleItems(items);
    setIsDetailsOpen(true);
  };

  const handleOpenCreate = () => {
    const firstCust = customers[0];
    const firstWrk = workers[0];
    const firstProd = products[0];

    setSaleForm({
      date: new Date().toISOString().slice(0, 10),
      customerId: firstCust?.id || '',
      workerId: firstWrk?.id || '',
      discountAmount: 0,
      paymentMethod: 'UPI',
      notes: '',
      items: [
        {
          productId: firstProd?.id || '',
          quantity: 1,
          unitPrice: firstProd?.sellingPrice || 0
        }
      ]
    });
    setIsCreateOpen(true);
  };

  const handleAddItemRow = () => {
    const firstProd = products[0];
    setSaleForm(f => ({
      ...f,
      items: [
        ...f.items,
        {
          productId: firstProd?.id || '',
          quantity: 1,
          unitPrice: firstProd?.sellingPrice || 0
        }
      ]
    }));
  };

  const handleRemoveItemRow = (idx: number) => {
    if (saleForm.items.length <= 1) return;
    setSaleForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    setSaleForm(f => {
      const updated = [...f.items];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        updated[idx] = {
          ...updated[idx],
          productId: value,
          unitPrice: prod ? prod.sellingPrice : updated[idx].unitPrice
        };
      } else {
        updated[idx] = {
          ...updated[idx],
          [field]: value
        };
      }
      return { ...f, items: updated };
    });
  };

  const grossTotal = saleForm.items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
  const netTotal = Math.max(0, grossTotal - (Number(saleForm.discountAmount) || 0));

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === saleForm.customerId);
    const wrk = workers.find(w => w.id === saleForm.workerId);

    if (!cust) {
      alert('Please select a valid customer.');
      return;
    }

    const payloadItems = saleForm.items.map(it => {
      const p = products.find(prod => prod.id === it.productId);
      return {
        productId: it.productId,
        productName: p ? p.name : 'Chemical Product',
        quantity: Number(it.quantity),
        unit: p ? p.unit : 'Unit',
        unitPrice: Number(it.unitPrice)
      };
    });

    const res = await createSaleTransaction({
      date: saleForm.date,
      customerId: cust.id,
      customerName: cust.name,
      workerId: wrk?.id || 'STAFF',
      workerName: wrk?.name || 'Staff',
      discountAmount: Number(saleForm.discountAmount) || 0,
      paymentMethod: saleForm.paymentMethod as any,
      notes: saleForm.notes,
      items: payloadItems
    });

    if (!res.success) {
      alert(`Sale Blocked: ${res.error}`);
      return;
    }

    setIsCreateOpen(false);
    await loadData();
  };

  const filtered = sales.filter(s =>
    (s.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.paymentMethod || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sales & Invoicing</h2>
          <p className="text-xs text-slate-500">
            Multi-product commercial invoices with live stock deduction and payment recording
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} />
          <span>New Multi-Product Sale</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by invoice number, customer name or payment method..."
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
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Gross (₹)</th>
                <th className="py-3 px-4 text-right">Discount (₹)</th>
                <th className="py-3 px-4 text-right">Net Amount (₹)</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-semibold text-cyan-800 text-xs">
                    {s.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{s.date}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{s.customerName}</td>
                  <td className="py-3 px-4 text-right text-slate-600">₹{s.grossAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right text-purple-700">₹{s.discountAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800 text-sm">
                    ₹{s.netAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{s.workerName || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleViewInvoice(s)}
                      className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {isDetailsOpen && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="text-xs font-bold text-cyan-700 uppercase tracking-wider">TAX INVOICE / SALE BILL</div>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedSale.invoiceNumber}</h3>
                <div className="text-xs text-slate-500">Date: {selectedSale.date} | Time: {selectedSale.time}</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
                  {selectedSale.paymentMethod}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-500 block">BILLED TO CUSTOMER:</span>
                <strong className="text-sm text-slate-800 block mt-0.5">{selectedSale.customerName}</strong>
                <span className="text-slate-500">ID: {selectedSale.customerId}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">DISPATCHED BY:</span>
                <strong className="text-sm text-slate-800 block mt-0.5">{selectedSale.workerName || 'Staff'}</strong>
                <span className="text-slate-500">{selectedSale.notes ? `Note: ${selectedSale.notes}` : ''}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {saleItems.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{it.productName}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-700">{it.quantity} {it.unit}</td>
                      <td className="py-2 px-3 text-right text-slate-600">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">₹{it.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5 text-xs text-right mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Gross Amount:</span>
                <span className="font-medium">₹{selectedSale.grossAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Promotional Discount:</span>
                <span className="font-medium">- ₹{selectedSale.discountAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Net Payable:</span>
                <span className="text-cyan-800">₹{selectedSale.netAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sale Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create Multi-Product Sale</h3>
            <form onSubmit={handleSaveSale} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={saleForm.date}
                    onChange={e => setSaleForm({ ...saleForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Customer</label>
                  <select
                    value={saleForm.customerId}
                    onChange={e => setSaleForm({ ...saleForm, customerId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.businessName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sales Rep / Worker</label>
                  <select
                    value={saleForm.workerId}
                    onChange={e => setSaleForm({ ...saleForm, workerId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sale Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/50">
                  {saleForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.unit}) - ₹{p.sellingPrice}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Unit Price"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div className="w-24 text-right font-bold text-xs text-slate-800">
                        ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={saleForm.items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Discounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={saleForm.paymentMethod}
                    onChange={e => setSaleForm({ ...saleForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="UPI">UPI (PhonePe / Google Pay / QR)</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDIT">Customer Credit (Outstanding)</option>
                  </select>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Notes</label>
                    <input
                      type="text"
                      value={saleForm.notes}
                      onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })}
                      placeholder="e.g. UPI Ref / Cheque No / Delivery terms"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Sales:</span>
                    <span className="font-bold">₹{grossTotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 font-semibold">Discount (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={saleForm.discountAmount}
                      onChange={e => setSaleForm({ ...saleForm, discountAmount: Number(e.target.value) })}
                      className="w-28 px-2 py-1 text-right text-xs border border-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Net Invoice Amount:</span>
                    <span className="text-cyan-800">₹{netTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Confirm & Finalize Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
