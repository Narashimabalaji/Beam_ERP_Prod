import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, X, Plus, Download, Trash2, Eye, RefreshCcw, CheckCircle2, FileText, IndianRupee, Save } from 'lucide-react';
import { generateInvoicePDF } from '../utils/generatePDF.js';

const emptyItem = { title: '', description: '', hsn: '996812', tax: '18', qty: '1', rate: '' };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeQuote() {
  let savedSettings = {};
  try {
    const saved = localStorage.getItem('beam-erp-quote');
    if (saved) savedSettings = JSON.parse(saved);
  } catch (e) {}

  return {
    invoiceNo: `QT-${Date.now().toString().slice(-6)}`,
    date: today(),
    dueDate: '',
    placeOfSupply: '33-TAMIL NADU',
    fromName: savedSettings.fromName || 'Beam Signage & Branding Creations',
    fromEmail: savedSettings.fromEmail || 'info@beamsignage.com',
    fromPhone: savedSettings.fromPhone || '+91 9876543210',
    fromGstin: savedSettings.fromGstin || '33AYJPV9633K1ZP',
    fromAddress: savedSettings.fromAddress || '4, Balaji illam , Senthamizh nagar, Chennai\nChennai, TAMIL NADU, 600107',
    fromLogo: savedSettings.fromLogo || '',
    fromSignature: savedSettings.fromSignature || '',
    clientName: '',
    email: '',
    gstin: '',
    pan: '',
    billingAddress: '',
    phone: '',
    items: [{ ...emptyItem }],
    gstPercent: savedSettings.gstPercent || '18',
    termsConditions: savedSettings.termsConditions || '1. Goods once sold will not be taken back.\n2. Quotation valid for 15 days.',
  };
}

