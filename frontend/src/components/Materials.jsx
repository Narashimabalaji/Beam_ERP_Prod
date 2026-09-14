import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Box, Calendar, Pencil, Trash2, X, Check, IndianRupee, Tags, Filter, ShoppingCart } from 'lucide-react';

const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState({ total_entries: 0, total_cost: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  
  // Filter state
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-12, 0=All
  const [filterDay, setFilterDay] = useState(0); // 1-31, 0=All

  const emptyForm = {
    name: '',
    category: '',
    quantity_unit: '',
    bought_price: '',
    selling_price: '',
    purchase_date: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/stats/materials?year=${filterYear}`;
      if (filterMonth > 0) url += `&month=${filterMonth}`;
      if (filterDay > 0) url += `&day=${filterDay}`;
      
      const res = await axios.get(url);
      setMaterials(res.data.records);
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
      name: formData.name,
      category: formData.category,
      quantity_unit: formData.quantity_unit,
      bought_price: formData.bought_price ? parseFloat(formData.bought_price) : null,
      selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
      purchase_date: new Date(formData.purchase_date).toISOString()
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/materials/${editingId}`, payload);
        setEditingId(null);
      } else {
        await axios.post('http://localhost:8000/materials', payload);
      }
      setFormData(emptyForm);
      setShowForm(false);
      fetchAllData();
    } catch (error) {
      console.error("Error saving material", error);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      category: item.category,
      quantity_unit: item.quantity_unit,
      bought_price: item.bought_price !== null ? String(item.bought_price) : '',
      selling_price: item.selling_price !== null && item.selling_price !== undefined ? String(item.selling_price) : '',
      purchase_date: new Date(item.purchase_date).toISOString().split('T')[0]
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(`http://localhost:8000/materials/${id}`);
      fetchAllData();
    } catch (error) {
      console.error("Error deleting material", error);
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

  const [filterCategory, setFilterCategory] = useState('All');
  const uniqueCategories = [...new Set(materials.map(m => m.category).filter(Boolean))];
  const allCategories = [...new Set([...uniqueCategories, ...customCategories])];
  
  const displayedMaterials = filterCategory === 'All' 
    ? materials 
    : materials.filter(m => m.category === filterCategory);

  const displayedCost = displayedMaterials.reduce((acc, m) => acc + (m.bought_price || 0), 0);

  const setCurrentMonth = () => {
    setFilterYear(now.getFullYear());
    setFilterMonth(now.getMonth() + 1);
    setFilterDay(0);
    setFilterCategory('All');
  };

  const setToday = () => {
    setFilterYear(now.getFullYear());
    setFilterMonth(now.getMonth() + 1);
    setFilterDay(now.getDate());
    setFilterCategory('All');
  };

  const clearFilter = () => {
    setFilterYear(now.getFullYear());
    setFilterMonth(0);
    setFilterDay(0);
    setFilterCategory('All');
  };

  const handleMonthChange = (e) => {
    const val = Number(e.target.value);
    setFilterMonth(val);
    if (val === 0) setFilterDay(0);
  };

  const isCurrentMonth = filterYear === now.getFullYear() && filterMonth === now.getMonth() + 1 && filterDay === 0 && filterCategory === 'All';
  const isToday = filterYear === now.getFullYear() && filterMonth === now.getMonth() + 1 && filterDay === now.getDate() && filterCategory === 'All';

  let filterLabel = `${filterYear} · All Months`;
  if (filterMonth > 0) {
    filterLabel = filterDay > 0 
      ? `${filterDay} ${MONTHS[filterMonth]} ${filterYear}`
      : `${MONTHS[filterMonth]} ${filterYear}`;
  }
  if (filterCategory !== 'All') {
    filterLabel += ` · ${filterCategory}`;
  }

  const fmt = (v) => v !== null && v !== undefined ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-';

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 tracking-tight">Materials & Purchases</h2>
          <p className="text-slate-500 text-sm mt-1">Track inventory, physical goods, and external services</p>
        </div>
        <button 
          onClick={() => { showForm ? handleCancel() : setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-5 py-2.5 rounded-xl transition-all shadow-md"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add Item'}
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
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

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

          {(filterMonth !== 0 || filterDay !== 0 || filterCategory !== 'All') && (
            <button
              onClick={clearFilter}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Clear all filters"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── STATS HERO ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Box size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered Items</p>
            <p className="text-2xl font-black text-brand-900">{displayedMaterials.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered Cost</p>
            <p className="text-2xl font-black text-brand-900">{fmt(displayedCost)}</p>
          </div>
        </div>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="bg-gradient-to-br from-white to-blue-50/50 p-6 rounded-2xl shadow-md border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-800/5 rounded-bl-full pointer-events-none"></div>
          
          <h3 className="text-lg font-bold text-brand-900 mb-5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            {editingId ? 'Edit Item' : 'Add New Item / Purchase'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Name</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-semibold"
                  placeholder="e.g. Raw Steel, Printer Ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tags size={14} className="text-slate-400" />
                    </div>
                    <select 
                      required value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm appearance-none"
                    >
                      <option value="" disabled>Select category</option>
                      {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => {
                    const newCat = window.prompt("Enter new category name:");
                    if (newCat && newCat.trim() !== "") {
                      setCustomCategories(prev => [...prev, newCat.trim()]);
                      setFormData(prev => ({...prev, category: newCat.trim()}));
                    }
                  }} className="bg-brand-100 hover:bg-brand-200 text-brand-700 px-3 rounded-xl transition-colors flex flex-col items-center justify-center border border-brand-200" title="Add New Category">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantity / Unit</label>
                <input 
                  type="text" required value={formData.quantity_unit}
                  onChange={e => setFormData({...formData, quantity_unit: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                  placeholder="e.g. 50 kg, 12 boxes, 1 Year"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bought Price (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" step="0.01" value={formData.bought_price}
                    onChange={e => setFormData({...formData, bought_price: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Selling Price (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" step="0.01" value={formData.selling_price}
                    onChange={e => setFormData({...formData, selling_price: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-bold text-green-700"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Purchase Date</label>
                <input 
                  type="date" required value={formData.purchase_date}
                  onChange={e => setFormData({...formData, purchase_date: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleCancel} className="text-slate-500 font-medium hover:bg-white/50 px-5 py-2.5 rounded-xl transition-all">
                Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-6 py-2.5 rounded-xl transition-all shadow-md font-bold">
                <Check size={16} />
                {editingId ? 'Update Item' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
        <div className="p-5 border-b border-brand-100 flex items-center justify-between bg-brand-50/50">
          <h3 className="font-bold text-brand-900">Inventory & Purchases</h3>
          <span className="text-xs font-bold bg-white text-brand-700 px-3 py-1 rounded-full border border-brand-200 shadow-sm">
            {displayedMaterials.length} Entries
          </span>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-brand-400">Loading materials...</div>
        ) : displayedMaterials.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-300 mb-4">
              <Box size={32} />
            </div>
            <h4 className="text-lg font-bold text-brand-900">No Items Found</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">No records match the selected filters. Try changing them or adding a new item.</p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-6 bg-slate-50/50">
            {Object.entries(
              displayedMaterials.reduce((acc, item) => {
                const cat = item.category || 'Uncategorized';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
              }, {})
            ).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
              <div key={category} className="border border-brand-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gradient-to-r from-brand-50 to-white px-5 py-3 border-b border-brand-100 flex justify-between items-center">
                  <h4 className="font-bold text-brand-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Tags size={16} className="text-brand-600" />
                    {category}
                  </h4>
                  <span className="text-xs font-bold bg-white text-brand-700 px-2.5 py-1 rounded-md border border-brand-200 shadow-sm">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-brand-200">
                    <thead>
                      <tr className="bg-brand-50 border-b border-brand-200 text-slate-500 text-[11px] uppercase tracking-wider font-black">
                        <th className="px-3 py-2 border-r border-brand-200 w-[25%]">Item Name</th>
                        <th className="px-3 py-2 border-r border-brand-200 w-[15%]">Quantity</th>
                        <th className="px-3 py-2 border-r border-brand-200 w-[15%]">Purchase Date</th>
                        <th className="px-3 py-2 border-r border-brand-200 w-[12%] text-right bg-rose-50/50">Bought Price</th>
                        <th className="px-3 py-2 border-r border-brand-200 w-[12%] text-right bg-blue-50/50">Selling Price</th>
                        <th className="px-3 py-2 border-r border-brand-200 w-[12%] text-right bg-emerald-50/50">Profit</th>
                        <th className="px-3 py-2 w-[9%] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...items].sort((a,b) => new Date(b.purchase_date) - new Date(a.purchase_date)).map((item) => {
                        const bought = item.bought_price || 0;
                        const selling = item.selling_price || 0;
                        const profit = selling - bought;
                        return (
                        <tr key={item.id} className="border-b border-brand-100 hover:bg-brand-50 transition-colors group">
                          <td className="px-3 py-1.5 border-r border-brand-100">
                            <span className="font-bold text-brand-900 text-[13px] block truncate">{item.name}</span>
                          </td>
                          <td className="px-3 py-1.5 border-r border-brand-100 text-[13px] text-slate-600 truncate">
                            {item.quantity_unit}
                          </td>
                          <td className="px-3 py-1.5 border-r border-brand-100">
                            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">{new Date(item.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </td>
                          <td className="px-3 py-1.5 border-r border-brand-100 text-right bg-rose-50/20">
                            <span className="font-bold text-[13px] text-rose-700">
                              {item.bought_price ? fmt(item.bought_price) : '-'}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 border-r border-brand-100 text-right bg-blue-50/20">
                            <span className="font-bold text-[13px] text-blue-700">
                              {item.selling_price ? fmt(item.selling_price) : '-'}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 border-r border-brand-100 text-right bg-emerald-50/20">
                            <span className={`font-black text-[13px] ${profit > 0 ? 'text-emerald-600' : profit < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {item.selling_price && item.bought_price ? (profit > 0 ? '+' : '') + fmt(profit) : '-'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(item)} className="p-1 text-brand-500 hover:bg-brand-100 rounded-md transition-colors" title="Edit">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
