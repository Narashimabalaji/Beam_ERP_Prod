import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, IndianRupee, Sparkles, Send, ArrowUpRight, ArrowDownRight, Wallet, Calendar, Filter, X } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Filter state
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-12, 0=All
  const [filterDay, setFilterDay] = useState(0); // 1-31, 0=All

  // Backend Data State
  const [stats, setStats] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentRevenue, setRecentRevenue] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  // Chatbot state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: 'Hello! I\'m your Beam ERP assistant. Ask me anything about your finances.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        let url = `http://localhost:8000/api/stats/dashboard?year=${filterYear}`;
        if (filterMonth > 0) url += `&month=${filterMonth}`;
        if (filterDay > 0) url += `&day=${filterDay}`;

        const res = await axios.get(url);
        setStats(res.data.stats);
        setChartData(res.data.chartData);
        setRecentRevenue(res.data.recentRevenue);
        setRecentExpenses(res.data.recentExpenses);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [filterYear, filterMonth, filterDay]);

  // Available Years Dropdown Options (e.g. 2020 to Next Year)
  const availableYears = Array.from({length: 10}, (_, i) => now.getFullYear() - 5 + i).sort((a,b) => b-a);

  // Days in selected month
  const daysInMonth = filterMonth > 0 ? new Date(filterYear, filterMonth, 0).getDate() : 31;
  const availableDays = ['All', ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  const profitPercent = stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1) : '0.0';

  // Pie data
  const pieData = [
    { name: 'Revenue', value: stats.totalRevenue || 1 },
    { name: 'Expenses', value: stats.totalExpenses || 1 }
  ];
  const PIE_COLORS = ['#8a3237', '#dbeafe'];

  // Helpers
  const fmt = (v) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatMessages(p => [...p, { role: 'user', content: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/chat', { prompt: msg });
      setChatMessages(p => [...p, { role: 'ai', content: res.data.response }]);
    } catch { setChatMessages(p => [...p, { role: 'ai', content: 'Connection error. Please try again.' }]); }
    finally { setChatLoading(false); }
  };

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

  // Filter label
  let filterLabel = `${filterYear} · All Months`;
  if (filterMonth > 0) {
    filterLabel = filterDay > 0 
      ? `${filterDay} ${MONTHS[filterMonth]} ${filterYear}`
      : `${MONTHS[filterMonth]} ${filterYear}`;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((e, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: e.color }}></div>
              <span className="text-slate-500">{e.name}:</span>
              <span className="font-semibold text-slate-900">{fmt(e.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* ── BRANDING HEADER ── */}
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-brand-100">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <img src="/src/assets/logo.png" alt="Beam Signage Logo" className="w-full h-full object-contain p-1" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-brand-900 tracking-tight">Beam Signage & Branding Creations</h1>
          <p className="text-sm font-medium text-slate-500">Business Management Dashboard</p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-brand-700" />
          <span className="text-sm font-bold text-brand-900">{filterLabel}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Buttons */}
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

          {/* Year Selector */}
          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Month Selector */}
          <select
            value={filterMonth}
            onChange={handleMonthChange}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>

          {/* Day Selector */}
          {filterMonth > 0 && (
            <select
              value={filterDay}
              onChange={e => setFilterDay(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 text-brand-800 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {availableDays.map((d, i) => <option key={i} value={d === 'All' ? 0 : d}>{d}</option>)}
            </select>
          )}

          {/* Clear Filter */}
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

      {/* ── ROW 1: THREE HERO STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-brand-950 text-white p-6 rounded-2xl shadow-lg">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-white/10 rounded-lg"><TrendingUp size={18} /></div>
              <span className="text-sm font-medium text-brand-200">Total Revenue</span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{fmt(stats.totalRevenue)}</p>
            <div className="flex items-center gap-1 mt-2 text-green-300 text-xs font-semibold">
              <ArrowUpRight size={14} /> Income from all sources
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="relative overflow-hidden bg-white border border-brand-100 p-6 rounded-2xl shadow-sm">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-50 rounded-full"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={18} /></div>
              <span className="text-sm font-medium text-slate-500">Total Expenses</span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{fmt(stats.totalExpenses)}</p>
            <div className="flex items-center gap-1 mt-2 text-red-500 text-xs font-semibold">
              <ArrowDownRight size={14} /> Costs across categories
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="relative overflow-hidden bg-white border border-brand-100 p-6 rounded-2xl shadow-sm">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-50 rounded-full"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg ${stats.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <Wallet size={18} />
              </div>
              <span className="text-sm font-medium text-slate-500">Net Profit</span>
            </div>
            <p className={`text-3xl font-extrabold tracking-tight ${stats.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {fmt(stats.netProfit)}
            </p>
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {stats.netProfit >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {profitPercent}% margin
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: CHART + CHATBOT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-brand-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-bold text-brand-900">Revenue vs Expenses</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {filterMonth === 0
                  ? `Monthly breakdown for ${filterYear} · Future estimates included`
                  : `Daily totals for ${MONTHS[filterMonth]} ${filterYear}`
                }
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-[380px] mt-4">
            {chartData.length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-brand-300">
                <IndianRupee size={40} />
                <p className="mt-3 text-sm text-brand-400 font-medium">No data for this period</p>
                <p className="text-xs text-slate-400 mt-1">Try a different month or year filter</p>
              </div>
            ) : loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-700 animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={50} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(138,50,55,0.04)' }} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ top: -10, right: 0, fontSize: '12px' }} iconType="circle" iconSize={8} />
                  <Bar dataKey="Expenses" fill="#dbeafe" barSize={14} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Revenue" fill="#8a3237" barSize={14} radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="Net Profit" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Beam Chatbot */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 flex flex-col h-[520px] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-brand-100 bg-gradient-to-r from-brand-800 to-brand-900 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm"><Sparkles size={18} /></div>
              <div>
                <h3 className="font-bold text-base leading-tight">Beam Chatbot</h3>
                <p className="text-[10px] text-brand-200 font-medium">AI-Powered ERP Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-[10px] font-bold">Online</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%] shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-800 text-white rounded-br-md'
                    : 'bg-brand-50 text-brand-900 border border-brand-100 rounded-bl-md'
                }`}>{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-brand-50 border border-brand-100 rounded-2xl rounded-bl-md flex gap-1.5">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-brand-100 bg-white">
            <div className="flex items-center gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Ask Beam anything..."
                className="flex-1 bg-brand-50 border border-brand-100 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
              />
              <button type="submit" disabled={!chatInput.trim() || chatLoading}
                className="p-2.5 bg-brand-800 text-white rounded-xl hover:bg-brand-900 disabled:opacity-40 transition-colors shadow-sm">
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── ROW 3: RECENT TRANSACTIONS + PIE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-brand-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-700"></div>
              Revenue Entries
            </h3>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {filterMonth === 0 ? filterYear : `${MONTHS[filterMonth]} ${filterYear}`}
            </span>
          </div>
          {recentRevenue.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No revenue in this period</p>
          ) : (
            <div className="space-y-3">
              {recentRevenue.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ArrowUpRight size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.source}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar size={10}/>{fmtDate(r.date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">+{fmt(r.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-brand-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Expense Entries
            </h3>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {filterMonth === 0 ? filterYear : `${MONTHS[filterMonth]} ${filterYear}`}
            </span>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No expenses in this period</p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                      <ArrowDownRight size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{e.category}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar size={10}/>{fmtDate(e.date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-600">-{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-brand-900 mb-3 self-start flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Revenue vs Expenses Split
          </h3>
          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-sm bg-brand-800"></div>
              <span className="text-slate-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-sm bg-blue-100"></div>
              <span className="text-slate-600">Expenses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
