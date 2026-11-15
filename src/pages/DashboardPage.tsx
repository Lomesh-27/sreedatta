import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Tag,
  CreditCard,
  Receipt,
  AlertTriangle,
  RotateCw,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { db, getInventorySummary } from '../db/warehouseDB';
import { resetAndLoadSampleData } from '../services/dataService';
import { getSampleWarehouseData } from '@shared/sampleData';

const COLORS = ['#0891b2', '#f97316', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    availableStock: 0,
    totalStockReceived: 0,
    totalStockSold: 0,
    totalRevenue: 0,
    totalDiscounts: 0,
    outstandingPayments: 0,
    totalExpenses: 0,
    lowStockCount: 0
  });

  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [stockMovementData, setStockMovementData] = useState<any[]>([]);
  const [productSalesData, setProductSalesData] = useState<any[]>([]);
  const [customerSalesData, setCustomerSalesData] = useState<any[]>([]);
  const [discountData, setDiscountData] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const products = await db.products.toArray();
      const txns = await db.stock_transactions.toArray();
      const sales = await db.sales.toArray();
      const saleItems = await db.sale_items.toArray();
      const payments = await db.payments.toArray();
      const expenses = await db.expenses.toArray();
      const discounts = await db.discounts.toArray();
      const inventory = await getInventorySummary();

      // Aggregate calculations
      const totalStockReceived = txns
        .filter(t => t.type === 'IN')
        .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

      const totalStockSold = txns
        .filter(t => t.type === 'OUT' && (t.reason === 'SALE' || t.saleId))
        .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

      const availableStock = inventory.reduce((sum, i) => sum + i.availableStock, 0);

      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.netAmount || 0), 0);
      const totalDiscounts = sales.reduce((sum, s) => sum + Number(s.discountAmount || 0), 0);

      const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const outstandingPayments = Math.max(0, totalRevenue - totalPayments);

      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const lowStockItems = inventory.filter(i => i.isLowStock && i.product.isActive);

      setMetrics({
        totalProducts: products.length,
        availableStock,
        totalStockReceived,
        totalStockSold,
        totalRevenue,
        totalDiscounts,
        outstandingPayments,
        totalExpenses,
        lowStockCount: lowStockItems.length
      });

      setLowStockProducts(lowStockItems);

      // 1. Daily Revenue Chart
      const dailyMap = new Map<string, number>();
      for (const s of sales) {
        dailyMap.set(s.date, (dailyMap.get(s.date) || 0) + s.netAmount);
      }
      const sortedDates = Array.from(dailyMap.keys()).sort();
      const dailyChart = sortedDates.slice(-14).map(d => ({
        date: d.slice(5),
        revenue: Math.round(dailyMap.get(d) || 0)
      }));
      setDailyRevenueData(dailyChart);

      // 2. Monthly Revenue Chart
      const monthMap = new Map<string, number>();
      for (const s of sales) {
        const m = s.date.slice(0, 7); // YYYY-MM
        monthMap.set(m, (monthMap.get(m) || 0) + s.netAmount);
      }
      const monthlyChart = Array.from(monthMap.entries()).map(([m, rev]) => ({
        month: m,
        revenue: Math.round(rev)
      }));
      setMonthlyRevenueData(monthlyChart);

      // 3. Stock In vs Stock Out by Product Category or Product
      const stockCompMap = new Map<string, { inQty: number; outQty: number }>();
      for (const t of txns) {
        const name = (t.productName || 'Unknown').split(' ')[0];
        const cur = stockCompMap.get(name) || { inQty: 0, outQty: 0 };
        if (t.type === 'IN') cur.inQty += t.quantity;
        if (t.type === 'OUT') cur.outQty += t.quantity;
        stockCompMap.set(name, cur);
      }
      const stockCompChart = Array.from(stockCompMap.entries()).slice(0, 6).map(([name, val]) => ({
        product: name,
        StockIn: val.inQty,
        StockOut: val.outQty
      }));
      setStockMovementData(stockCompChart);

      // 4. Product-wise Sales
      const prodSalesMap = new Map<string, number>();
      for (const it of saleItems) {
        const shortName = (it.productName || 'Product').slice(0, 18);
        prodSalesMap.set(shortName, (prodSalesMap.get(shortName) || 0) + it.totalAmount);
      }
      const prodChart = Array.from(prodSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, amount]) => ({ name, amount: Math.round(amount) }));
      setProductSalesData(prodChart);

      // 5. Customer-wise Sales
      const custSalesMap = new Map<string, number>();
      for (const s of sales) {
        const cName = (s.customerName || 'Customer').split(' ')[0];
        custSalesMap.set(cName, (custSalesMap.get(cName) || 0) + s.netAmount);
      }
      const custChart = Array.from(custSalesMap.entries())
        .map(([name, value]) => ({ name, value: Math.round(value) }));
      setCustomerSalesData(custChart);

      // 6. Discount & Revenue Breakdown
      setDiscountData([
        { name: 'Net Revenue', value: Math.round(totalRevenue) },
        { name: 'Discounts Granted', value: Math.round(totalDiscounts) },
        { name: 'Warehouse Expenses', value: Math.round(totalExpenses) }
      ]);

      // Recent transactions (last 8)
      const sortedTxns = [...txns].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      setRecentTransactions(sortedTxns.slice(0, 8));

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSeedData = async () => {
    if (confirm('Load sample Sree Datta Aqua Chemicals warehouse dataset into IndexedDB?')) {
      const sample = getSampleWarehouseData();
      await resetAndLoadSampleData(sample);
      await loadDashboardData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 text-white">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} />
            <span>Sree Datta Aqua Chemicals Operations</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 tracking-tight">Warehouse Intelligence Dashboard</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time offline warehouse analytics calculated dynamically from local IndexedDB records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {metrics.totalProducts === 0 && (
            <button
              onClick={handleSeedData}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg text-sm font-bold shadow-md transition-all"
            >
              <Sparkles size={16} />
              <span>Load Sree Datta Demo Dataset</span>
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Products</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-800">{metrics.totalProducts}</div>
          <div className="mt-1 text-xs text-slate-500">Active catalog SKUs</div>
        </div>

        {/* Available Stock */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Available Stock</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-700">{metrics.availableStock} Units</div>
          <div className="mt-1 text-xs text-slate-500">Total closing warehouse balance</div>
        </div>

        {/* Stock Received vs Sold */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Stock In / Sold</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-800">
            <span className="text-blue-600">{metrics.totalStockReceived}</span> / <span className="text-orange-600">{metrics.totalStockSold}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Total received vs total dispatched</div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Low Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600">{metrics.lowStockCount}</div>
          <div className="mt-1 text-xs text-slate-500">Items below minimum reorder level</div>
        </div>

        {/* Total Net Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Net Revenue</span>
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-cyan-800">₹{metrics.totalRevenue.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-xs text-slate-500">Net sales (Gross - Discounts)</div>
        </div>

        {/* Total Discounts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Discounts</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Tag size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-700">₹{metrics.totalDiscounts.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-xs text-slate-500">Customer promotional concessions</div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Outstanding Payments</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-orange-600">₹{metrics.outstandingPayments.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-xs text-slate-500">Pending customer receivables</div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Operating Expenses</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Receipt size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-600">₹{metrics.totalExpenses.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-xs text-slate-500">Freight, wages & maintenance</div>
        </div>
      </div>

      {/* Charts Section: 6 Analytical Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Revenue */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Daily Revenue Trend</h3>
              <p className="text-xs text-slate-500">Net revenue by transaction date</p>
            </div>
            <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md">Last 14 Days</span>
          </div>
          <div className="h-64">
            {dailyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No sales recorded yet.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Monthly Revenue */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Monthly Revenue Comparison</h3>
              <p className="text-xs text-slate-500">Aggregated sales performance per month</p>
            </div>
            <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md">Monthly</span>
          </div>
          <div className="h-64">
            {monthlyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Net Revenue']} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No monthly data available.</div>
            )}
          </div>
        </div>

        {/* Chart 3: Stock In vs Stock Out */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Stock In vs Stock Out Movements</h3>
              <p className="text-xs text-slate-500">Volume comparison per key aqua chemical product</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">Units</span>
          </div>
          <div className="h-64">
            {stockMovementData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockMovementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="product" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="StockIn" fill="#06b6d4" name="Stock In" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="StockOut" fill="#ea580c" name="Stock Out" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No stock movements recorded.</div>
            )}
          </div>
        </div>

        {/* Chart 4: Product-wise Sales Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Product-wise Sales Revenue</h3>
              <p className="text-xs text-slate-500">Highest grossing chemicals</p>
            </div>
            <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md">Top SKUs</span>
          </div>
          <div className="h-64">
            {productSalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productSalesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']} />
                  <Bar dataKey="amount" fill="#0891b2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No product sales yet.</div>
            )}
          </div>
        </div>

        {/* Chart 5: Customer-wise Sales Share */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Customer-wise Sales Distribution</h3>
              <p className="text-xs text-slate-500">Volume share among key hatcheries & farms</p>
            </div>
          </div>
          <div className="h-64">
            {customerSalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerSalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {customerSalesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No customer sales data.</div>
            )}
          </div>
        </div>

        {/* Chart 6: Financial Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Financial Health & Expense Analysis</h3>
              <p className="text-xs text-slate-500">Revenue, discounts & operational costs</p>
            </div>
          </div>
          <div className="h-64">
            {discountData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={discountData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No financial data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tables: Low Stock Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Low Stock Inventory Alerts</h3>
            </div>
            <span className="text-xs text-slate-500">{lowStockProducts.length} items requiring reorder</span>
          </div>

          <div className="overflow-x-auto">
            {lowStockProducts.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-right">Available</th>
                    <th className="pb-2 text-right">Min Stock</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockProducts.map(item => (
                    <tr key={item.product.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-medium text-slate-800">{item.product.name}</td>
                      <td className="py-2.5 text-slate-500">{item.product.category}</td>
                      <td className="py-2.5 text-right font-bold text-amber-600">
                        {item.availableStock} {item.product.unit}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {item.product.minimumStock} {item.product.unit}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                          REORDER
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                All products maintain healthy stock levels above minimum thresholds.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Recent Warehouse Transactions</h3>
            <span className="text-xs text-slate-500">Latest activity</span>
          </div>

          <div className="overflow-x-auto">
            {recentTransactions.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Product</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2">Party / Worker</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'IN'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-slate-800 truncate max-w-[140px]">{tx.productName}</td>
                      <td className="py-2.5 text-right font-bold text-slate-700">
                        {tx.quantity} {tx.unit}
                      </td>
                      <td className="py-2.5 text-slate-500 truncate max-w-[120px]">
                        {tx.supplierName || tx.recipient || tx.responsibleWorkerName || '-'}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent transactions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
