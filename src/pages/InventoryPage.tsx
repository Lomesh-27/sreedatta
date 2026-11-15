import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle, TrendingUp, Search, Filter } from 'lucide-react';
import { getInventorySummary } from '../db/warehouseDB';

export const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const loadData = async () => {
    const list = await getInventorySummary();
    setInventory(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalValue = inventory.reduce((sum, i) => sum + i.stockValue, 0);
  const totalUnits = inventory.reduce((sum, i) => sum + i.availableStock, 0);

  const filtered = inventory.filter(item => {
    const matchSearch =
      item.product.name.toLowerCase().includes(search.toLowerCase()) ||
      item.product.code.toLowerCase().includes(search.toLowerCase());
    const matchLow = !onlyLowStock || item.isLowStock;
    return matchSearch && matchLow;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventory & Stock Balance</h2>
          <p className="text-xs text-slate-500">
            Real-time physical inventory calculated from verified Stock In and Stock Out movements
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Inventory Value</div>
            <div className="text-base font-bold text-cyan-800">₹{totalValue.toLocaleString('en-IN')}</div>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Physical Units</div>
            <div className="text-base font-bold text-slate-800">{totalUnits} Units</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by product name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={e => setOnlyLowStock(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span>Show Only Low Stock ({inventory.filter(i => i.isLowStock).length})</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Stock In</th>
                <th className="py-3 px-4 text-right">Stock Out</th>
                <th className="py-3 px-4 text-right">Closing Balance</th>
                <th className="py-3 px-4 text-right">Min Threshold</th>
                <th className="py-3 px-4 text-right">Valuation (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={item.product.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{item.product.code}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{item.product.name}</td>
                  <td className="py-3 px-4 text-slate-500">{item.product.category}</td>
                  <td className="py-3 px-4 text-right text-cyan-700 font-semibold">
                    +{item.totalIn} {item.product.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-orange-700 font-semibold">
                    -{item.totalOut} {item.product.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800 text-sm">
                    {item.availableStock} {item.product.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {item.product.minimumStock} {item.product.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-700">
                    ₹{item.stockValue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.isLowStock ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle size={10} />
                        <span>LOW STOCK</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        HEALTHY
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No inventory records match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
