import React from 'react';
import { Menu, Download, ShieldCheck, LogOut, UserCheck } from 'lucide-react';
import { exportWarehouseToExcel } from '../services/excelService';
import { logoutAdmin, getSessionUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenSidebar: () => void;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, lowStockCount }) => {
  const navigate = useNavigate();
  const [exporting, setExporting] = React.useState(false);
  const user = getSessionUser();

  const handleExport = async () => {
    try {
      setExporting(true);
      const name = await exportWarehouseToExcel();
      alert(`Excel export complete! Downloaded: ${name}`);
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to lock the warehouse portal and logout?')) {
      logoutAdmin();
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-slate-800 leading-tight">
            Sree Datta Aqua Chemicals
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Warehouse Management & Business Analytics
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {lowStockCount > 0 && (
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{lowStockCount} Products Low</span>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Download size={15} />
          <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export Excel'}</span>
        </button>

        <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200 text-xs font-semibold text-slate-600">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Local IndexedDB</span>
        </div>

        {/* User Pill & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="hidden lg:flex items-center space-x-1.5 py-1 px-2.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
            <UserCheck size={14} className="text-cyan-700" />
            <span>{user?.username || 'Admin'}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
