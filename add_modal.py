import re

def update_invoice(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add History state and fetch logic
    state_injection = """
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
"""
    
    # Replace existing material fetch with the new combined one
    content = re.sub(
        r"const \[dbMaterials, setDbMaterials\].*?catch\(console\.error\);\s*\}, \[\]\);", 
        state_injection.strip(), 
        content, 
        flags=re.DOTALL
    )

    # Add View History Button next to Client Name
    btn_html = """
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Client Name</label>
                  {invoice.clientName && (
                    <button type="button" onClick={() => setShowHistory(true)} className="text-xs text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1">
                      <Eye size={12}/> View History
                    </button>
                  )}
                </div>
                <input required name="clientName" value={invoice.clientName}"""
                
    content = re.sub(
        r"<label className=\"block text-xs font-bold text-slate-500 uppercase mb-1\.5\">Client Name</label>\s*<input required name=\"clientName\" value=\{invoice\.clientName\}",
        btn_html.strip(),
        content
    )

    # Add Modal at the end of the return statement
    modal_html = """
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-brand-900">Document History for: {invoice.clientName}</h3>
              <button onClick={() => setShowHistory(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={20}/></button>
            </div>
            <div className="p-4 overflow-y-auto">
              {historyDocs.filter(d => (d.client_name || '').toLowerCase() === (invoice.clientName || '').toLowerCase()).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No past documents found for this client.</div>
              ) : (
                <div className="space-y-3">
                  {historyDocs.filter(d => (d.client_name || '').toLowerCase() === (invoice.clientName || '').toLowerCase())
                    .sort((a,b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
                    .map(doc => (
                    <div key={doc.id + doc.docType} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:shadow-sm transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={	ext-[10px] font-bold px-2 py-0.5 rounded-full }>{doc.docType}</span>
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
"""
    content = content.replace("    </div>\n  );\n", modal_html)
    content = content.replace("import { ArrowLeft", "import { ArrowLeft, X")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_invoice(r'd:\Beam_ERP_New\frontend\src\components\Invoices.jsx')

# Quotations
def update_quote(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    state_injection = """
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
"""
    
    content = re.sub(
        r"const \[dbMaterials, setDbMaterials\].*?catch\(console\.error\);\s*\}, \[\]\);", 
        state_injection.strip(), 
        content, 
        flags=re.DOTALL
    )

    btn_html = """
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Client Name</label>
                  {quote.clientName && (
                    <button type="button" onClick={() => setShowHistory(true)} className="text-xs text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1">
                      <Eye size={12}/> View History
                    </button>
                  )}
                </div>
                <input required name="clientName" value={quote.clientName}"""
                
    content = re.sub(
        r"<label className=\"block text-xs font-bold text-slate-500 uppercase mb-1\.5\">Client Name</label>\s*<input required name=\"clientName\" value=\{quote\.clientName\}",
        btn_html.strip(),
        content
    )

    modal_html = """
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
                          <span className={	ext-[10px] font-bold px-2 py-0.5 rounded-full }>{doc.docType}</span>
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
"""
    content = content.replace("    </div>\n  );\n", modal_html)
    content = content.replace("import { ArrowLeft", "import { ArrowLeft, X")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_quote(r'd:\Beam_ERP_New\frontend\src\components\Quotations.jsx')
print("Modals added")
