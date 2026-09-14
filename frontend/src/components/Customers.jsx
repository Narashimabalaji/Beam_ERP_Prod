import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, Receipt, Calendar, ArrowLeft, Eye, Download } from 'lucide-react';
import { generateInvoicePDF } from '../utils/generatePDF.js';

export default function Customers() {
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, quoRes] = await Promise.all([
        axios.get('http://localhost:8000/invoices'),
        axios.get('http://localhost:8000/quotations')
      ]);
      setInvoices(invRes.data);
      setQuotations(quoRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clientsMap = {};
  invoices.forEach(inv => {
    const name = inv.client_name || 'Unknown Client';
    if (!clientsMap[name]) clientsMap[name] = { name, invoices: [], quotations: [], totalSpent: 0 };
    clientsMap[name].invoices.push(inv);
    clientsMap[name].totalSpent += inv.total_amount;
  });
  
  quotations.forEach(quo => {
    const name = quo.client_name || 'Unknown Client';
    if (!clientsMap[name]) clientsMap[name] = { name, invoices: [], quotations: [], totalSpent: 0 };
    clientsMap[name].quotations.push(quo);
  });

  const clients = Object.values(clientsMap).sort((a, b) => b.totalSpent - a.totalSpent);

  const handlePreview = async (docStr, type) => {
    try {
      const data = JSON.parse(docStr);
      const url = await generateInvoicePDF(data, 'blob', type);
      setPreviewUrl(url);
      setPreviewType(type);
    } catch (e) {
      console.error(e);
      alert('Could not render document. Data might be corrupted or missing.');
    }
  };

  const handleDownload = async (docStr, type) => {
    try {
      const data = JSON.parse(docStr);
      await generateInvoicePDF(data, 'save', type);
    } catch (e) {
      console.error(e);
      alert('Could not download document.');
    }
  };

  if (previewUrl) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-brand-100 shadow-sm">
          <button onClick={() => setPreviewUrl(null)} className="flex items-center gap-2 text-slate-500 hover:text-brand-700 font-bold transition-colors">
            <ArrowLeft size={18} /> Back to Customer
          </button>
          <div className="flex gap-3">
            <button onClick={() => window.open(previewUrl, '_blank')} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-colors">
              <Eye size={18} /> Open in Browser
            </button>
          </div>
        </div>
        <iframe src={previewUrl} title="Document Preview" className="w-full h-[80vh] rounded-2xl border border-brand-200 shadow-sm" />
      </div>
    );
  }

  if (selectedClient) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-brand-100 shadow-sm">
          <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-slate-500 hover:text-brand-700 font-bold transition-colors">
            <ArrowLeft size={18} /> Back to Customers
          </button>
          <div>
            <h2 className="text-xl font-black text-brand-900">{selectedClient.name}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoices List */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
            <div className="bg-brand-50/50 p-4 border-b border-brand-100 flex items-center gap-2">
              <FileText className="text-brand-600" size={20} />
              <h3 className="font-bold text-brand-900">Invoices ({selectedClient.invoices.length})</h3>
            </div>
            <div className="divide-y divide-brand-50">
              {selectedClient.invoices.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium">No invoices found.</div>
              ) : (
                selectedClient.invoices.map(inv => (
                  <div key={inv.id} className="p-4 hover:bg-brand-50/30 transition-colors flex justify-between items-center">
                    <div>
                      <p className="font-bold text-brand-900">{inv.invoice_no || `INV-${inv.id}`}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {new Date(inv.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="font-black text-slate-700">₹{inv.total_amount.toLocaleString()}</p>
                      {inv.data && (
                        <div className="flex gap-2">
                          <button onClick={() => handlePreview(inv.data, 'TAX INVOICE')} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg" title="Preview">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleDownload(inv.data, 'TAX INVOICE')} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg" title="Download">
                            <Download size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quotations List */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
            <div className="bg-brand-50/50 p-4 border-b border-brand-100 flex items-center gap-2">
              <Receipt className="text-brand-600" size={20} />
              <h3 className="font-bold text-brand-900">Quotations ({selectedClient.quotations.length})</h3>
            </div>
            <div className="divide-y divide-brand-50">
              {selectedClient.quotations.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium">No quotations found.</div>
              ) : (
                selectedClient.quotations.map(quo => (
                  <div key={quo.id} className="p-4 hover:bg-brand-50/30 transition-colors flex justify-between items-center">
                    <div>
                      <p className="font-bold text-brand-900">{quo.invoice_no || `QT-${quo.id}`}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar size={12} /> {new Date(quo.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="font-black text-slate-700">₹{quo.total_amount.toLocaleString()}</p>
                      {quo.data && (
                        <div className="flex gap-2">
                          <button onClick={() => handlePreview(quo.data, 'QUOTATION')} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg" title="Preview">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleDownload(quo.data, 'QUOTATION')} className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg" title="Download">
                            <Download size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 tracking-tight">Customer Directory</h2>
          <p className="text-slate-500 text-sm mt-1">View your clients and their document history</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedClient(client)}
              className="bg-white rounded-2xl border border-brand-100 shadow-sm p-5 hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xl group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-brand-900 text-lg truncate w-40">{client.name}</h3>
                  <p className="text-xs font-medium text-brand-500">{client.invoices.length} Invoices • {client.quotations.length} Quotes</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-brand-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Billed</span>
                <span className="font-black text-brand-700">₹{client.totalSpent.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-brand-100 border-dashed">
              <Users size={48} className="mx-auto text-brand-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No Customers Yet</h3>
              <p className="text-slate-500 text-sm mt-1">Generate and save an invoice or quotation to see it here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
