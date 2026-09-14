import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Package, Calendar, Pencil, Trash2, X, Check, IndianRupee, Hash, CheckCircle2, Clock, XCircle, CreditCard, Filter } from 'lucide-react';

const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total_orders: 0, pending_orders: 0, unpaid_orders: 0, total_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Filter state
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-12, 0=All
  const [filterDay, setFilterDay] = useState(0); // 1-31, 0=All
  
  const generateOrderNumber = () => {
    return `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const emptyForm = {
    order_number: generateOrderNumber(),
    customer_name: '',
    items_summary: '',
    total_amount: '',
    status: 'Pending',
    payment_status: 'Unpaid',
    order_date: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/stats/orders?year=${filterYear}`;
      if (filterMonth > 0) url += `&month=${filterMonth}`;
      if (filterDay > 0) url += `&day=${filterDay}`;
      
      const res = await axios.get(url);
      setOrders(res.data.records);
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
      order_number: formData.order_number,
      customer_name: formData.customer_name,
      items_summary: formData.items_summary,
      total_amount: parseFloat(formData.total_amount),
      status: formData.status,
      payment_status: formData.payment_status,
      order_date: new Date(formData.order_date).toISOString()
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/orders/${editingId}`, payload);
        setEditingId(null);
      } else {
        await axios.post('http://localhost:8000/orders', payload);
      }
      setFormData({ ...emptyForm, order_number: generateOrderNumber() });
      setShowForm(false);
      fetchAllData();
    } catch (error) {
      console.error("Error saving order", error);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      order_number: item.order_number,
      customer_name: item.customer_name,
      items_summary: item.items_summary || '',
      total_amount: String(item.total_amount),
      status: item.status,
      payment_status: item.payment_status,
      order_date: new Date(item.order_date).toISOString().split('T')[0]
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await axios.delete(`http://localhost:8000/orders/${id}`);
      fetchAllData();
    } catch (error) {
      console.error("Error deleting order", error);
    }
  };

  const handleCancel = () => {
    setFormData({ ...emptyForm, order_number: generateOrderNumber() });
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

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'Completed':
        return <span className="flex items-center gap-1 w-fit bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"><CheckCircle2 size={12}/> {status}</span>;
      case 'Processing':
        return <span className="flex items-center gap-1 w-fit bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"><Clock size={12} className="animate-spin-slow"/> {status}</span>;
      case 'Cancelled':
        return <span className="flex items-center gap-1 w-fit bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"><XCircle size={12}/> {status}</span>;
      default: // Pending
        return <span className="flex items-center gap-1 w-fit bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"><Clock size={12}/> {status}</span>;
    }
  };

  const PaymentBadge = ({ status }) => {
    if (status === 'Paid') {
      return <span className="flex items-center gap-1 w-fit bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><Check size={10}/> Paid</span>;
    }
    if (status === 'Refunded') {
      return <span className="flex items-center gap-1 w-fit bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Refunded</span>;
    }
    return <span className="flex items-center gap-1 w-fit bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Unpaid</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 tracking-tight">Order Management</h2>
          <p className="text-slate-500 text-sm mt-1">Universal order tracking for products and services</p>
        </div>
        <button 
          onClick={() => { showForm ? handleCancel() : setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-5 py-2.5 rounded-xl transition-all shadow-md"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Create Order'}
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
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered Orders</p>
            <p className="text-2xl font-black text-brand-900">{stats.total_orders}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-black text-brand-900">{stats.pending_orders}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unpaid Orders</p>
            <p className="text-2xl font-black text-brand-900">{stats.unpaid_orders}</p>
          </div>
        </div>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="bg-gradient-to-br from-white to-brand-50 p-6 rounded-2xl shadow-md border border-brand-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-800/5 rounded-bl-full pointer-events-none"></div>
          
          <h3 className="text-lg font-bold text-brand-900 mb-5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-700"></div>
            {editingId ? 'Edit Order' : 'Create New Order'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Order No.</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={14} className="text-slate-400" />
                  </div>
                  <input 
                    type="text" required value={formData.order_number}
                    onChange={e => setFormData({...formData, order_number: e.target.value})}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm font-semibold text-brand-900"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Customer Name</label>
                <input 
                  type="text" required value={formData.customer_name}
                  onChange={e => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"
                  placeholder="e.g. Acme Corp or John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Order Date</label>
                <input 
                  type="date" required value={formData.order_date}
                  onChange={e => setFormData({...formData, order_date: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Items / Description Summary</label>
                <input 
                  type="text" value={formData.items_summary}
                  onChange={e => setFormData({...formData, items_summary: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"
                  placeholder="e.g. 5x Widget A, 1x Standard Support Package"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="number" step="0.01" required value={formData.total_amount}
                    onChange={e => setFormData({...formData, total_amount: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-white/60 rounded-xl border border-brand-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Order Status</label>
                <div className="flex gap-3">
                  {['Pending', 'Processing', 'Completed', 'Cancelled'].map(s => (
                    <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="status" value={s} checked={formData.status === s}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                        className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Status</label>
                <div className="flex gap-3">
                  {['Unpaid', 'Paid', 'Refunded'].map(s => (
                    <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="payment_status" value={s} checked={formData.payment_status === s}
                        onChange={e => setFormData({...formData, payment_status: e.target.value})}
                        className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleCancel} className="text-slate-500 font-medium hover:bg-white/50 px-5 py-2.5 rounded-xl transition-all">
                Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-6 py-2.5 rounded-xl transition-all shadow-md font-bold">
                <Check size={16} />
                {editingId ? 'Update Order' : 'Save Order'}
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
            {orders.length} Entries
          </span>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-brand-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-300 mb-4">
              <Package size={32} />
            </div>
            <h4 className="text-lg font-bold text-brand-900">No Orders Found</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">No records match the selected date filter. Try changing the date or adding a new entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-brand-100 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-5 py-4 w-[15%]">Order ID</th>
                  <th className="px-5 py-4 w-[20%]">Customer</th>
                  <th className="px-5 py-4 w-[25%]">Summary</th>
                  <th className="px-5 py-4 w-[15%]">Status</th>
                  <th className="px-5 py-4 w-[15%] text-right">Amount</th>
                  <th className="px-5 py-4 w-[10%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...orders].sort((a,b) => new Date(b.order_date) - new Date(a.order_date)).map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-900 text-sm">{item.order_number}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Calendar size={10}/>{new Date(item.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700 truncate max-w-[150px]">
                      {item.customer_name}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 truncate max-w-[200px]" title={item.items_summary}>
                      {item.items_summary || <span className="text-slate-300 italic">No summary</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <StatusBadge status={item.status} />
                        <PaymentBadge status={item.payment_status} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-black text-brand-900">
                        {fmt(item.total_amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-2 text-brand-500 hover:bg-brand-50 hover:text-brand-800 rounded-lg transition-colors" title="Edit">
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