export default function Quotations() {
  const [dbMaterials, setDbMaterials] = useState([]);
  const [historyDocs, setHistoryDocs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:8000/materials')
      .then(res => setDbMaterials(res.data))
      .catch(console.error);
    
    Promise.all([
      axios.get('http://localhost:8000/invoices'),
      axios.get('http://localhost:8000/quotations')
    ]).then(([invRes, quoRes]) => {
      const allDocs = [
        ...invRes.data.map(d => ({...d, docType: 'Invoice'})),
        ...quoRes.data.map(d => ({...d, docType: 'Quotation'}))
      ];
      setHistoryDocs(allDocs);
    }).catch(console.error);
  }, []);

  const [quote, setQuote] = useState(() => {
    const saved = localStorage.getItem('beam-erp-quote');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return makeQuote(); }
    }
    return makeQuote();
  });
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('beam-erp-quote', JSON.stringify(quote));
    }, 400);
    return () => clearTimeout(timer);
  }, [quote]);

  const subtotal = useMemo(
    () => quote.items.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.rate || 0)), 0),
    [quote.items],
  );
  const gst = useMemo(
    () => quote.items.reduce((sum, item) => {
      const amount = Number(item.qty || 1) * Number(item.rate || 0);
      const taxRate = parseFloat(item.tax) || 0;
      return sum + (amount * taxRate / 100);
    }, 0),
    [quote.items]
  );
  const total = subtotal + gst;

  const update = (e) => {
    let { name, value } = e.target;
    setQuote((cur) => ({ ...cur, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    setQuote((cur) => {
      const newItems = [...cur.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-fill rate from materials if title matches
      if (field === 'title') {
        const material = dbMaterials.find(m => m.name === value);
        if (material) {
          if (material.selling_price) newItems[index].rate = String(material.selling_price);
          if (material.quantity_unit) newItems[index].per = material.quantity_unit;
        }
      }
      
      return { ...cur, items: newItems };
    });
  };

  const addItem = () => setQuote((cur) => ({ ...cur, items: [...cur.items, { ...emptyItem }] }));

  const removeItem = (index) => {
    if (quote.items.length === 1) return;
    setQuote((cur) => ({ ...cur, items: cur.items.filter((_, i) => i !== index) }));
  };

  const clearItems = () => {
    if (window.confirm('Clear all items?')) {
      setQuote((cur) => ({ ...cur, items: [{ ...emptyItem }] }));
    }
  };

  const resetForm = () => {
    if (window.confirm('Reset entire quotation form?')) {
      setQuote(makeQuote());
      setPreviewUrl(null);
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    try {
      const finalQuote = { ...quote, subtotal, gst, total };
      const url = await generateInvoicePDF(finalQuote, 'blob', 'QUOTATION');
      setPreviewUrl(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF.');
    }
  };

  const handleDownload = async () => {
    try {
      const finalQuote = { ...quote, subtotal, gst, total };
      await generateInvoicePDF(finalQuote, 'save', 'QUOTATION');
    } catch (err) {
      alert('Failed to download PDF.');
    }
  };

  const handleSaveDB = async () => {
    setIsSaving(true);
    try {
      const finalQuote = { ...quote, subtotal, gst, total };
      await axios.post('http://localhost:8000/quotations', {
        invoice_no: quote.invoiceNo,
        client_name: quote.clientName || 'Unknown Client',
        total_amount: total,
        status: 'Saved',
        data: JSON.stringify(finalQuote)
      });
      alert('Quotation successfully saved to database!');
    } catch (err) {
      console.error(err);
      alert('Failed to save quotation to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 tracking-tight">Quotation Generator</h2>
          <p className="text-slate-500 text-sm mt-1">Create estimates for your clients instantly</p>
        </div>
      </div>

      {previewUrl ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-brand-100 shadow-sm">
            <button onClick={() => setPreviewUrl(null)} className="flex items-center gap-2 text-slate-500 hover:text-brand-700 font-bold transition-colors">
              <ArrowLeft size={18} /> Edit Quotation
            </button>
            <div className="flex gap-3">
              <button onClick={handleSaveDB} disabled={isSaving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl shadow-md font-bold transition-colors">
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save to DB'}
              </button>
              <button onClick={() => window.open(previewUrl, '_blank')} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-colors">
                <Eye size={18} /> Open in Browser
              </button>
              <button onClick={handleDownload} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl shadow-md font-bold transition-colors">
                <Download size={18} /> Download PDF
              </button>
            </div>
          </div>
          <iframe src={previewUrl} title="Quotation Preview" className="w-full h-[80vh] rounded-2xl border border-brand-200 shadow-sm" />
        </div>
      ) : (
        <form onSubmit={handlePreview} className="space-y-6">
          
          {/* FROM DETAILS */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
            <div className="bg-brand-50/50 p-4 border-b border-brand-100 flex justify-between items-center">
              <h3 className="font-bold text-brand-900 flex items-center gap-2">From Details (Your Company)</h3>
              <button type="button" onClick={() => alert('Company Details Saved!')} className="flex items-center gap-1.5 text-xs bg-brand-100 text-brand-700 hover:bg-brand-200 px-3 py-1.5 rounded-lg font-bold transition-colors">
                <Save size={14} /> Save Details
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Company Name</label>
                <input name="fromName" value={quote.fromName} onChange={update} maxLength={50} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 font-bold" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">GSTIN</label>
                <input name="fromGstin" value={quote.fromGstin} onChange={update} maxLength={15} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Address</label>
                <textarea name="fromAddress" value={quote.fromAddress} onChange={update} rows={2} maxLength={150} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email</label>
                <input name="fromEmail" value={quote.fromEmail} onChange={update} maxLength={50} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number</label>
                <input name="fromPhone" value={quote.fromPhone} onChange={update} maxLength={15} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Company Logo</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*, .png, .jpg, .jpeg, image/jpeg, image/png" onClick={(e) => { e.target.value = null; }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        update({ target: { name: 'fromLogo', value: reader.result } });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 text-sm" />
                  {quote.fromLogo && (
                    <div className="relative">
                      <img src={quote.fromLogo} alt="Logo preview" className="h-10 w-auto object-contain rounded border border-slate-200" />
                      <button type="button" onClick={() => update({ target: { name: 'fromLogo', value: '' } })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Authorized Signature</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*, .png, .jpg, .jpeg, image/jpeg, image/png" onClick={(e) => { e.target.value = null; }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        update({ target: { name: 'fromSignature', value: reader.result } });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 text-sm" />
                  {quote.fromSignature && (
                    <div className="relative">
                      <img src={quote.fromSignature} alt="Signature preview" className="h-10 w-auto object-contain rounded border border-slate-200" />
                      <button type="button" onClick={() => update({ target: { name: 'fromSignature', value: '' } })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* QUOTE DETAILS */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
            <div className="bg-brand-50/50 p-4 border-b border-brand-100">
              <h3 className="font-bold text-brand-900 flex items-center gap-2"><FileText size={18} className="text-brand-600"/> Document Details</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Quote #</label>
                <input required name="invoiceNo" value={quote.invoiceNo} onChange={update} maxLength={20} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
                <input required type="date" name="date" value={quote.date} onChange={update} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Valid Until</label>
                <input type="date" name="dueDate" value={quote.dueDate} onChange={update} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Place of Supply</label>
                <input name="placeOfSupply" value={quote.placeOfSupply} onChange={update} maxLength={30} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </div>

          {/* CUSTOMER DETAILS */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
            <div className="bg-brand-50/50 p-4 border-b border-brand-100">
              <h3 className="font-bold text-brand-900">Customer Details</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Client Name</label>
                  {quote.clientName && (
                    <button type="button" onClick={() => setShowHistory(true)} className="text-xs text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1">
                      <Eye size={12}/> View History
                    </button>
                  )}
                </div>
                <input required name="clientName" value={quote.clientName} onChange={update} maxLength={50} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone</label>
                <input name="phone" value={quote.phone} onChange={update} maxLength={15} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                <input name="email" type="email" value={quote.email} onChange={update} maxLength={50} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">GSTIN</label>
                <input name="gstin" value={quote.gstin} onChange={update} maxLength={15} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">PAN</label>
                <input name="pan" value={quote.pan} onChange={update} maxLength={10} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Billing Address</label>
                <textarea name="billingAddress" value={quote.billingAddress} onChange={update} rows={2} maxLength={150} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
            <div className="bg-brand-50/50 p-4 border-b border-brand-100 flex justify-between items-center">
              <h3 className="font-bold text-brand-900">Line Items</h3>
              <button type="button" onClick={clearItems} className="text-xs text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded">Clear Items</button>
            </div>
            <div className="p-5 space-y-6">
              {quote.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-brand-100 bg-slate-50/50 rounded-xl relative">
                  
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Title</label>
                    <input list={`quote-materials-list-${index}`} required value={item.title} onChange={(e) => updateItem(index, 'title', e.target.value)} maxLength={100} className="w-full px-3 py-2 rounded-lg border border-brand-200 text-slate-900 bg-white font-bold text-brand-900" />
                    <datalist id={`quote-materials-list-${index}`}>
                      {dbMaterials.map(m => <option key={m.id} value={m.name} />)}
                    </datalist>
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                    <textarea value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-brand-200 text-slate-900 bg-white text-sm" />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">HSN/SAC</label>
                    <input value={item.hsn} onChange={(e) => updateItem(index, 'hsn', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-brand-200 text-slate-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tax (%)</label>
                    <input value={item.tax} onChange={(e) => updateItem(index, 'tax', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-brand-200 text-slate-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                    <input required value={item.qty} onChange={(e) => updateItem(index, 'qty', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-brand-200 text-slate-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rate (₹)</label>
                    <input required value={item.rate} onChange={(e) => updateItem(index, 'rate', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-brand-200 text-slate-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Per</label>
                    <input value={item.per} onChange={(e) => updateItem(index, 'per', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-brand-200 text-slate-900 bg-white" />
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total</label>
                    <div className="px-3 py-2 bg-brand-100 text-brand-900 font-black rounded-lg text-center">
                      ₹{(Number(item.qty || 1) * Number(item.rate || 0)).toFixed(2)}
                    </div>
                  </div>

                  <button type="button" onClick={() => removeItem(index)} disabled={quote.items.length === 1} className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-50 disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              <button type="button" onClick={addItem} className="w-full border-2 border-dashed border-brand-300 text-brand-600 font-bold py-3 rounded-xl hover:bg-brand-50 hover:border-brand-400 transition-colors flex items-center justify-center gap-2">
                <Plus size={18} /> Add Another Item
              </button>
            </div>
          </div>

          {/* TERMS & CONDITIONS */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden p-5">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Terms & Conditions</label>
            <textarea name="termsConditions" value={quote.termsConditions} onChange={update} rows={3} maxLength={500} className="w-full px-4 py-2 rounded-xl border border-brand-200 text-slate-900 bg-white focus:ring-2 focus:ring-brand-500" placeholder="Enter your terms and conditions here..." />
          </div>

          {/* TOTALS & ACTIONS */}
          <div className="bg-slate-900 rounded-2xl shadow-xl p-6 text-white grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <div className="flex gap-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Global GST %</label>
                <input value={quote.gstPercent} onChange={(e) => setQuote(cur => ({...cur, gstPercent: e.target.value}))} className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between w-40 text-sm text-slate-400"><span>Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between w-40 text-sm text-slate-400"><span>Tax Amount:</span> <span>₹{gst.toFixed(2)}</span></div>
                <div className="w-full h-px bg-slate-700 my-1"></div>
                <div className="flex justify-between w-40 text-lg font-black text-brand-300"><span>Total:</span> <span>₹{total.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button type="button" onClick={resetForm} className="px-5 py-3 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2">
                <RefreshCcw size={18} /> Reset
              </button>
              <button type="submit" className="px-6 py-3 rounded-xl font-bold bg-brand-500 hover:bg-brand-400 text-white shadow-[0_0_20px_rgba(var(--brand-500),0.4)] transition-all flex items-center gap-2">
                <Eye size={18} /> Preview PDF
              </button>
            </div>

          </div>
        </form>
      )}


      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-brand-900">Document History for: {quote.clientName}</h3>
              <button onClick={() => setShowHistory(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={20}/></button>
            </div>
            <div className="p-4 overflow-y-auto">
              {historyDocs.filter(d => (d.client_name || '').toLowerCase() === (quote.clientName || '').toLowerCase()).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No past documents found for this client.</div>
              ) : (
                <div className="space-y-3">
                  {historyDocs.filter(d => (d.client_name || '').toLowerCase() === (quote.clientName || '').toLowerCase())
                    .sort((a,b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
                    .map(doc => (
                    <div key={doc.id + doc.docType} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:shadow-sm transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.docType === 'Invoice' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{doc.docType}</span>
                          <span className="font-bold text-sm text-slate-800">{doc.invoice_no || 'Draft'}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{new Date(doc.date || doc.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-800">₹{Number(doc.total_amount || 0).toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{doc.status || 'Saved'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
