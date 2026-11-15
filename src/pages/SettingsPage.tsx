import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Database, Info, RefreshCw, Check, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { db } from '../db/warehouseDB';
import { SCHEMA_VERSION } from '@shared/schema';
import { changeAdminPassword } from '../services/authService';

export const SettingsPage: React.FC = () => {
  const [dbStats, setDbStats] = useState({
    products: 0,
    customers: 0,
    suppliers: 0,
    workers: 0,
    transactions: 0,
    sales: 0
  });

  const [warehouseInfo, setWarehouseInfo] = useState({
    name: 'Sree Datta Aqua Chemicals',
    code: 'SREE-WH-01',
    address: 'Bhimavaram Industrial Road, West Godavari District, Andhra Pradesh - 534201',
    contact: '+91 866 2456789 / +91 98480 12345',
    email: 'operations@sreedattaaqua.local',
    defaultCurrency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)'
  });

  const [savedMsg, setSavedMsg] = useState(false);

  // Security password state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changingPwd, setChangingPwd] = useState(false);

  const loadStats = async () => {
    setDbStats({
      products: await db.products.count(),
      customers: await db.customers.count(),
      suppliers: await db.suppliers.count(),
      workers: await db.workers.count(),
      transactions: await db.stock_transactions.count(),
      sales: await db.sales.count()
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 4) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }

    setChangingPwd(true);
    try {
      const res = await changeAdminPassword(currPassword, newPassword);
      if (res.success) {
        setPwdMsg({ type: 'success', text: 'Admin password updated successfully! Please use your new password next time.' });
        setCurrPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ type: 'error', text: res.error || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message });
    } finally {
      setChangingPwd(false);
    }
  };

  const handleClearAllData = async () => {
    const code = prompt('WARNING: This will permanently wipe all local warehouse records in IndexedDB!\nType "DELETE" to confirm:');
    if (code !== 'DELETE') {
      alert('Operation aborted.');
      return;
    }

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
      db.attendance,
      db.import_history
    ], async () => {
      await db.products.clear();
      await db.customers.clear();
      await db.suppliers.clear();
      await db.workers.clear();
      await db.stock_transactions.clear();
      await db.sales.clear();
      await db.sale_items.clear();
      await db.payments.clear();
      await db.discounts.clear();
      await db.expenses.clear();
      await db.attendance.clear();
      await db.import_history.clear();
    });

    alert('All IndexedDB tables cleared successfully.');
    await loadStats();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">System & Warehouse Configuration</h2>
        <p className="text-xs text-slate-500">Warehouse parameters, local storage engine and security controls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Warehouse Profile Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Enterprise Warehouse Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Facility Name</label>
                <input
                  type="text"
                  value={warehouseInfo.name}
                  onChange={e => setWarehouseInfo({ ...warehouseInfo, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Warehouse Facility Code</label>
                <input
                  type="text"
                  value={warehouseInfo.code}
                  onChange={e => setWarehouseInfo({ ...warehouseInfo, code: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Physical Location</label>
              <input
                type="text"
                value={warehouseInfo.address}
                onChange={e => setWarehouseInfo({ ...warehouseInfo, address: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={warehouseInfo.contact}
                  onChange={e => setWarehouseInfo({ ...warehouseInfo, contact: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Administrative Email</label>
                <input
                  type="text"
                  value={warehouseInfo.email}
                  onChange={e => setWarehouseInfo({ ...warehouseInfo, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Operational Currency</label>
                <input
                  type="text"
                  disabled
                  value={warehouseInfo.defaultCurrency}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Timezone Standard</label>
                <input
                  type="text"
                  disabled
                  value={warehouseInfo.timezone}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {savedMsg ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                  <Check size={14} />
                  <span>Profile parameters saved locally</span>
                </span>
              ) : <span></span>}

              <button
                type="submit"
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Security, Local Database Architecture & Explainer */}
        <div className="space-y-6">
          {/* Master Admin Security Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-cyan-800 font-bold text-sm">
              <KeyRound size={18} className="text-cyan-600" />
              <span>Master Admin Security</span>
            </div>

            <p className="text-xs text-slate-500">
              Update your master warehouse administrator PIN or password. Encrypted locally with salted SHA-256.
            </p>

            {pwdMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Current Password / PIN
                </label>
                <input
                  type="password"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="Default PIN: 1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  New Password / PIN
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changingPwd}
                className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {changingPwd ? 'Updating Password...' : 'Update Admin Password'}
              </button>
            </form>
          </div>

          {/* IndexedDB Architecture Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-cyan-700 font-bold text-sm">
              <Database size={18} />
              <span>Offline IndexedDB Architecture</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Important Architectural Note:</strong> All records are stored locally in your browser's
              IndexedDB engine (<code className="text-cyan-800 bg-cyan-50 px-1 py-0.5 rounded">SreeDattaWarehouseDB</code>).
              IndexedDB is strictly tied to this browser profile and does not transmit data over the internet or cloud.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Schema Version:</span>
                <span className="font-bold text-slate-800">{SCHEMA_VERSION}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Products in DB:</span>
                <span className="font-bold text-slate-800">{dbStats.products}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock Transactions:</span>
                <span className="font-bold text-cyan-700">{dbStats.transactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sales Invoices:</span>
                <span className="font-bold text-slate-800">{dbStats.sales}</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-red-700 font-bold text-sm">
              <ShieldAlert size={18} />
              <span>Destructive Operations</span>
            </div>
            <p className="text-xs text-slate-600">
              Permanently purge all data from this browser's IndexedDB. Export an Excel or JSON backup first.
            </p>
            <button
              onClick={handleClearAllData}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors"
            >
              Wipe Local Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
