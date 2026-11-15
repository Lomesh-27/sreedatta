import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getInventorySummary } from '../db/warehouseDB';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  const refreshLowStock = async () => {
    try {
      const inv = await getInventorySummary();
      const count = inv.filter(i => i.isLowStock && i.product.isActive).length;
      setLowStockCount(count);
    } catch {
      // ignore if db loading
    }
  };

  useEffect(() => {
    refreshLowStock();
    const interval = setInterval(refreshLowStock, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        lowStockCount={lowStockCount}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          lowStockCount={lowStockCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
