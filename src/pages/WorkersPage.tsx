import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Calendar, Check, X, Clock } from 'lucide-react';
import { db } from '../db/warehouseDB';
import { Worker, WorkerAttendance } from '@shared/schema';
import { generateId } from '@shared/calculations';

export const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<WorkerAttendance[]>([]);
  const [activeTab, setActiveTab] = useState<'WORKERS' | 'ATTENDANCE'>('WORKERS');
  const [search, setSearch] = useState('');

  // Modals
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    contactInfo: '',
    designation: 'Warehouse Supervisor',
    joiningDate: new Date().toISOString().slice(0, 10),
    isActive: true
  });

  const [isAttModalOpen, setIsAttModalOpen] = useState(false);
  const [attForm, setAttForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    workerId: '',
    status: 'PRESENT' as const,
    notes: ''
  });

  const loadData = async () => {
    const w = await db.workers.toArray();
    const a = await db.attendance.orderBy('date').reverse().toArray();
    setWorkers(w);
    setAttendance(a);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddWorker = () => {
    setWorkerForm({
      name: '',
      contactInfo: '',
      designation: 'Warehouse Staff',
      joiningDate: new Date().toISOString().slice(0, 10),
      isActive: true
    });
    setIsWorkerModalOpen(true);
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name.trim()) {
      alert('Worker name is required.');
      return;
    }
    const newWorker: Worker = {
      id: generateId('WRK'),
      name: workerForm.name.trim(),
      contactInfo: workerForm.contactInfo.trim(),
      designation: workerForm.designation.trim(),
      joiningDate: workerForm.joiningDate,
      isActive: workerForm.isActive,
      createdAt: new Date().toISOString()
    };
    await db.workers.put(newWorker);
    setIsWorkerModalOpen(false);
    await loadData();
  };

  const handleOpenMarkAtt = () => {
    setAttForm({
      date: new Date().toISOString().slice(0, 10),
      workerId: workers[0]?.id || '',
      status: 'PRESENT',
      notes: ''
    });
    setIsAttModalOpen(true);
  };

  const handleSaveAtt = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = workers.find(wrk => wrk.id === attForm.workerId);
    if (!w) {
      alert('Select worker.');
      return;
    }
    const record: WorkerAttendance = {
      id: generateId('ATT'),
      date: attForm.date,
      workerId: w.id,
      workerName: w.name,
      status: attForm.status as any,
      notes: attForm.notes,
      createdAt: new Date().toISOString()
    };
    await db.attendance.put(record);
    setIsAttModalOpen(false);
    await loadData();
  };

  const filteredWorkers = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.designation.toLowerCase().includes(search.toLowerCase()) ||
    w.contactInfo.includes(search)
  );

  const filteredAtt = attendance.filter(a =>
    (a.workerName || '').toLowerCase().includes(search.toLowerCase()) ||
    a.date.includes(search) ||
    a.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Workers & Attendance</h2>
          <p className="text-xs text-slate-500">Warehouse handlers, chemical operators, supervisors and daily muster roll</p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'WORKERS' ? (
            <button
              onClick={handleOpenAddWorker}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus size={16} />
              <span>Add Worker</span>
            </button>
          ) : (
            <button
              onClick={handleOpenMarkAtt}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <Check size={16} />
              <span>Mark Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('WORKERS')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'WORKERS'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Warehouse Staff Directory ({workers.length})
        </button>
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'ATTENDANCE'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Daily Attendance Records ({attendance.length})
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={activeTab === 'WORKERS' ? "Search worker by name or designation..." : "Search attendance by worker or date..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'WORKERS' ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Worker ID</th>
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 font-medium">{w.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{w.name}</td>
                    <td className="py-3 px-4 text-slate-700">{w.designation}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{w.contactInfo || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">{w.joiningDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredWorkers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No worker records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4">Worker ID</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAtt.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-medium text-slate-800">{a.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{a.workerName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{a.workerId}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'HALF_DAY'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{a.notes || '-'}</td>
                  </tr>
                ))}
                {filteredAtt.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Warehouse Staff</h3>
            <form onSubmit={handleSaveWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Worker Name</label>
                <input
                  type="text"
                  required
                  value={workerForm.name}
                  onChange={e => setWorkerForm({ ...workerForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. P. Rambabu"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Designation / Role</label>
                <input
                  type="text"
                  required
                  value={workerForm.designation}
                  onChange={e => setWorkerForm({ ...workerForm, designation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Warehouse Supervisor, Inventory Incharge"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={workerForm.contactInfo}
                  onChange={e => setWorkerForm({ ...workerForm, contactInfo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="+91 91234 56780"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={workerForm.joiningDate}
                  onChange={e => setWorkerForm({ ...workerForm, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {isAttModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Mark Worker Attendance</h3>
            <form onSubmit={handleSaveAtt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={attForm.date}
                  onChange={e => setAttForm({ ...attForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Worker</label>
                <select
                  value={attForm.workerId}
                  onChange={e => setAttForm({ ...attForm, workerId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.designation})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={attForm.status}
                  onChange={e => setAttForm({ ...attForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="PRESENT">PRESENT (Full Day)</option>
                  <option value="HALF_DAY">HALF DAY</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Shift Remarks / Notes</label>
                <input
                  type="text"
                  value={attForm.notes}
                  onChange={e => setAttForm({ ...attForm, notes: e.target.value })}
                  placeholder="e.g. Overtime shift, forklift driver"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAttModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
