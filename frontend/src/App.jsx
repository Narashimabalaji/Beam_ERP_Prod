import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Revenue from './components/Revenue';
import Expenses from './components/Expenses';
import Orders from './components/Orders';
import Materials from './components/Materials';
import Invoices from './components/Invoices';
import Quotations from './components/Quotations';
import GST from './components/GST';
import Customers from './components/Customers';
import { LayoutDashboard, FileText, Receipt, CreditCard, TrendingUp, ChevronRight, Package, Box, Landmark, Users, Download, RefreshCw } from 'lucide-react';
import { logoBase64 } from './assets/logoBase64.js';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // ── Auto-update state (only active when running inside Electron) ──────────
  const [updateVersion, setUpdateVersion] = useState(null);   // version string when available
  const [updateProgress, setUpdateProgress] = useState(null); // 0-100 while downloading
  const [updateReady, setUpdateReady] = useState(false);      // true = downloaded, ready to install

  useEffect(() => {
    if (!window.electronAPI) return; // Not in Electron (dev browser) — skip
    window.electronAPI.onUpdateAvailable(version => {
      setUpdateVersion(version);
    });
    window.electronAPI.onUpdateProgress(pct => {
      setUpdateProgress(pct);
    });
    window.electronAPI.onUpdateDownloaded(version => {
      setUpdateVersion(version);
      setUpdateReady(true);
      setUpdateProgress(null);
    });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'orders': return <Orders />;
      case 'materials': return <Materials />;
      case 'revenue': return <Revenue />;
      case 'expenses': return <Expenses />;
      case 'invoices': return <Invoices />;
      case 'quotations': return <Quotations />;
      case 'gst': return <GST />;
      case 'customers': return <Customers />;
      default: return <Dashboard />;
    }
  };

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'materials', label: 'Materials', icon: Box },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'gst', label: 'GST Filing', icon: Landmark },
  ];

  const docsNav = [
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'quotations', label: 'Quotations', icon: Receipt },
  ];

  const NavButton = ({ item }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium text-[14px] ${
          isActive
            ? 'bg-white/15 text-white shadow-inner shadow-white/5'
            : 'text-brand-300 hover:bg-white/8 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon size={18} className={isActive ? 'text-white' : 'text-brand-400'} />
          {item.label}
        </div>
        {isActive && <ChevronRight size={14} className="text-brand-300" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f5f3] flex flex-col font-sans">

      {/* ── Update Banner ─────────────────────────────────────────────────── */}
      {updateVersion && (
        <div className={`flex items-center justify-between px-6 py-2.5 text-sm font-semibold z-50 ${
          updateReady
            ? 'bg-emerald-600 text-white'
            : 'bg-brand-900 text-brand-100'
        }`}>
          <div className="flex items-center gap-3">
            {updateReady ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Download size={16} className="animate-bounce" />
            )}
            {updateReady
              ? `Version ${updateVersion} downloaded and ready to install.`
              : updateProgress !== null
                ? `Downloading update v${updateVersion}... ${updateProgress}%`
                : `Update v${updateVersion} available — downloading in background...`
            }
          </div>
          {updateReady && (
            <button
              onClick={() => window.electronAPI.installUpdate()}
              className="bg-white text-emerald-700 font-bold px-4 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-xs"
            >
              Restart &amp; Update Now
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 flex flex-col shadow-xl text-white">
        {/* Logo */}
        <div className="h-[72px] flex items-center px-5 border-b border-white/10 gap-3">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-md overflow-hidden p-1">
            <img src={logoBase64} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              Beam<span className="text-brand-300 font-normal">ERP</span>
            </h1>
            <p className="text-[9px] text-brand-400 tracking-widest uppercase leading-none">Enterprise Suite</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 pt-6 pb-4 flex flex-col">
          <p className="px-4 text-[10px] font-bold text-brand-500 tracking-widest uppercase mb-2">Overview</p>
          <div className="space-y-1">
            {mainNav.map(item => <NavButton key={item.id} item={item} />)}
          </div>

          <div className="my-4 mx-4 border-t border-white/10"></div>

          <p className="px-4 text-[10px] font-bold text-brand-500 tracking-widest uppercase mb-2">Documents</p>
          <div className="space-y-1">
            {docsNav.map(item => <NavButton key={item.id} item={item} />)}
          </div>

          <div className="flex-1"></div>

          {/* User badge */}
          <div className="mx-1 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-xs">B</div>
              <div>
                <p className="text-sm font-medium text-white leading-tight">Beam Admin</p>
                <p className="text-[10px] text-brand-400">admin@beamerp.in</p>
              </div>
            </div>
          </div>
        </nav>

        <div className="px-5 py-3 border-t border-white/10 text-[11px] text-brand-500 flex justify-between">
          <span>v2.0.0</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>Online</span>
        </div>
      </aside>

      {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;

