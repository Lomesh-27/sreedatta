import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Users,
  Truck,
  UserCheck,
  Receipt,
  BarChart3,
  FileSpreadsheet,
  History,
  Database,
  Settings,
  Menu,
  X,
  Droplets,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockCount: number;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/inventory', label: 'Inventory Stock', icon: Layers, badge: 'lowStock' },
  { path: '/stock-in', label: 'Stock In', icon: ArrowDownLeft },
  { path: '/stock-out', label: 'Stock Out', icon: ArrowUpRight },
  { path: '/sales', label: 'Sales & Invoices', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/workers', label: 'Workers & Attendance', icon: UserCheck },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { path: '/excel-import', label: 'Excel Import', icon: FileSpreadsheet },
  { path: '/import-history', label: 'Import History', icon: History },
  { path: '/backup-restore', label: 'Backup & Restore', icon: Database },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, lowStockCount }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <img src="/logo_icon.png" alt="Logo" className="w-9 h-9 object-contain drop-shadow" />
            <div>
              <div className="font-bold text-sm tracking-wide text-white leading-tight">SREE DATTA</div>
              <div className="text-[10px] text-cyan-400 font-semibold tracking-wider">AQUA CHEMICALS</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-sm shadow-cyan-900/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge === 'lowStock' && lowStockCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white">
                    {lowStockCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center space-x-2 text-cyan-400 font-medium">
            <Droplets size={14} />
            <span>Offline-First Engine</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Local IndexedDB: SreeDattaWarehouseDB
          </div>
        </div>
      </aside>
    </>
  );
};
