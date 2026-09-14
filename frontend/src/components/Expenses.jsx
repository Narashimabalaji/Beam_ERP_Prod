import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, TrendingDown, Calendar, Pencil, Trash2, X, Check, IndianRupee, ArrowDownRight, BarChart3, Filter } from 'lucide-react';

const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ total_expenses: 0, entry_count: 0, average_transaction: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filter state
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-12, 0=All
  const [filterDay, setFilterDay] = useState(0); // 1-31, 0=All
  
  const emptyForm = {
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/stats/expenses?year=${filterYear}`;
      if (filterMonth > 0) url += `&month=${filterMonth}`;
      if (filterDay > 0) url += `&day=${filterDay}`;
      
      const res = await axios.get(url);
      setExpenses(res.data.records);
      setStats(res.data.stats);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [filterYear, filterMonth, filterDay]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description || '',
      date: new Date(formData.date).toISOString()
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/expenses/${editingId}`, payload);
        setEditingId(null);
      } else {
        await axios.post('http://localhost:8000/expenses', payload);
      }
      setFormData(emptyForm);
      setShowForm(false);
      fetchAllData();
    } catch (error) {
      console.error("Error saving expense", error);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      category: item.category,
      amount: String(item.amount),
      description: item.description || '',
      date: new Date(item.date).toISOString().split('T')[0]
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      await axios.delete(`http://localhost:8000/expenses/${id}`);
      fetchAllData();
    } catch (error) {
      console.error("Error deleting expense", error);
    }
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  // Filter Helpers
  const availableYears = Array.from({length: 10}, (_, i) => now.getFullYear() - 5 + i).sort((a,b) => b-a);
  const daysInMonth = filterMonth > 0 ? new Date(filterYear, filterMonth, 0).getDate() : 31;
  const availableDays = ['All', ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  const setCurrentMonth = () => {
    setFilterYear(now.getFullYear());
    setFilterMonth(now.getMonth() + 1);
    setFilterDay(0);
  };

  const setToday = () => {
    setFilterYear(now.getFullYear());
    setFilterMonth(now.getMonth() + 1);
    setFilterDay(now.getDate());
  };

  const clearFilter = () => {
    setFilterYear(now.getFullYear());
    setFilterMonth(0);
    setFilterDay(0);
  };

  const handleMonthChange = (e) => {
    const val = Number(e.target.value);
    setFilterMonth(val);
    if (val === 0) setFilterDay(0);
  };

  const isCurrentMonth = filterYear === now.getFullYear() && filterMonth === now.getMonth() + 1 && filterDay === 0;
  const isToday = filterYear === now.getFullYear() && filterMonth === now.getMonth() + 1 && filterDay === now.getDate();

  let filterLabel = `${filterYear} · All Months`;
  if (filterMonth > 0) {
    filterLabel = filterDay > 0 
      ? `${filterDay} ${MONTHS[filterMonth]} ${filterYear}`
      : `${MONTHS[filterMonth]} ${filterYear}`;
  }

  const fmt = (v) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 tracking-tight">Expense Management</h2>
          <p className="text-slate-500 text-sm mt-1">Track and manage all outgoing expenses</p>
        </div>
        <button 
          onClick={() => { showForm ? handleCancel() : setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-5 py-2.5 rounded-xl transition-all shadow-md"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-brand-700" />
          <span className="text-sm font-bold text-brand-900">{filterLabel}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-brand-50 rounded-lg p-0.5 border border-brand-100 mr-2">
            <button
              onClick={setToday}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                isToday ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-600 hover:text-brand-800'
              }`}
            >
              Today
            </button>
            <button
              onClick={setCurrentMonth}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                isCurrentMonth ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-600 hover:text-brand-800'
              }`}
            >
              This Month
            </button>
          </div>

          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={filterMonth}
            onChange={handleMonthChange}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>

          {filterMonth > 0 && (
            <select
              value={filterDay}
              onChange={e => setFilterDay(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {availableDays.map((d, i) => <option key={i} value={d === 'All' ? 0 : d}>{d}</option>)}
            </select>
          )}

          {(filterMonth !== 0 || filterDay !== 0) && (
            <button
              onClick={clearFilter}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Show all months"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── STATS HERO ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered Expenses</p>
            <p className="text-2xl font-black text-slate-900">{fmt(stats.total_expenses)}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered Entries</p>
            <p className="text-2xl font-black text-slate-900">{stats.entry_count}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Transaction</p>
            <p className="text-2xl font-black text-slate-900">{fmt(stats.average_transaction)}</p>
          </div>
        </div>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="bg-gradient-to-br from-white to-red-50/50 p-6 rounded-2xl shadow-md border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-800/5 rounded-bl-full pointer-events-none"></div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            {editingId ? 'Edit Expense Entry' : 'Record New Expense'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                <input 
                  type="text" required value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"
                  placeholder="e.g. Server Hosting, Office Supplies"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" step="0.01" required value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input 
                  type="date" required value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description (Optional)</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"
                placeholder="Add any relevant notes or details..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleCancel} className="text-slate-500 font-medium hover:bg-white/50 px-5 py-2.5 rounded-xl transition-all">
                Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-6 py-2.5 rounded-xl transition-all shadow-md font-bold">
                <Check size={16} />
                {editingId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
        <div className="p-5 border-b border-brand-100 flex items-center justify-between bg-brand-50/50">
          <h3 className="font-bold text-brand-900">Transaction History</h3>
          <span className="text-xs font-bold bg-white text-brand-700 px-3 py-1 rounded-full border border-brand-200 shadow-sm">
            {expenses.length} Entries
          </span>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-brand-400">Loading records...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-300 mb-4">
              <IndianRupee size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-900">No Expenses Found</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">No records match the selected date filter. Try changing the date or adding a new entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-5 py-4 w-[25%]">Category</th>
                  <th className="px-5 py-4 w-[35%]">Description</th>
                  <th className="px-5 py-4 w-[15%]">Date</th>
                  <th className="px-5 py-4 w-[15%] text-right">Amount</th>
                  <th className="px-5 py-4 w-[10%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...expenses].sort((a,b) => new Date(b.date) - new Date(a.date)).map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                          <ArrowDownRight size={16} />
                        </div>
                        <span className="font-bold text-slate-900 truncate block">{item.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[200px]">
                      {item.description || <span className="text-slate-300 italic">No description</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                      {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-black text-red-600">
                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
