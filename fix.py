import re

def fix(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the corrupted span tag and replace it
    content = re.sub(
        r'<span className=\{[\s\t]*ext-\[10px\] font-bold px-2 py-0\.5 rounded-full \}>\{doc\.docType\}</span>',
        r'<span className={	ext-[10px] font-bold px-2 py-0.5 rounded-full }>{doc.docType}</span>',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix(r'd:\Beam_ERP_New\frontend\src\components\Invoices.jsx')
fix(r'd:\Beam_ERP_New\frontend\src\components\Quotations.jsx')
print("Fixed")
