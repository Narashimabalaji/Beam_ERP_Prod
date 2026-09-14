import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Landmark, Calculator, Info, CheckCircle2, IndianRupee, TrendingUp, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GST_RATES = [0, 5, 12, 18, 28];

export default function GSTFiling() {
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [gstRate, setGstRate] = useState(18); // Default 18%
  
  const [loading, setLoading] = useState(true);
  const [salesTotal, setSalesTotal] = useState(0);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch Invoices — these are the actual sales for GST (GSTR-1)
      const invRes = await axios.get(`http://localhost:8000/invoices`);
      const invoices = invRes.data || [];
      const filteredInvoices = invoices.filter(inv => {
        if (!inv.date) return false;
        const d = new Date(inv.date);
        return d.getFullYear() === filterYear && (d.getMonth() + 1) === filterMonth;
      });
      const invoiceSales = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      setInvoiceCount(filteredInvoices.length);

      // Fallback: also fetch Revenue entries
      const revRes = await axios.get(`http://localhost:8000/api/stats/revenue?year=${filterYear}&month=${filterMonth}`);
      const totalRev = revRes.data.stats.total_revenue || 0;   // ✅ correct field name

      // Use invoice total if available, else fall back to revenue entries
      setSalesTotal(invoiceSales > 0 ? invoiceSales : totalRev);

      // Fetch Expenses (Purchases) for Input Tax Credit
      const expRes = await axios.get(`http://localhost:8000/api/stats/expenses?year=${filterYear}&month=${filterMonth}`);
      const totalExp = expRes.data.stats.total_expenses || 0;  // ✅ correct field name
      setPurchasesTotal(totalExp);
    } catch (error) {
      console.error("Error fetching GST data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterYear, filterMonth]);

  const availableYears = Array.from({length: 5}, (_, i) => now.getFullYear() - 2 + i).sort((a,b) => b-a);
  const fmt = (v) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  // Calculations
  const outputTax = (salesTotal * gstRate) / 100;
  const inputTaxCredit = (purchasesTotal * gstRate) / 100;
  const netPayable = Math.max(0, outputTax - inputTaxCredit);
  const carriedForward = Math.max(0, inputTaxCredit - outputTax);

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center bg-gradient-to-r from-brand-900 to-brand-800 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-3 text-brand-200">
            <Landmark size={24} />
            <span className="font-bold tracking-widest uppercase text-xs">India Compliance</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">GST Filing Assistant</h2>
          <p className="text-brand-100/80 leading-relaxed text-sm">
            Filing GST doesn't have to be confusing. This assistant automatically estimates your tax liability based on your recorded sales and purchases, and gives you a simple checklist to follow on the official GST portal.
          </p>
        </div>
      </div>

      {/* ── SETTINGS BAR ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Period</label>
            <div className="flex gap-2">
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(Number(e.target.value))}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-50 text-brand-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select
                value={filterYear}
                onChange={e => setFilterYear(Number(e.target.value))}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-50 text-brand-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-200 hidden md:block mx-2"></div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Average GST Rate</label>
            <div className="flex gap-2">
              {GST_RATES.map(rate => (
                <button
                  key={rate}
                  onClick={() => setGstRate(rate)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    gstRate === rate 
                      ? 'bg-brand-600 text-white shadow-md' 
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 w-full md:w-auto">
          <AlertCircle size={14} className="shrink-0" />
          <span>This is an estimate based on your recorded data. Always verify with your CA.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── CALCULATOR ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
            <div className="p-5 border-b border-brand-100 flex items-center justify-between bg-brand-50/50">
              <h3 className="font-bold text-brand-900 flex items-center gap-2">
                <Calculator size={18} className="text-brand-600" />
                Live Tax Calculation
              </h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* OUTPUT TAX */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp size={64} className="text-emerald-600" />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-emerald-800 mb-1">Total Sales (Invoices)</p>
                  <p className="text-2xl font-black text-emerald-900 mb-4">{loading ? '...' : fmt(salesTotal)}</p>
                  {!loading && invoiceCount > 0 && (
                    <p className="text-xs text-emerald-700 mb-2">Based on <strong>{invoiceCount}</strong> invoice{invoiceCount !== 1 ? 's' : ''} this month</p>
                  )}
                  
                  <div className="bg-white/60 rounded-xl p-3 border border-emerald-200/50">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Output Tax Collected</p>
                    <p className="text-xl font-bold text-emerald-900">{loading ? '...' : fmt(outputTax)}</p>
                    <p className="text-[10px] text-emerald-700/70 mt-1 leading-tight">Tax you collected from your customers that belongs to the government.</p>
                  </div>
                </div>
              </div>

              {/* INPUT TAX */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CreditCard size={64} className="text-blue-600" />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-blue-800 mb-1">Total Purchases (Expenses)</p>
                  <p className="text-2xl font-black text-blue-900 mb-4">{loading ? '...' : fmt(purchasesTotal)}</p>
                  
                  <div className="bg-white/60 rounded-xl p-3 border border-blue-200/50">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Input Tax Credit (ITC)</p>
                    <p className="text-xl font-bold text-blue-900">{loading ? '...' : fmt(inputTaxCredit)}</p>
                    <p className="text-[10px] text-blue-700/70 mt-1 leading-tight">Tax you already paid to suppliers. This reduces your final tax bill.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* NET RESULT */}
            <div className="bg-slate-900 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Net GST Payable (Output - ITC)</p>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-white">{loading ? '...' : fmt(netPayable)}</span>
                  {carriedForward > 0 && (
                    <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-1 rounded border border-blue-500/30 ml-2">
                      + {fmt(carriedForward)} ITC Carried Forward
                    </span>
                  )}
                </div>
              </div>
              <a href="https://services.gst.gov.in/services/login" target="_blank" rel="noreferrer" className="shrink-0 bg-brand-500 hover:bg-brand-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(var(--brand-500),0.3)] flex items-center gap-2">
                Go to GST Portal <ChevronRight size={18} />
              </a>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-brand-100 flex gap-4 text-sm text-slate-600 shadow-sm leading-relaxed">
            <div className="shrink-0 text-brand-500 mt-0.5"><Info size={20} /></div>
            <div>
              <strong className="text-brand-900">How this works:</strong> We take your <strong>invoice totals</strong> for {MONTHS[filterMonth-1]} {filterYear} as your taxable sales, and assume an average {gstRate}% GST was collected (Output Tax). Your recorded expenses are used to calculate Input Tax Credit (ITC). When you pay the government, you only pay the difference!
            </div>
          </div>
        </div>

        {/* ── CHECKLIST ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
            <div className="p-5 border-b border-brand-100 bg-brand-50/50">
              <h3 className="font-bold text-brand-900">Filing Checklist</h3>
              <p className="text-xs text-slate-500 mt-1">For {MONTHS[filterMonth-1]} {filterYear}</p>
            </div>
            <div className="p-5 space-y-5">
              
              <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors">1</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">File GSTR-1</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">Upload your sales invoices. This tells the govt how much Output Tax you collected.</p>
                  <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Due: 11th of Next Month</span>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-200 ml-4 hidden md:block"></div>

              <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">2</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Check GSTR-2B</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">This is auto-generated by the govt. Verify that your suppliers uploaded their invoices so you can claim your Input Tax Credit.</p>
                  <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Auto-generated on 14th</span>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-200 ml-4 hidden md:block"></div>

              <div className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-brand-500 group-hover:text-white transition-colors">3</div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">File GSTR-3B</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-2">The final step. You confirm your totals and pay the Net GST Payable amount of <strong className="text-brand-600">{fmt(netPayable)}</strong>.</p>
                  <span className="inline-block bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Due: 20th of Next Month</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
